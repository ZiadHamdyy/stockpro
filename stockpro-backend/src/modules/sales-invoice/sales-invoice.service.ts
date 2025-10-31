import { Injectable, NotFoundException } from '@nestjs/common';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
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
    // Basic validations
    if (!data.customerId) {
      throwHttp(422, ERROR_CODES.INV_CUSTOMER_REQUIRED, 'Customer is required');
    }
    if (!data.items || data.items.length === 0) {
      throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
    }
    if (data.paymentMethod === 'cash') {
      if (!data.paymentTargetType || !data.paymentTargetId) {
        throwHttp(
          422,
          ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
          'Safe or bank is required for cash payments',
        );
      }
    } else if (data.paymentMethod === 'credit') {
      if (data.paymentTargetType || data.paymentTargetId) {
        throwHttp(
          422,
          ERROR_CODES.INV_PAYMENT_ACCOUNT_FOR_CREDIT_NOT_ALLOWED,
          'Payment account must be empty for credit payments',
        );
      }
    }

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

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate stock availability for all items first
      for (const item of data.items) {
        const itemRecord = await tx.item.findUnique({ where: { code: item.id } });
        if (!itemRecord) {
          throwHttp(404, ERROR_CODES.INV_ITEM_NOT_FOUND, `Item ${item.id} not found`);
        }
        if (itemRecord.stock < item.qty) {
          throwHttp(
            409,
            ERROR_CODES.INV_STOCK_INSUFFICIENT,
            `Insufficient stock for item ${itemRecord.name}`,
          );
        }
      }

      const created = await tx.salesInvoice.create({
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
            select: { id: true, name: true, code: true },
          },
          user: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      // Decrease stock
      for (const item of data.items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      return created;
    });

    return this.mapToResponse(result);
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
      // Validate base fields
      const incomingItems = data.items;
      if (incomingItems && incomingItems.length === 0) {
        throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
      }
      if (data.paymentMethod) {
        if (data.paymentMethod === 'cash') {
          if (!data.paymentTargetType || !data.paymentTargetId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
              'Safe or bank is required for cash payments',
            );
          }
        } else if (data.paymentMethod === 'credit') {
          if (data.paymentTargetType || data.paymentTargetId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_FOR_CREDIT_NOT_ALLOWED,
              'Payment account must be empty for credit payments',
            );
          }
        }
      }
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

      const updated = await this.prisma.$transaction(async (tx) => {
        // Restore stock for old items
        if (existingInvoice) {
          for (const oldItem of (existingInvoice.items as any[]) || []) {
            await tx.item.update({
              where: { code: oldItem.id },
              data: { stock: { increment: oldItem.qty } },
            });
          }
        }

        // Validate stock for new items
        for (const item of items) {
          const itemRecord = await tx.item.findUnique({ where: { code: item.id } });
          if (!itemRecord) {
            throwHttp(404, ERROR_CODES.INV_ITEM_NOT_FOUND, `Item ${item.id} not found`);
          }
          if (itemRecord.stock < item.qty) {
            throwHttp(409, ERROR_CODES.INV_STOCK_INSUFFICIENT, `Insufficient stock for item ${itemRecord.name}`);
          }
        }

        const inv = await tx.salesInvoice.update({
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
            customer: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        });

        // Decrease stock for new items
        for (const item of items) {
          await tx.item.update({
            where: { code: item.id },
            data: { stock: { decrement: item.qty } },
          });
        }

        return inv;
      });

      return this.mapToResponse(updated);
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
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock:
            operation === 'increase'
              ? { increment: item.qty }
              : { decrement: item.qty },
        },
      });
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
