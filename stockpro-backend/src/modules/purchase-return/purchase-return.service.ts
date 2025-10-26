import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseReturnRequest } from './dtos/request/create-purchase-return.request';
import { UpdatePurchaseReturnRequest } from './dtos/request/update-purchase-return.request';
import { PurchaseReturnResponse } from './dtos/response/purchase-return.response';

@Injectable()
export class PurchaseReturnService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    data: CreatePurchaseReturnRequest,
    userId: string,
    branchId?: string,
  ): Promise<PurchaseReturnResponse> {
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

    // Create return
    const returnRecord = await this.prisma.purchaseReturn.create({
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

    // Update stock for each item (decrease stock for returns)
    for (const item of data.items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock: {
            decrement: item.qty,
          },
        },
      });
    }

    return returnRecord as PurchaseReturnResponse;
  }

  async findAll(search?: string): Promise<PurchaseReturnResponse[]> {
    const returns = await this.prisma.purchaseReturn.findMany({
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

    return returns as PurchaseReturnResponse[];
  }

  async findOne(id: string): Promise<PurchaseReturnResponse> {
    const returnRecord = await this.prisma.purchaseReturn.findUnique({
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

    if (!returnRecord) {
      throw new NotFoundException('Purchase return not found');
    }

    return returnRecord as PurchaseReturnResponse;
  }

  async update(
    id: string,
    data: UpdatePurchaseReturnRequest,
  ): Promise<PurchaseReturnResponse> {
    const existingReturn = await this.prisma.purchaseReturn.findUnique({
      where: { id },
    });

    if (!existingReturn) {
      throw new NotFoundException('Purchase return not found');
    }

    // Get old items to restore stock
    const oldItems = existingReturn.items as any[];

    // Calculate new totals
    const items = data.items || (existingReturn.items as any[]) || [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const discount =
      data.discount !== undefined
        ? data.discount
        : existingReturn.discount || 0;
    const tax = subtotal * 0.15; // 15% VAT
    const net = subtotal - discount + tax;

    // Update return
    const returnRecord = await this.prisma.purchaseReturn.update({
      where: { id },
      data: {
        ...data,
        items: (data.items || existingReturn.items) as any,
        subtotal,
        discount,
        tax,
        net,
        date: data.date ? new Date(data.date) : existingReturn.date,
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
            increment: oldItem.qty,
          },
        },
      });
    }

    // Apply new stock changes (decrease for returns)
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

    return returnRecord as PurchaseReturnResponse;
  }

  async remove(id: string): Promise<void> {
    const returnRecord = await this.prisma.purchaseReturn.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Purchase return not found');
    }

    // Restore stock
    const items = returnRecord.items as any[];
    for (const item of items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock: {
            increment: item.qty,
          },
        },
      });
    }

    await this.prisma.purchaseReturn.delete({
      where: { id },
    });
  }

  private async generateNextCode(): Promise<string> {
    const lastReturn = await this.prisma.purchaseReturn.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!lastReturn) {
      return 'PRTN-00001';
    }

    const lastNumber = parseInt(lastReturn.code.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `PRTN-${nextNumber.toString().padStart(5, '0')}`;
  }
}
