import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePurchaseInvoiceRequest } from './dtos/request/create-purchase-invoice.request';
import { UpdatePurchaseInvoiceRequest } from './dtos/request/update-purchase-invoice.request';
import { PurchaseInvoiceResponse } from './dtos/response/purchase-invoice.response';
import { bufferToDataUri } from '../../common/utils/image-converter';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
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
    companyId: string,
    data: CreatePurchaseInvoiceRequest,
    userId: string,
    branchId?: string,
  ): Promise<PurchaseInvoiceResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'invoicesPerMonth');

    const invoiceDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, invoiceDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create invoice: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoiceDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create invoice in a closed fiscal period');
    }

    // Validations
    // Supplier is only required for credit payments
    if (data.paymentMethod === 'credit' && !data.supplierId) {
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
    const code = await this.generateNextCode(companyId);

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
        store = await this.storeService.findByBranchId(companyId, branchId);
      } catch (error) {
        // Store not found, will use fallback
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      // Get store in transaction
      if (branchId && !store) {
        store = await tx.store.findUnique({
          where: { branchId },
        });
        if (store && store.companyId !== companyId) {
          store = null;
        }
      }

      // Only persist safe/bank links for CASH invoices
      const safeId =
        data.paymentMethod === 'cash' &&
        data.paymentTargetType === 'safe' &&
        branchId
          ? (
              await tx.safe.findUnique({
                where: { branchId },
              })
            )?.id || null
          : null;
      const bankId =
        data.paymentMethod === 'cash' && data.paymentTargetType === 'bank'
          ? data.paymentTargetId || null
          : null;

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
          // For credit invoices, do not persist any payment target metadata
          paymentTargetType:
            data.paymentMethod === 'cash' ? data.paymentTargetType : null,
          paymentTargetId:
            data.paymentMethod === 'cash' ? data.paymentTargetId : null,
          safeId,
          bankId,
          notes: data.notes,
          userId,
          branchId,
          companyId,
        },
        include: {
          supplier: true,
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
          branch: true,
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      // Track stock directly (only for STOCKED items)
      if (store) {
        // Filter STOCKED items and get item records
        const stockedItemsWithRecords = await Promise.all(
          data.items.map(async (item) => {
            const itemRecord = await tx.item.findUnique({
              where: { code_companyId: { code: item.id, companyId } },
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

        // Ensure StoreItem exists for each item (with openingBalance = 0)
        // Stock will be tracked via PurchaseInvoice items in StockService
        for (const { itemRecord } of stockedItems) {
          await this.stockService.ensureStoreItemExists(
            store.id,
            itemRecord.id,
            tx,
          );
        }

        // Update purchase price for all items (including SERVICE items)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code_companyId: { code: item.id, companyId } },
          });
          if (itemRecord) {
            await tx.item.update({
              where: { id: itemRecord.id },
              data: { purchasePrice: item.price },
            });
          }
        }
      } else {
        // Fallback: Update global stock if store not found (backward compatibility)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code_companyId: { code: item.id, companyId } },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
            await tx.item.update({
              where: { id: itemRecord.id },
              data: {
                stock: { increment: item.qty },
                purchasePrice: item.price,
              },
            });
          } else if (itemRecord) {
            // Update purchase price even for SERVICE items
            await tx.item.update({
              where: { id: itemRecord.id },
              data: { purchasePrice: item.price },
            });
          }
        }
      }

      // Apply cash impact if applicable (purchase invoice decreases balance)
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        // Validate safe balance before applying impact
        if (data.paymentTargetType === 'safe') {
          if (!branchId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
              'Branch ID is required for safe payments',
            );
          }
          const safe = await tx.safe.findUnique({
            where: { branchId },
          });
          if (!safe || safe.companyId !== companyId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
              'لا توجد خزنة مرتبطة بهذا الفرع',
            );
          }
          if ((safe as any).currentBalance < net) {
            throwHttp(
              409,
              ERROR_CODES.INV_SAFE_BALANCE_INSUFFICIENT,
              'الرصيد غير كافي في الخزنة',
            );
          }
        }
        await AccountingService.applyImpact({
          kind: 'purchase-invoice',
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

      // Update supplier balance for credit purchases (increases what we owe, decreases balance)
      if (data.paymentMethod === 'credit' && data.supplierId) {
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: { decrement: net } },
        });
      }

      return inv;
    });

    const response = {
      ...created,
      user: this.convertUserForResponse(created.user),
    } as PurchaseInvoiceResponse;

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: created.userId,
      branchId: created.branchId || undefined,
      action: 'create',
      targetType: 'purchase_invoice',
      targetId: created.code,
      details: `إنشاء فاتورة شراء رقم ${created.code} بقيمة ${created.net} ريال`,
    });

    return response;
  }

  async findAll(companyId: string, search?: string): Promise<PurchaseInvoiceResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' }, companyId } },
      ];
    }
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where,
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

    return invoices.map((invoice) => ({
      ...invoice,
      user: this.convertUserForResponse(invoice.user),
    })) as PurchaseInvoiceResponse[];
  }

  async findOne(companyId: string, id: string): Promise<PurchaseInvoiceResponse> {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id_companyId: { id, companyId } },
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

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    return {
      ...invoice,
      user: this.convertUserForResponse(invoice.user),
    } as PurchaseInvoiceResponse;
  }

  async update(
    companyId: string,
    id: string,
    data: UpdatePurchaseInvoiceRequest,
  ): Promise<PurchaseInvoiceResponse> {
    const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice || existingInvoice.companyId !== companyId) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Check if date is in a closed period (use new date if provided, otherwise existing date)
    const invoiceDate = data.date ? new Date(data.date) : existingInvoice.date;
    
    // If date is being changed, validate it's in an open period
    if (data.date) {
      const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, invoiceDate);
      if (!hasOpenPeriod) {
        throw new ForbiddenException('لا يمكن تعديل الفاتورة: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
      }
    }
    
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoiceDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن تعديل الفاتورة: الفترة المحاسبية مغلقة');
    }

    // Supplier is only required for credit payments
    // If payment method is credit (or being changed to credit), supplier must be provided
    const paymentMethod = data.paymentMethod || existingInvoice.paymentMethod;
    if (paymentMethod === 'credit' && data.supplierId === null) {
      throwHttp(
        422,
        ERROR_CODES.INV_SUPPLIER_REQUIRED,
        'Supplier is required for credit payments',
      );
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
        const oldItemRecord = await tx.item.findUnique({
          where: { code_companyId: { code: oldItem.id, companyId } },
        });
        if (oldItemRecord) {
          await tx.item.update({
            where: { id: oldItemRecord.id },
            data: { stock: { decrement: oldItem.qty } },
          });
        }
      }

      const nextPaymentMethod =
        data.paymentMethod ?? existingInvoice.paymentMethod;
      const nextPaymentTargetType =
        data.paymentTargetType !== undefined
          ? data.paymentTargetType
          : (existingInvoice.paymentTargetType ?? null);
      const nextPaymentTargetId =
        data.paymentTargetId !== undefined
          ? data.paymentTargetId
          : (existingInvoice.paymentTargetId ?? null);

      // Only persist safe/bank links for CASH invoices
      const safeId =
        nextPaymentMethod === 'cash' &&
        nextPaymentTargetType === 'safe' &&
        existingInvoice.branchId
          ? await this.findSafeId(companyId, existingInvoice.branchId, tx)
          : null;
      const bankId =
        nextPaymentMethod === 'cash' && nextPaymentTargetType === 'bank'
          ? (nextPaymentTargetId ?? null)
          : null;

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
          // For credit invoices, do not persist any payment target metadata
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
          user: {
            select: { id: true, email: true, name: true, image: true },
          },
          branch: true,
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      for (const item of items) {
        const itemRecord = await tx.item.findUnique({
          where: { code_companyId: { code: item.id, companyId } },
        });
        if (itemRecord) {
          await tx.item.update({
            where: { id: itemRecord.id },
            data: { stock: { increment: item.qty }, purchasePrice: item.price },
          });
        }
      }

      // Reverse previous cash impact if needed
      if (
        existingInvoice.paymentMethod === 'cash' &&
        (existingInvoice as any).paymentTargetType
      ) {
        await AccountingService.reverseImpact({
          kind: 'purchase-invoice',
          amount: (existingInvoice as any).net,
          paymentTargetType: (existingInvoice as any).paymentTargetType,
          branchId: (existingInvoice as any).branchId,
          bankId:
            (existingInvoice as any).paymentTargetType === 'bank'
              ? (existingInvoice as any).paymentTargetId
              : null,
          tx,
        });
      }
      // Reverse previous supplier balance update if needed
      if (
        existingInvoice.paymentMethod === 'credit' &&
        existingInvoice.supplierId
      ) {
        await tx.supplier.update({
          where: { id: existingInvoice.supplierId },
          data: { currentBalance: { increment: (existingInvoice as any).net } },
        });
      }
      // Apply new cash impact if applicable
      const targetType =
        (inv as any).paymentMethod === 'cash'
          ? (inv as any).paymentTargetType
          : null;
      if (targetType) {
        // Validate safe balance before applying impact
        if (targetType === 'safe') {
          const invoiceBranchId = (inv as any).branchId;
          if (!invoiceBranchId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
              'Branch ID is required for safe payments',
            );
          }
          const safe = await tx.safe.findUnique({
            where: { branchId: invoiceBranchId },
          });
          if (!safe || safe.companyId !== companyId) {
            throwHttp(
              422,
              ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
              'لا توجد خزنة مرتبطة بهذا الفرع',
            );
          }
          if ((safe as any).currentBalance < (inv as any).net) {
            throwHttp(
              409,
              ERROR_CODES.INV_SAFE_BALANCE_INSUFFICIENT,
              'الرصيد غير كافي في الخزنة',
            );
          }
        }
        await AccountingService.applyImpact({
          kind: 'purchase-invoice',
          amount: (inv as any).net,
          paymentTargetType: targetType,
          branchId: (inv as any).branchId,
          bankId: targetType === 'bank' ? (inv as any).paymentTargetId : null,
          tx,
        });
      }
      // Apply new supplier balance update if applicable
      if ((inv as any).paymentMethod === 'credit' && (inv as any).supplierId) {
        await tx.supplier.update({
          where: { id: (inv as any).supplierId },
          data: { currentBalance: { decrement: (inv as any).net } },
        });
      }

      return inv;
    });

    const response = {
      ...updated,
      user: this.convertUserForResponse(updated.user),
    } as PurchaseInvoiceResponse;

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: updated.userId,
      branchId: updated.branchId || undefined,
      action: 'update',
      targetType: 'purchase_invoice',
      targetId: updated.code,
      details: `تعديل فاتورة شراء رقم ${updated.code}`,
    });

    return response;
  }

  private async findSafeId(
    companyId: string,
    branchId?: string | null,
    tx: any = this.prisma,
  ): Promise<string | null> {
    if (!branchId) {
      return null;
    }
    const safe = await tx.safe.findUnique({ where: { branchId } });
    if (!safe || safe.companyId !== companyId) {
      return null;
    }
    return safe.id;
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the invoice belongs to the company
    await this.findOne(companyId, id);
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Check if invoice date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoice.date);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن حذف الفاتورة: الفترة المحاسبية مغلقة');
    }

    await this.prisma.$transaction(async (tx) => {
      const items = invoice.items as any[];
      const itemCodes = Array.from(new Set(items.map((item) => item.id)));
      const otherInvoices = await tx.purchaseInvoice.findMany({
        where: { id: { not: invoice.id }, companyId },
        orderBy: { date: 'desc' },
        select: { id: true, date: true, items: true },
      });
      const itemInitials = await tx.item.findMany({
        where: { code: { in: itemCodes }, companyId },
      });
      const initialMap = new Map(
        itemInitials.map((entry) => [
          entry.code,
          ((entry as any).initialPurchasePrice ??
            entry.purchasePrice ??
            0) as number,
        ]),
      );

      for (const item of items) {
        const itemRecord = await tx.item.findUnique({
          where: { code_companyId: { code: item.id, companyId } },
        });
        if (itemRecord) {
          await tx.item.update({
            where: { id: itemRecord.id },
            data: { stock: { decrement: item.qty } },
          });

          const latestInvoice = otherInvoices.find(
            (candidate) =>
              Array.isArray(candidate.items) &&
              (candidate.items as any[]).some(
                (invItem) => invItem.id === item.id && invItem.price,
              ),
          );

          if (latestInvoice) {
            const matchedItem = (latestInvoice.items as any[]).find(
              (invItem) => invItem.id === item.id && invItem.price,
            );
            if (matchedItem?.price) {
              await tx.item.update({
                where: { id: itemRecord.id },
                data: { purchasePrice: matchedItem.price },
              });
              continue;
            }
          }

          const fallbackPrice = initialMap.get(item.id) ?? 0;
          await tx.item.update({
            where: { id: itemRecord.id },
            data: { purchasePrice: fallbackPrice },
          });
        }
      }

      // Reverse cash impact if applicable
      if (
        (invoice as any).paymentMethod === 'cash' &&
        (invoice as any).paymentTargetType
      ) {
        await AccountingService.reverseImpact({
          kind: 'purchase-invoice',
          amount: (invoice as any).net,
          paymentTargetType: (invoice as any).paymentTargetType,
          branchId: (invoice as any).branchId,
          bankId:
            (invoice as any).paymentTargetType === 'bank'
              ? (invoice as any).paymentTargetId
              : null,
          tx,
        });
      }
      // Reverse supplier balance update if applicable
      if (
        (invoice as any).paymentMethod === 'credit' &&
        (invoice as any).supplierId
      ) {
        await tx.supplier.update({
          where: { id: (invoice as any).supplierId },
          data: { currentBalance: { increment: (invoice as any).net } },
        });
      }

      await tx.purchaseInvoice.delete({ where: { id } });
    });

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: invoice.userId,
      branchId: invoice.branchId || undefined,
      action: 'delete',
      targetType: 'purchase_invoice',
      targetId: invoice.code,
      details: `حذف فاتورة شراء رقم ${invoice.code}`,
    });
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastInvoice = await this.prisma.purchaseInvoice.findFirst({
      where: { companyId },
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
