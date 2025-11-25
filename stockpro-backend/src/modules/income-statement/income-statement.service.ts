import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { IncomeStatementResponse } from './dtos/response/income-statement.response';

@Injectable()
export class IncomeStatementService {
  constructor(private readonly prisma: DatabaseService) {}

  async getIncomeStatement(
    startDate: string,
    endDate: string,
  ): Promise<IncomeStatementResponse> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Calculate total sales
    const totalSales = await this.calculateTotalSales(start, end);

    // Calculate total sales returns
    const totalSalesReturns = await this.calculateTotalSalesReturns(start, end);

    // Calculate net sales
    const netSales = totalSales - totalSalesReturns;

    // Calculate beginning inventory (before startDate - at the end of the day before start date)
    // Valuation is based on the last purchase price on or before the day before start date
    const dayBeforeStart = new Date(start);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const dayBeforeStartString = dayBeforeStart.toISOString().split('T')[0];
    const beginningInventory = await this.calculateInventoryValue(
      dayBeforeStartString,
      false, // include all transactions up to and including the day before start date
    );

    // Calculate total purchases (net of tax - subtotal only, excluding tax)
    const totalPurchases = await this.calculateTotalPurchases(start, end);

    // Calculate total purchase returns (net of tax - subtotal only, excluding tax)
    const totalPurchaseReturns = await this.calculateTotalPurchaseReturns(
      start,
      end,
    );

    // Calculate net purchases: Total purchase invoices minus total purchase returns (both net of tax)
    const netPurchases = totalPurchases - totalPurchaseReturns;

    // Calculate ending inventory (at endDate)
    // Valuation is based on the last purchase price before or on the end date
    const endingInventory = await this.calculateInventoryValue(endDate);

    // Calculate COGS
    const cogs = beginningInventory + netPurchases - endingInventory;

    // Calculate gross profit
    const grossProfit = netSales - cogs;

    // Calculate expenses by type
    const expensesByType = await this.calculateExpensesByType(start, end);

    // Get all expense types from database to ensure all types are included
    const allExpenseTypes = await this.prisma.expenseType.findMany({
      orderBy: { name: 'asc' },
    });

    // Initialize all expense types with 0 if they don't have expenses
    const expensesByTypeComplete: Record<string, number> = {};
    for (const expenseType of allExpenseTypes) {
      expensesByTypeComplete[expenseType.name] =
        expensesByType[expenseType.name] || 0;
    }

