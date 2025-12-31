import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { IncomeStatementResponse } from './dtos/response/income-statement.response';

@Injectable()
export class IncomeStatementService {
  constructor(private readonly prisma: DatabaseService) {}

  async getIncomeStatement(
    companyId: string,
    startDate: string,
    endDate: string,
  ): Promise<IncomeStatementResponse> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    // Calculate total sales
    const totalSales = await this.calculateTotalSales(companyId, start, end);

    // Calculate total sales returns
    const totalSalesReturns = await this.calculateTotalSalesReturns(companyId, start, end);

    // Calculate net sales
    const netSales = totalSales - totalSalesReturns;

    // Calculate beginning inventory (before startDate - at the end of the day before start date)
    // Balance and price are both calculated at the day before startDate
    // This finds the earliest purchase before the start date
    const dayBeforeStart = new Date(start);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const dayBeforeStartString = dayBeforeStart.toISOString().split('T')[0];
    const endDateString = end.toISOString().split('T')[0];
    const beginningInventory = await this.calculateInventoryValue(
      companyId,
      dayBeforeStartString, // Balance calculated at day before startDate
      dayBeforeStartString, // Price calculated at day before startDate
    );

    // Calculate total purchases (net of tax - subtotal only, excluding tax)
    const totalPurchases = await this.calculateTotalPurchases(companyId, start, end);

    // Calculate total purchase returns (net of tax - subtotal only, excluding tax)
    const totalPurchaseReturns = await this.calculateTotalPurchaseReturns(
      companyId,
      start,
      end,
    );

    // Calculate net purchases: Total purchase invoices minus total purchase returns (both net of tax)
    const netPurchases = totalPurchases - totalPurchaseReturns;

    // Calculate ending inventory (at endDate)
    // Valuation is based on the last purchase price before or on the end date
    // Both balance and price are calculated at endDate
    const endingInventory = await this.calculateInventoryValue(companyId, endDateString);

    // Calculate COGS
    const cogs = beginningInventory + netPurchases - endingInventory;

    // Calculate gross profit
    const grossProfit = netSales - cogs;

    // Calculate expenses by type
    const expensesByType = await this.calculateExpensesByType(companyId, start, end);

    // Get all expense types from database to ensure all types are included
    const allExpenseTypes = await this.prisma.expenseType.findMany({
      where: { companyId },
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
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.salesInvoice.aggregate({
      where: {
        companyId,
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
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.salesReturn.aggregate({
      where: {
        companyId,
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
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.purchaseInvoice.aggregate({
      where: {
        companyId,
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
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.purchaseReturn.aggregate({
      where: {
        companyId,
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
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    // Get payment vouchers with expense type (both 'expense' and 'expense-Type')
    const vouchers = await this.prisma.paymentVoucher.findMany({
      where: {
        companyId,
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
        // For "expense-Type" vouchers, use priceBeforeTax if available, otherwise use amount
        // For regular "expense" vouchers, use amount
        const expenseAmount = 
          voucher.entityType === 'expense-Type' && voucher.priceBeforeTax !== null
            ? voucher.priceBeforeTax
            : voucher.amount;
        expensesByType[typeName] =
          (expensesByType[typeName] || 0) + expenseAmount;
      }
    }

    return expensesByType;
  }

  /**
   * Calculate total inventory valuation
   * Uses separate dates for balance calculation and price lookup (matching InventoryValuationReport)
   * @param balanceDate - The date to calculate inventory balance for (format: YYYY-MM-DD)
   * @param priceDate - The date to lookup purchase price for (format: YYYY-MM-DD)
   * @returns Total inventory value based on balance at balanceDate and price at priceDate
   */
  private async calculateInventoryValue(
    companyId: string,
    balanceDate: string,
    priceDate?: string,
  ): Promise<number> {
    const balanceDateTime = new Date(balanceDate);
    balanceDateTime.setHours(23, 59, 59, 999);

    // Use priceDate if provided, otherwise use balanceDate (for ending inventory)
    const priceDateTime = priceDate
      ? new Date(priceDate)
      : new Date(balanceDate);
    priceDateTime.setHours(23, 59, 59, 999);

    // Get all items
    const items = (await this.prisma.item.findMany({
      where: {
        companyId,
        type: 'STOCKED', // Only calculate for stocked items
      },
    })) as unknown as Array<{
      id: string;
      code: string;
      purchasePrice: number | null;
      initialPurchasePrice: number | null;
    }>;

    let totalValue = 0;

    for (const item of items) {
      // Calculate inventory balance at balanceDate
      const balance = await this.calculateItemBalanceAtDate(
        companyId,
        item.id,
        item.code,
        balanceDateTime,
        false, // Include all transactions up to and including balanceDate
      );

      // Calculate inventory value for all balances (including negative ones)
      // Negative balances will result in negative values, which will be subtracted from totalValue
      if (balance !== 0) {
        // Find the last purchase price before or on the priceDate
        const lastPurchasePrice = await this.getLastPurchasePriceBeforeDate(
          companyId,
          item.code,
          priceDateTime,
        );

        // Use last purchase price if found, otherwise fall back to item's current purchase price
        const fallbackPrice =
          item.initialPurchasePrice ?? item.purchasePrice ?? 0;
        const price = lastPurchasePrice ?? fallbackPrice;

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
    companyId: string,
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
        companyId,
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
        companyId,
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
          companyId,
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
        companyId,
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
        companyId,
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
        companyId,
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

    return balance; // Return actual balance (can be negative)
  }

  /**
   * Get the last purchase price for an item before or on a specific date
   * Searches purchase invoices in descending date order to find the most recent purchase
   * @param itemCode - The item code to find the purchase price for
   * @param targetDate - The date to search up to (inclusive)
   * @returns The last purchase price before or on the target date, or null if not found
   */
  private async getLastPurchasePriceBeforeDate(
    companyId: string,
    itemCode: string,
    targetDate: Date,
  ): Promise<number | null> {
    // Get all purchase invoices before or on target date, ordered by date descending
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        companyId,
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
    companyId: string,
    itemId: string,
    itemCode: string,
    targetDate: string,
  ): Promise<Array<{ type: string; qty: number }>> {
    const transactions: Array<{ type: string; qty: number }> = [];

    // Get sales invoices
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        companyId,
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
        companyId,
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
      WHERE "companyId" = $1 AND date <= $2
    `,
      companyId,
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
      WHERE "companyId" = $1 AND date <= $2
    `,
      companyId,
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
