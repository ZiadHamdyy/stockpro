import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseInvoiceRequest } from './dtos/request/create-purchase-invoice.request';
import { UpdatePurchaseInvoiceRequest } from './dtos/request/update-purchase-invoice.request';
import { PurchaseInvoiceResponse } from './dtos/response/purchase-invoice.response';
import { bufferToDataUri } from '../../common/utils/image-converter';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';

@Injectable()
export class PurchaseInvoiceService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Converts user data from database format to response format
   * Converts Buffer image to base64 data URI
   */
  private convertUserForResponse(user: any) {
    return {
      ...user,
      image: user.image ? bufferToDataUri(user.image) : null,
    };
  }

  async create(
    data: CreatePurchaseInvoiceRequest,
    userId: string,
    branchId?: string,
  ): Promise<PurchaseInvoiceResponse> {
    // Validations
    if (!data.supplierId) {
      throwHttp(422, ERROR_CODES.INV_SUPPLIER_REQUIRED, 'Supplier is required');
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

    // Generate next code
    const code = await this.generateNextCode();

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const discount = data.discount || 0;
    const tax = subtotal * 0.15; // 15% VAT
    const net = subtotal - discount + tax;

    const created = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.purchaseInvoice.create({
        data: {
          code,
          date: data.date ? new Date(data.date) : new Date(),
          supplierId: data.supplierId,
          items: data.items as any,
          subtotal,
          discount,
          tax,
          net,
          paymentMethod: data.paymentMethod,
          paymentTargetType: data.paymentTargetType,
          paymentTargetId: data.paymentTargetId,
          notes: data.notes,
          userId,
          branchId,
        },
        include: {
          supplier: true,
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
          branch: true,
        },
      });

      for (const item of data.items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { increment: item.qty }, purchasePrice: item.price },
        });
      }

      return inv;
    });

    return {
      ...created,
      user: this.convertUserForResponse(created.user),
    } as PurchaseInvoiceResponse;
  }

  async findAll(search?: string): Promise<PurchaseInvoiceResponse[]> {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { supplier: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {},
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(invoice => ({
      ...invoice,
      user: this.convertUserForResponse(invoice.user),
    })) as PurchaseInvoiceResponse[];
  }

  async findOne(id: string): Promise<PurchaseInvoiceResponse> {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
        branch: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    return {
      ...invoice,
      user: this.convertUserForResponse(invoice.user),
    } as PurchaseInvoiceResponse;
  }

  async update(
    id: string,
    data: UpdatePurchaseInvoiceRequest,
  ): Promise<PurchaseInvoiceResponse> {
    const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Get old items to restore stock
    const oldItems = existingInvoice.items as any[];

    // Calculate new totals
    const items = data.items || (existingInvoice.items as any[]) || [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const discount =
      data.discount !== undefined
        ? data.discount
        : existingInvoice.discount || 0;
    const tax = subtotal * 0.15; // 15% VAT
    const net = subtotal - discount + tax;

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const oldItem of oldItems) {
        await tx.item.update({
          where: { code: oldItem.id },
          data: { stock: { decrement: oldItem.qty } },
        });
      }

      const inv = await tx.purchaseInvoice.update({
        where: { id },
        data: {
          ...data,
          items: (data.items || existingInvoice.items) as any,
          subtotal,
          discount,
          tax,
          net,
          date: data.date ? new Date(data.date) : existingInvoice.date,
        },
        include: {
          supplier: true,
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
          branch: true,
        },
      });

      for (const item of items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { increment: item.qty }, purchasePrice: item.price },
        });
      }

      return inv;
    });

    return {
      ...updated,
      user: this.convertUserForResponse(updated.user),
    } as PurchaseInvoiceResponse;
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const items = invoice.items as any[];
      for (const item of items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      await tx.purchaseInvoice.delete({ where: { id } });
    });
  }

  private async generateNextCode(): Promise<string> {
    const lastInvoice = await this.prisma.purchaseInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!lastInvoice) {
      return 'PUR-00001';
    }

    const lastNumber = parseInt(lastInvoice.code.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `PUR-${nextNumber.toString().padStart(5, '0')}`;
  }
}