    // Calculate total expenses by summing all expense type values
    const totalExpenses = Object.values(expensesByTypeComplete).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Calculate net profit
    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      totalSalesReturns,
      netSales,
      beginningInventory,
      totalPurchases,
      totalPurchaseReturns,
      netPurchases,
      endingInventory,
      cogs,
      grossProfit,
      expensesByType: expensesByTypeComplete,
      totalExpenses,
      netProfit,
    };
  }

  private async calculateTotalSales(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.salesInvoice.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        subtotal: true,
      },
    });

    return result._sum.subtotal || 0;
  }

  private async calculateTotalSalesReturns(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.salesReturn.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        subtotal: true,
      },
    });

    return result._sum.subtotal || 0;
  }

  /**
   * Calculate total purchase invoices during the search date period
   * Returns subtotal only (net of tax - excludes tax amount)
   */
  private async calculateTotalPurchases(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.purchaseInvoice.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        subtotal: true, // Subtotal is before tax (net of tax)
      },
    });

    return result._sum.subtotal || 0;
  }

  /**
   * Calculate total purchase returns during the search date period
   * Returns subtotal only (net of tax - excludes tax amount)
   */
  private async calculateTotalPurchaseReturns(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.purchaseReturn.aggregate({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        subtotal: true, // Subtotal is before tax (net of tax)
      },
    });

    return result._sum.subtotal || 0;
  }

  private async calculateExpensesByType(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    // Get payment vouchers with expense type (both 'expense' and 'expense-Type')
    const vouchers = await this.prisma.paymentVoucher.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        entityType: {
          in: ['expense', 'expense-Type'],
        },
      },
      include: {
        expenseCode: {
          include: {
            expenseType: true,
          },
        },
      },
    });

    // Group by expense type
    const expensesByType: Record<string, number> = {};

    for (const voucher of vouchers) {
      if (voucher.expenseCode?.expenseType?.name) {
        const typeName = voucher.expenseCode.expenseType.name;
        expensesByType[typeName] =
          (expensesByType[typeName] || 0) + voucher.amount;
      }
    }

    return expensesByType;
  }

  /**
   * Calculate total inventory valuation at a specific date
   * Uses the last purchase price before or on the target date for each item
   * @param targetDate - The date to calculate inventory valuation for (format: YYYY-MM-DD)
   * @param excludeTargetDate - If true, excludes transactions on the target date (for beginning inventory)
   * @returns Total inventory value based on last purchase prices
   */
  private async calculateInventoryValue(
    targetDate: string,
    excludeTargetDate: boolean = false,
  ): Promise<number> {
    const targetDateTime = new Date(targetDate);
    targetDateTime.setHours(23, 59, 59, 999);

    // Get all items
    const items = await this.prisma.item.findMany({
      where: {
        type: 'STOCKED', // Only calculate for stocked items
      },
    });

    let totalValue = 0;

    for (const item of items) {
      // Calculate inventory balance at target date
      const balance = await this.calculateItemBalanceAtDate(
        item.id,
        item.code,
        targetDateTime,
        excludeTargetDate,
      );

      if (balance > 0) {
        // Find the last purchase price before or on the target date
        const lastPurchasePrice = await this.getLastPurchasePriceBeforeDate(
          item.code,
          targetDateTime,
        );

        // Use last purchase price if found, otherwise fall back to item's current purchase price
        const price = lastPurchasePrice || item.purchasePrice || 0;

        totalValue += balance * price;
      }
    }

    return totalValue;
  }

  /**
   * Calculate the total inventory balance for an item at a specific date
   * across all stores
   * @param excludeTargetDate - If true, excludes transactions on the target date (uses lt instead of lte)
   */
  private async calculateItemBalanceAtDate(
    itemId: string,
    itemCode: string,
    targetDate: Date,
    excludeTargetDate: boolean = false,
  ): Promise<number> {
    // Start with opening balances from all StoreItems
    const storeItems = await this.prisma.storeItem.findMany({
      where: {
        itemId,
      },
    });

    let balance = storeItems.reduce(
      (sum, si) => sum + (si.openingBalance || 0),
      0,
    );

    // Determine date filter: use lt (strictly less than) if excluding target date, otherwise lte
    const dateFilter = excludeTargetDate
      ? { lt: targetDate }
      : { lte: targetDate };

    // Add quantities from PurchaseInvoices (before or on target date)
    // Include all purchase invoices regardless of branch for company-wide income statement
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        date: dateFilter,
      },
      select: {
        items: true,
      },
    });

    for (const inv of purchaseInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          balance += invItem.qty || 0;
        }
      }
    }

    // Add quantities from SalesReturns (before or on target date)
    // Include all sales returns regardless of branch for company-wide income statement
    const salesReturns = await this.prisma.salesReturn.findMany({
      where: {
        date: dateFilter,
      },
      select: {
        items: true,
      },
    });

    for (const ret of salesReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === itemCode) {
          balance += retItem.qty || 0;
        }
      }
    }

    // Add quantities from StoreReceiptVouchers (before or on target date)
    const storeReceiptVouchers = await this.prisma.storeReceiptVoucher.findMany(
      {
        where: {
          date: dateFilter,
        },
        include: {
          items: {
            where: {
              itemId,
            },
          },
        },
      },
    );

    for (const voucher of storeReceiptVouchers) {
      for (const voucherItem of voucher.items) {
        balance += voucherItem.quantity || 0;
      }
    }

    // Subtract quantities from SalesInvoices (before or on target date)
    // Include all sales invoices regardless of branch for company-wide income statement
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        date: dateFilter,
      },
      select: {
        items: true,
      },
    });

    for (const inv of salesInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          balance -= invItem.qty || 0;
        }
      }
    }

    // Subtract quantities from PurchaseReturns (before or on target date)
    // Include all purchase returns regardless of branch for company-wide income statement
    const purchaseReturns = await this.prisma.purchaseReturn.findMany({
      where: {
        date: dateFilter,
      },
      select: {
        items: true,
      },
    });

    for (const ret of purchaseReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === itemCode) {
          balance -= retItem.qty || 0;
        }
      }
    }

    // Subtract quantities from StoreIssueVouchers (before or on target date)
    const storeIssueVouchers = await this.prisma.storeIssueVoucher.findMany({
      where: {
        date: dateFilter,
      },
      include: {
        items: {
          where: {
            itemId,
          },
        },
      },
    });

    for (const voucher of storeIssueVouchers) {
      for (const voucherItem of voucher.items) {
        balance -= voucherItem.quantity || 0;
      }
    }

    // Note: Store transfers don't affect total inventory balance
    // (they just move items between stores)

    return Math.max(0, balance); // Ensure non-negative balance
  }

  /**
   * Get the last purchase price for an item before or on a specific date
   * Searches purchase invoices in descending date order to find the most recent purchase
   * @param itemCode - The item code to find the purchase price for
   * @param targetDate - The date to search up to (inclusive)
   * @returns The last purchase price before or on the target date, or null if not found
   */
  private async getLastPurchasePriceBeforeDate(
    itemCode: string,
    targetDate: Date,
  ): Promise<number | null> {
    // Get all purchase invoices before or on target date, ordered by date descending
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        date: {
          lte: targetDate,
        },
      },
      select: {
        date: true,
        items: true,
      },
      orderBy: {
        date: 'desc', // Most recent first
      },
    });

    // Find the most recent purchase price for this item
    for (const inv of purchaseInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null; // No purchase found before this date
  }

  private async getItemTransactions(
    itemId: string,
    itemCode: string,
    targetDate: string,
  ): Promise<Array<{ type: string; qty: number }>> {
    const transactions: Array<{ type: string; qty: number }> = [];

    // Get sales invoices
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        date: {
          lte: new Date(targetDate),
        },
      },
    });

    for (const inv of salesInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          transactions.push({ type: 'sales_invoice', qty: invItem.qty });
        }
      }
    }

    // Get sales returns
    const salesReturns = await this.prisma.salesReturn.findMany({
      where: {
        date: {
          lte: new Date(targetDate),
        },
      },
    });

    for (const ret of salesReturns) {
      const items = ret.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          transactions.push({ type: 'sales_return', qty: invItem.qty });
        }
      }
    }

    // Get purchase invoices
    const purchaseInvoices = await this.prisma.$queryRawUnsafe<
      Array<{ items: any }>
    >(
      `
      SELECT items
      FROM "PurchaseInvoice"
      WHERE date <= $1
    `,
      targetDate,
    );

    for (const inv of purchaseInvoices) {
      const items = inv.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          transactions.push({ type: 'purchase_invoice', qty: invItem.qty });
        }
      }
    }

    // Get purchase returns
    const purchaseReturns = await this.prisma.$queryRawUnsafe<
      Array<{ items: any }>
    >(
      `
      SELECT items
      FROM "PurchaseReturn"
      WHERE date <= $1
    `,
      targetDate,
    );

    for (const ret of purchaseReturns) {
      const items = ret.items as any[];
      for (const invItem of items) {
        if (invItem.id === itemCode) {
          transactions.push({ type: 'purchase_return', qty: invItem.qty });
        }
      }
    }

    return transactions;
  }
}
