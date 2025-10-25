import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseInvoiceRequest } from './dtos/request/create-purchase-invoice.request';
import { UpdatePurchaseInvoiceRequest } from './dtos/request/update-purchase-invoice.request';
import { PurchaseInvoiceResponse } from './dtos/response/purchase-invoice.response';

@Injectable()
export class PurchaseInvoiceService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreatePurchaseInvoiceRequest, userId: string, branchId?: string): Promise<PurchaseInvoiceResponse> {
    // Generate next code
    const code = await this.generateNextCode();

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const discount = data.discount || 0;
    const tax = subtotal * 0.15; // 15% VAT
    const net = subtotal - discount + tax;

    // Create invoice
    const invoice = await this.prisma.purchaseInvoice.create({
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

    // Update stock for each item (increase stock for purchases)
    for (const item of data.items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock: {
            increment: item.qty,
          },
          purchasePrice: item.price, // Update purchase price
        },
      });
    }

    return invoice as PurchaseInvoiceResponse;
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

    return invoices as PurchaseInvoiceResponse[];
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

    return invoice as PurchaseInvoiceResponse;
  }

  async update(id: string, data: UpdatePurchaseInvoiceRequest): Promise<PurchaseInvoiceResponse> {
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
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const discount = data.discount !== undefined ? data.discount : (existingInvoice.discount || 0);
    const tax = subtotal * 0.15; // 15% VAT
    const net = subtotal - discount + tax;

    // Update invoice
    const invoice = await this.prisma.purchaseInvoice.update({
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

    // Restore old stock and apply new stock changes
    for (const oldItem of oldItems) {
      await this.prisma.item.update({
        where: { code: oldItem.id },
        data: {
          stock: {
            decrement: oldItem.qty,
          },
        },
      });
    }

    // Apply new stock changes
    for (const item of items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock: {
            increment: item.qty,
          },
          purchasePrice: item.price,
        },
      });
    }

    return invoice as PurchaseInvoiceResponse;
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Restore stock
    const items = invoice.items as any[];
    for (const item of items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock: {
            decrement: item.qty,
          },
        },
      });
    }

    await this.prisma.purchaseInvoice.delete({
      where: { id },
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
