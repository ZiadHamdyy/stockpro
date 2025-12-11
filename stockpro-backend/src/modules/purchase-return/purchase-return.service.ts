import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseReturnRequest } from './dtos/request/create-purchase-return.request';
import { UpdatePurchaseReturnRequest } from './dtos/request/update-purchase-return.request';
import { PurchaseReturnResponse } from './dtos/response/purchase-return.response';
import { bufferToDataUri } from '../../common/utils/image-converter';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class PurchaseReturnService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

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
    const returnDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(returnDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create return: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(returnDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create return in a closed fiscal period');
    }

    // Validations
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

    // Get store from branch
    let store: any = null;
    if (branchId) {
      try {
        store = await this.storeService.findByBranchId(branchId);
      } catch (error) {
        // Store not found, will use fallback
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      // Get store in transaction
      if (branchId && !store) {
        store = await tx.store.findFirst({
          where: { branchId },
        });
      }

      // Validate stock for all items prior to decrement
      for (const item of data.items) {
        const itemRecord = await tx.item.findUnique({
          where: { code: item.id },
        });
        if (!itemRecord) {
          throwHttp(
            404,
            ERROR_CODES.INV_ITEM_NOT_FOUND,
            `Item ${item.id} not found`,
          );
        }
        // Only validate stock for STOCKED items, SERVICE items don't have stock
        if ((itemRecord as any).type === 'STOCKED') {
          if (store) {
            const balance = await this.stockService.getStoreItemBalance(
              store.id,
              itemRecord.id,
              tx,
            );
            if (balance < item.qty) {
              throwHttp(
                409,
                ERROR_CODES.INV_STOCK_INSUFFICIENT,
                `Insufficient stock for item ${itemRecord.name}. Available: ${balance}, Requested: ${item.qty}`,
              );
            }
          } else {
            // Fallback: use global stock
            if (itemRecord.stock < item.qty) {
              throwHttp(
                409,
                ERROR_CODES.INV_STOCK_INSUFFICIENT,
                `Insufficient stock for item ${itemRecord.name}`,
              );
            }
          }
        }
      }

      // Only persist safe/bank links for CASH returns
      const safeId =
        data.paymentMethod === 'cash' &&
        data.paymentTargetType === 'safe' &&
        branchId
          ? (
              await tx.safe.findFirst({
                where: { branchId },
              })
            )?.id || null
          : null;
      const bankId =
        data.paymentMethod === 'cash' && data.paymentTargetType === 'bank'
          ? data.paymentTargetId || null
          : null;

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
          // For credit returns, do not persist any payment target metadata
          paymentTargetType:
            data.paymentMethod === 'cash' ? data.paymentTargetType : null,
          paymentTargetId:
            data.paymentMethod === 'cash' ? data.paymentTargetId : null,
          safeId,
          bankId,
          notes: data.notes,
          userId,
          branchId,
        },
        include: {
          supplier: true,
          user: { select: { id: true, email: true, name: true, image: true } },
          branch: true,
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      // Remove stock using StoreIssueVoucher pattern (only for STOCKED items)
      if (store) {
        // Filter STOCKED items and get item records
        const stockedItemsWithRecords = await Promise.all(
          data.items.map(async (item) => {
            const itemRecord = await tx.item.findUnique({
              where: { code: item.id },
            });
            if (itemRecord && (itemRecord as any).type === 'STOCKED') {
              return { item, itemRecord };
            }
            return null;
          }),
        );
        const stockedItems = stockedItemsWithRecords.filter(Boolean) as Array<{
          item: any;
          itemRecord: any;
        }>;

        // Validate stock for STOCKED items (stock will be tracked via PurchaseReturn items in StockService)
        for (const { item, itemRecord } of stockedItems) {
          await this.stockService.validateAndDecreaseStock(
            store.id,
            itemRecord.id,
            item.qty,
            tx,
          );
        }
      } else {
        // Fallback: Update global stock if store not found (backward compatibility)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code: item.id },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
            await tx.item.update({
              where: { code: item.id },
              data: { stock: { decrement: item.qty } },
            });
          }
        }
      }

      // Apply cash impact if applicable (purchase return increases balance)
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        await AccountingService.applyImpact({
          kind: 'purchase-return',
          amount: net,
          paymentTargetType: data.paymentTargetType as any,
          branchId,
          bankId:
            data.paymentTargetType === 'bank'
              ? data.paymentTargetId || null
              : null,
          tx,
        });
      }

      // Update supplier balance for credit and cash purchase returns (decreases what we owe, increases balance)
      if (data.supplierId && (data.paymentMethod === 'credit' || data.paymentMethod === 'cash')) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: { increment: net } },
        });
      }

      return ret;
    });

    const response = {
      ...created,
      user: this.convertUserForResponse(created.user),
    } as PurchaseReturnResponse;

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: created.userId,
      branchId: created.branchId || undefined,
      action: 'create',
      targetType: 'purchase_return',
      targetId: created.code,
      details: `إنشاء مرتجع شراء رقم ${created.code} بقيمة ${created.net} ريال`,
    });

    return response;
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
        safe: { select: { id: true, name: true } },
        bank: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return returns.map((returnInvoice) => ({
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
        safe: { select: { id: true, name: true } },
        bank: { select: { id: true, name: true } },
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

    // Check if date is in a closed period (use new date if provided, otherwise existing date)
    const returnDate = data.date ? new Date(data.date) : existingReturn.date;
    
    // If date is being changed, validate it's in an open period
    if (data.date) {
      const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(returnDate);
      if (!hasOpenPeriod) {
        throw new ForbiddenException('لا يمكن تعديل المرتجع: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
      }
    }
    
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(returnDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن تعديل المرتجع: الفترة المحاسبية مغلقة');
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
        const itemRecord = await tx.item.findUnique({
          where: { code: item.id },
        });
        if (!itemRecord) {
          throwHttp(
            404,
            ERROR_CODES.INV_ITEM_NOT_FOUND,
            `Item ${item.id} not found`,
          );
        }
        if (itemRecord.stock < item.qty) {
          throwHttp(
            409,
            ERROR_CODES.INV_STOCK_INSUFFICIENT,
            `Insufficient stock for item ${itemRecord.name}`,
          );
        }
      }

      const nextPaymentMethod =
        data.paymentMethod ?? existingReturn.paymentMethod;
      const nextPaymentTargetType =
        data.paymentTargetType !== undefined
          ? data.paymentTargetType
          : (existingReturn.paymentTargetType ?? null);
      const nextPaymentTargetId =
        data.paymentTargetId !== undefined
          ? data.paymentTargetId
          : (existingReturn.paymentTargetId ?? null);

      // Only persist safe/bank links for CASH returns
      const safeId =
        nextPaymentMethod === 'cash' &&
        nextPaymentTargetType === 'safe' &&
        existingReturn.branchId
          ? await this.findSafeId(existingReturn.branchId, tx)
          : null;
      const bankId =
        nextPaymentMethod === 'cash' && nextPaymentTargetType === 'bank'
          ? (nextPaymentTargetId ?? null)
          : null;

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
          // For credit returns, do not persist any payment target metadata
          paymentTargetType:
            nextPaymentMethod === 'cash' ? nextPaymentTargetType : null,
          paymentTargetId:
            nextPaymentMethod === 'cash' && nextPaymentTargetType
              ? nextPaymentTargetId
              : null,
          safeId,
          bankId,
        },
        include: {
          supplier: true,
          user: { select: { id: true, email: true, name: true, image: true } },
          branch: true,
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      for (const item of items) {
        await tx.item.update({
          where: { code: item.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Reverse previous cash impact if needed
      if (
        existingReturn.paymentMethod === 'cash' &&
        (existingReturn as any).paymentTargetType
      ) {
        await AccountingService.reverseImpact({
          kind: 'purchase-return',
          amount: (existingReturn as any).net,
          paymentTargetType: (existingReturn as any).paymentTargetType,
          branchId: (existingReturn as any).branchId,
          bankId:
            (existingReturn as any).paymentTargetType === 'bank'
              ? (existingReturn as any).paymentTargetId
              : null,
          tx,
        });
      }
      // Reverse previous supplier balance update if needed
      if (
        existingReturn.supplierId &&
        (existingReturn.paymentMethod === 'credit' ||
          existingReturn.paymentMethod === 'cash')
      ) {
        await tx.supplier.update({
          where: { id: existingReturn.supplierId },
          data: { currentBalance: { decrement: (existingReturn as any).net } },
        });
      }
      // Apply new cash impact if applicable
      const targetType =
        (ret as any).paymentMethod === 'cash'
          ? (ret as any).paymentTargetType
          : null;
      if (targetType) {
        await AccountingService.applyImpact({
          kind: 'purchase-return',
          amount: (ret as any).net,
          paymentTargetType: targetType,
          branchId: (ret as any).branchId,
          bankId: targetType === 'bank' ? (ret as any).paymentTargetId : null,
          tx,
        });
      }
      // Apply new supplier balance update if applicable
      if (
        (ret as any).supplierId &&
        ((ret as any).paymentMethod === 'credit' ||
          (ret as any).paymentMethod === 'cash')
      ) {
        await tx.supplier.update({
          where: { id: (ret as any).supplierId },
          data: { currentBalance: { increment: (ret as any).net } },
        });
      }

      return ret;
    });

    const response = {
      ...updated,
      user: this.convertUserForResponse(updated.user),
    } as PurchaseReturnResponse;

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: updated.userId,
      branchId: updated.branchId || undefined,
      action: 'update',
      targetType: 'purchase_return',
      targetId: updated.code,
      details: `تعديل مرتجع شراء رقم ${updated.code}`,
    });

    return response;
  }

  private async findSafeId(
    branchId?: string | null,
    tx: any = this.prisma,
  ): Promise<string | null> {
    if (!branchId) {
      return null;
    }
    const safe = await tx.safe.findFirst({ where: { branchId } });
    return safe?.id ?? null;
  }

  async remove(id: string): Promise<void> {
    const returnRecord = await this.prisma.purchaseReturn.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Purchase return not found');
    }

    // Check if return date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(returnRecord.date);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن حذف المرتجع: الفترة المحاسبية مغلقة');
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
      if (
        (returnRecord as any).paymentMethod === 'cash' &&
        (returnRecord as any).paymentTargetType
      ) {
        await AccountingService.reverseImpact({
          kind: 'purchase-return',
          amount: (returnRecord as any).net,
          paymentTargetType: (returnRecord as any).paymentTargetType,
          branchId: (returnRecord as any).branchId,
          bankId:
            (returnRecord as any).paymentTargetType === 'bank'
              ? (returnRecord as any).paymentTargetId
              : null,
          tx,
        });
      }
      // Reverse supplier balance update if applicable
      if (
        (returnRecord as any).supplierId &&
        ((returnRecord as any).paymentMethod === 'credit' ||
          (returnRecord as any).paymentMethod === 'cash')
      ) {
        await tx.supplier.update({
          where: { id: (returnRecord as any).supplierId },
          data: { currentBalance: { decrement: (returnRecord as any).net } },
        });
      }

      await tx.purchaseReturn.delete({ where: { id } });
    });

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: returnRecord.userId,
      branchId: returnRecord.branchId || undefined,
      action: 'delete',
      targetType: 'purchase_return',
      targetId: returnRecord.code,
      details: `حذف مرتجع شراء رقم ${returnRecord.code}`,
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
