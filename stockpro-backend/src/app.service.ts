import { Injectable } from '@nestjs/common';
import { DatabaseService } from './configs/database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats() {
    // Calculate total sales invoices net amount
    const salesAggregate = await this.prisma.salesInvoice.aggregate({
      _sum: {
        net: true,
      },
    });

    // Calculate total sales returns net amount
    const returnsAggregate = await this.prisma.salesReturn.aggregate({
      _sum: {
        net: true,
      },
    });

    // Calculate total purchase invoices net amount
    const purchasesAggregate = await this.prisma.purchaseInvoice.aggregate({
      _sum: {
        net: true,
      },
    });

    // Count total items
    const totalItems = await this.prisma.item.count();

    // Count total customers
    const totalCustomers = await this.prisma.customer.count();

    const totalSales = salesAggregate._sum.net || 0;
    const totalReturns = returnsAggregate._sum.net || 0;
    const netSales = totalSales - totalReturns;
    const totalPurchases = purchasesAggregate._sum.net || 0;

    return {
      totalSales,
      totalReturns,
      netSales,
      totalPurchases,
      totalItems,
      totalCustomers,
    };
  }

  async getMonthlyStats() {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear + 1}-01-01`);

    // Get all sales invoices for the current year
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        net: true,
      },
    });

    // Get all sales returns for the current year
    const salesReturns = await this.prisma.salesReturn.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        net: true,
      },
    });

    // Get all purchase invoices for the current year
    const purchaseInvoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        net: true,
      },
    });

    // Get all purchase returns for the current year
    const purchaseReturns = await this.prisma.purchaseReturn.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        net: true,
      },
    });

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      netSales: 0,
      netPurchases: 0,
    }));

    // Aggregate sales by month
    salesInvoices.forEach((invoice) => {
      const month = new Date(invoice.date).getMonth();
      monthlyData[month].netSales += invoice.net;
    });

    // Subtract returns from sales
    salesReturns.forEach((returnDoc) => {
      const month = new Date(returnDoc.date).getMonth();
      monthlyData[month].netSales -= returnDoc.net;
    });

    // Aggregate purchases by month
    purchaseInvoices.forEach((invoice) => {
      const month = new Date(invoice.date).getMonth();
      monthlyData[month].netPurchases += invoice.net;
    });

    // Subtract purchase returns
    purchaseReturns.forEach((returnDoc) => {
      const month = new Date(returnDoc.date).getMonth();
      monthlyData[month].netPurchases -= returnDoc.net;
    });

    return {
      months: monthlyData,
    };
  }

  async getSalesByItemGroup() {
    // Get all sales invoices
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      select: {
        items: true,
      },
    });

    // Get all items to map item codes to group IDs
    const items = await this.prisma.item.findMany({
      select: {
        code: true,
        groupId: true,
      },
    });

    // Create a map of item code to group ID
    const itemToGroupMap = new Map<string, string>();
    items.forEach((item) => {
      itemToGroupMap.set(item.code, item.groupId);
    });

    // Aggregate sales by group
    const groupSales = new Map<string, number>();
    let totalSales = 0;

    salesInvoices.forEach((invoice) => {
      const invoiceItems = invoice.items as any[];
      invoiceItems.forEach((item) => {
        const groupId = itemToGroupMap.get(item.id) || 'uncategorized';
        const itemTotal = item.qty * item.price;
        groupSales.set(groupId, (groupSales.get(groupId) || 0) + itemTotal);
        totalSales += itemTotal;
      });
    });

    // Get item group names
    const itemGroups = await this.prisma.itemGroup.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of group ID to name
    const groupNameMap = new Map<string, string>();
    itemGroups.forEach((group) => {
      groupNameMap.set(group.id, group.name);
    });

    // Build the response
    const result = Array.from(groupSales.entries()).map(([groupId, sales]) => {
      const percentage = totalSales > 0 ? (sales / totalSales) * 100 : 0;
      return {
        groupId,
        groupName: groupId === 'uncategorized' ? 'غير مصنف' : groupNameMap.get(groupId) || 'غير معروف',
        totalSales: sales,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    });

    // Sort by total sales descending
    result.sort((a, b) => b.totalSales - a.totalSales);

    return {
      itemGroups: result,
    };
  }
}
