import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseReturnRequest } from './dtos/request/create-purchase-return.request';
import { UpdatePurchaseReturnRequest } from './dtos/request/update-purchase-return.request';
import { PurchaseReturnResponse } from './dtos/response/purchase-return.response';
import { bufferToDataUri } from '../../common/utils/image-converter';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AccountingService } from '../../common/services/accounting.service';

@Injectable()
export class PurchaseReturnService {
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
    data: CreatePurchaseReturnRequest,
    userId: string,
    branchId?: string,
  ): Promise<PurchaseReturnResponse> {
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
      // Validate stock for all items prior to decrement
      for (const item of data.items) {
        const itemRecord = await tx.item.findUnique({ where: { code: item.id } });
        if (!itemRecord) {
          throwHttp(404, ERROR_CODES.INV_ITEM_NOT_FOUND, `Item ${item.id} not found`);
        }
        if (itemRecord.stock < item.qty) {
          throwHttp(409, ERROR_CODES.INV_STOCK_INSUFFICIENT, `Insufficient stock for item ${itemRecord.name}`);
        }
      }

      const ret = await tx.purchaseReturn.create({
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
          user: { select: { id: true, email: true, name: true, image: true } },
          branch: true,
        },
      });

      for (const item of data.items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Apply cash impact if applicable (purchase return increases balance)
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        await AccountingService.applyImpact({
          kind: 'purchase-return',
          amount: net,
          paymentTargetType: data.paymentTargetType as any,
          branchId,
          bankId: data.paymentTargetType === 'bank' ? data.paymentTargetId || null : null,
          tx,
        });
      }

      // Apply credit impact if applicable (decrease supplier balance)
      if (data.paymentMethod === 'credit' && data.supplierId) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: { decrement: net } },
        });
      }

      return ret;
    });

    return {
      ...created,
      user: this.convertUserForResponse(created.user),
    } as PurchaseReturnResponse;
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
      orderBy: { createdAt: 'asc' },
    });

    return returns.map(returnInvoice => ({
      ...returnInvoice,
      user: this.convertUserForResponse(returnInvoice.user),
    })) as PurchaseReturnResponse[];
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

    return {
      ...returnRecord,
      user: this.convertUserForResponse(returnRecord.user),
    } as PurchaseReturnResponse;
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

    const updated = await this.prisma.$transaction(async (tx) => {
      // Reverse old stock (increase), then validate new decrements
      for (const oldItem of oldItems) {
        await tx.item.update({
          where: { code: oldItem.id },
          data: { stock: { increment: oldItem.qty } },
        });
      }

      for (const item of items) {
        const itemRecord = await tx.item.findUnique({ where: { code: item.id } });
        if (!itemRecord) {
          throwHttp(404, ERROR_CODES.INV_ITEM_NOT_FOUND, `Item ${item.id} not found`);
        }
        if (itemRecord.stock < item.qty) {
          throwHttp(409, ERROR_CODES.INV_STOCK_INSUFFICIENT, `Insufficient stock for item ${itemRecord.name}`);
        }
      }

      const ret = await tx.purchaseReturn.update({
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
          user: { select: { id: true, email: true, name: true, image: true } },
          branch: true,
        },
      });

      for (const item of items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Reverse previous cash impact if needed
      if (existingReturn.paymentMethod === 'cash' && (existingReturn as any).paymentTargetType) {
        await AccountingService.reverseImpact({
          kind: 'purchase-return',
          amount: (existingReturn as any).net,
          paymentTargetType: (existingReturn as any).paymentTargetType as any,
          branchId: (existingReturn as any).branchId,
          bankId: (existingReturn as any).paymentTargetType === 'bank' ? (existingReturn as any).paymentTargetId : null,
          tx,
        });
      }
      // Reverse previous credit impact if needed
      if (existingReturn.paymentMethod === 'credit' && existingReturn.supplierId) {
        await tx.supplier.update({
          where: { id: existingReturn.supplierId },
          data: { currentBalance: { increment: (existingReturn as any).net } },
        });
      }
      // Apply new cash impact if applicable
      const targetType = (ret as any).paymentMethod === 'cash' ? (ret as any).paymentTargetType : null;
      if (targetType) {
        await AccountingService.applyImpact({
          kind: 'purchase-return',
          amount: (ret as any).net,
          paymentTargetType: targetType as any,
          branchId: (ret as any).branchId,
          bankId: targetType === 'bank' ? (ret as any).paymentTargetId : null,
          tx,
        });
      }
      // Apply new credit impact if applicable (decrease supplier balance)
      if ((ret as any).paymentMethod === 'credit' && (ret as any).supplierId) {
        await tx.supplier.update({
          where: { id: (ret as any).supplierId },
          data: { currentBalance: { decrement: (ret as any).net } },
        });
      }

      return ret;
    });

    return {
      ...updated,
      user: this.convertUserForResponse(updated.user),
    } as PurchaseReturnResponse;
  }

  async remove(id: string): Promise<void> {
    const returnRecord = await this.prisma.purchaseReturn.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Purchase return not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const items = returnRecord.items as any[];
      for (const item of items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { increment: item.qty } },
        });
      }
      // Reverse cash impact if applicable
      if ((returnRecord as any).paymentMethod === 'cash' && (returnRecord as any).paymentTargetType) {
        await AccountingService.reverseImpact({
          kind: 'purchase-return',
          amount: (returnRecord as any).net,
          paymentTargetType: (returnRecord as any).paymentTargetType as any,
          branchId: (returnRecord as any).branchId,
          bankId: (returnRecord as any).paymentTargetType === 'bank' ? (returnRecord as any).paymentTargetId : null,
          tx,
        });
      }
      // Reverse credit impact if applicable (increase supplier balance)
      if ((returnRecord as any).paymentMethod === 'credit' && (returnRecord as any).supplierId) {
        await tx.supplier.update({
          where: { id: (returnRecord as any).supplierId },
          data: { currentBalance: { increment: (returnRecord as any).net } },
        });
      }

      await tx.purchaseReturn.delete({ where: { id } });
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
