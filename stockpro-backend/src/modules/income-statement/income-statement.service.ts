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

    // Calculate beginning inventory (at startDate - 1 day)
    const previousDay = new Date(start);
    previousDay.setDate(previousDay.getDate() - 1);
    const beginningInventory = await this.calculateInventoryValue(
      previousDay.toISOString().split('T')[0],
    );

    // Calculate total purchases
    const totalPurchases = await this.calculateTotalPurchases(start, end);

    // Calculate total purchase returns
    const totalPurchaseReturns = await this.calculateTotalPurchaseReturns(
      start,
      end,
    );

    // Calculate net purchases
    const netPurchases = totalPurchases - totalPurchaseReturns;

    // Calculate ending inventory (at endDate)
    const endingInventory = await this.calculateInventoryValue(endDate);

    // Calculate COGS
    const cogs = beginningInventory + netPurchases - endingInventory;

    // Calculate gross profit
    const grossProfit = netSales - cogs;

    // Calculate expenses by type
    const expensesByType = await this.calculateExpensesByType(start, end);

    // Extract expense amounts by type
    const operatingExpenses = expensesByType['مصاريف تشغيلية'] || 0;
    const marketingExpenses = expensesByType['مصاريف تسويقية'] || 0;
    const adminAndGeneralExpenses =
      (expensesByType['مصاريف إدارية'] || 0) +
      (expensesByType['مصاريف عمومية'] || 0);

    const totalExpenses =
      operatingExpenses + marketingExpenses + adminAndGeneralExpenses;

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
      operatingExpenses,
      marketingExpenses,
      adminAndGeneralExpenses,
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
        subtotal: true,
      },
    });

    return result._sum.subtotal || 0;
  }

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
        subtotal: true,
      },
    });

    return result._sum.subtotal || 0;
  }

  private async calculateExpensesByType(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    // Get payment vouchers with expense type
    const vouchers = await this.prisma.paymentVoucher.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        entityType: 'expense',
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

  private async calculateInventoryValue(targetDate: string): Promise<number> {
    // Simplified: just return the current stock value
    // TODO: Implement proper inventory tracking with transactions if needed
    const items = await this.prisma.item.findMany();

    let totalValue = 0;
    for (const item of items) {
      if (item.stock > 0) {
        totalValue += item.stock * item.purchasePrice;
      }
    }

    return totalValue;
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
