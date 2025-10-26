import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSalesInvoiceRequest } from './dtos/request/create-sales-invoice.request';
import { UpdateSalesInvoiceRequest } from './dtos/request/update-sales-invoice.request';
import { SalesInvoiceResponse } from './dtos/response/sales-invoice.response';

@Injectable()
export class SalesInvoiceService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    data: CreateSalesInvoiceRequest,
    userId: string,
  ): Promise<SalesInvoiceResponse> {
    const code = await this.generateNextCode();

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const discount = data.discount || 0;

    // Get company VAT settings
    const company = await this.prisma.company.findFirst();
    const vatRate = company?.vatRate || 0;
    const isVatEnabled = company?.isVatEnabled || false;

    const tax = isVatEnabled ? subtotal * (vatRate / 100) : 0;
    const net = subtotal + tax - discount;

    // Update items with calculated values
    const itemsWithTotals = data.items.map((item) => ({
      ...item,
      taxAmount: isVatEnabled ? item.qty * item.price * (vatRate / 100) : 0,
      total: item.qty * item.price,
    }));

    const salesInvoice = await this.prisma.salesInvoice.create({
      data: {
        code,
        date: data.date ? new Date(data.date) : new Date(),
        customerId: data.customerId,
        items: itemsWithTotals,
        subtotal,
        discount,
        tax,
        net,
        paymentMethod: data.paymentMethod,
        paymentTargetType: data.paymentTargetType,
        paymentTargetId: data.paymentTargetId,
        notes: data.notes,
        userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update stock for each item
    await this.updateStockForItems(data.items, 'decrease');

    return this.mapToResponse(salesInvoice);
  }

  async findAll(search?: string): Promise<SalesInvoiceResponse[]> {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            {
              customer: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return salesInvoices.map((invoice) => this.mapToResponse(invoice));
  }

  async findOne(id: string): Promise<SalesInvoiceResponse> {
    const salesInvoice = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!salesInvoice) {
      throw new NotFoundException('Sales invoice not found');
    }

    return this.mapToResponse(salesInvoice);
  }

  async update(
    id: string,
    data: UpdateSalesInvoiceRequest,
    userId: string,
  ): Promise<SalesInvoiceResponse> {
    try {
      // Get existing invoice to restore stock
      const existingInvoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
      });

      if (existingInvoice) {
        // Restore stock for old items
        await this.updateStockForItems(
          existingInvoice.items as any[],
          'increase',
        );
      }

      // Calculate new totals
      const items = data.items || (existingInvoice?.items as any[]) || [];
      const subtotal = items.reduce(
        (sum, item) => sum + item.qty * item.price,
        0,
      );
      const discount =
        data.discount !== undefined
          ? data.discount
          : existingInvoice?.discount || 0;

      // Get company VAT settings
      const company = await this.prisma.company.findFirst();
      const vatRate = company?.vatRate || 0;
      const isVatEnabled = company?.isVatEnabled || false;

      const tax = isVatEnabled ? subtotal * (vatRate / 100) : 0;
      const net = subtotal + tax - discount;

      // Update items with calculated values
      const itemsWithTotals = items.map((item) => ({
        ...item,
        taxAmount: isVatEnabled ? item.qty * item.price * (vatRate / 100) : 0,
        total: item.qty * item.price,
      }));

      const salesInvoice = await this.prisma.salesInvoice.update({
        where: { id },
        data: {
          ...data,
          items: itemsWithTotals,
          subtotal,
          discount,
          tax,
          net,
          userId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update stock for new items
      await this.updateStockForItems(items, 'decrease');

      return this.mapToResponse(salesInvoice);
    } catch (error) {
      throw new NotFoundException('Sales invoice not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Get invoice to restore stock
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
      });

      if (invoice) {
        // Restore stock
        await this.updateStockForItems(invoice.items as any[], 'increase');
      }

      await this.prisma.salesInvoice.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Sales invoice not found');
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastInvoice = await this.prisma.salesInvoice.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastInvoice) {
      return 'INV-00001';
    }

    const match = lastInvoice.code.match(/INV-(\d+)/);
    if (!match) {
      return 'INV-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `INV-${String(nextNumber).padStart(5, '0')}`;
  }

  private async updateStockForItems(
    items: any[],
    operation: 'increase' | 'decrease',
  ): Promise<void> {
    for (const item of items) {
      const itemRecord = await this.prisma.item.findUnique({
        where: { id: item.id },
      });

      if (itemRecord) {
        const newStock =
          operation === 'increase'
            ? itemRecord.stock + item.qty
            : itemRecord.stock - item.qty;

        await this.prisma.item.update({
          where: { id: item.id },
          data: { stock: newStock },
        });
      }
    }
  }

  private mapToResponse(salesInvoice: any): SalesInvoiceResponse {
    return {
      id: salesInvoice.id,
      code: salesInvoice.code,
      date: salesInvoice.date,
      customerId: salesInvoice.customerId,
      customer: salesInvoice.customer,
      items: salesInvoice.items,
      subtotal: salesInvoice.subtotal,
      discount: salesInvoice.discount,
      tax: salesInvoice.tax,
      net: salesInvoice.net,
      paymentMethod: salesInvoice.paymentMethod,
      paymentTargetType: salesInvoice.paymentTargetType,
      paymentTargetId: salesInvoice.paymentTargetId,
      notes: salesInvoice.notes,
      userId: salesInvoice.userId,
      user: salesInvoice.user,
      branchId: salesInvoice.branchId,
      branch: salesInvoice.branch,
      createdAt: salesInvoice.createdAt,
      updatedAt: salesInvoice.updatedAt,
    };
  }
}
