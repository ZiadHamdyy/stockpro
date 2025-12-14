import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSalesReturnRequest } from './dtos/request/create-sales-return.request';
import { UpdateSalesReturnRequest } from './dtos/request/update-sales-return.request';
import { SalesReturnResponse } from './dtos/response/sales-return.response';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class SalesReturnService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private computeLineTotals(
    item: { qty: number; price: number; salePriceIncludesTax?: boolean },
    vatRate: number,
    isVatEnabled: boolean,
  ) {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const lineAmount = qty * price;

    if (!isVatEnabled || vatRate <= 0) {
      return { net: lineAmount, taxAmount: 0, total: lineAmount };
    }

    const includesTax = Boolean(item.salePriceIncludesTax);

    if (includesTax) {
      // When price includes tax: net = total / (1 + taxRate)
      const net = lineAmount / (1 + vatRate / 100);
      const taxAmount = lineAmount - net;
      return { net, taxAmount, total: lineAmount };
    }

    // When price excludes tax: tax = base * taxRate, total = base + tax
    const taxAmount = lineAmount * (vatRate / 100);
    const total = lineAmount + taxAmount;
    return { net: lineAmount, taxAmount, total };
  }

  async create(
    companyId: string,
    data: CreateSalesReturnRequest,
    userId: string,
    branchId?: string,
  ): Promise<SalesReturnResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'invoicesPerMonth');

    const returnDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, returnDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create return: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, returnDate);
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
    const code = await this.generateNextCode(companyId);

    // Get company VAT settings
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    const vatRate = company?.vatRate || 0;
    const isVatEnabled = company?.isVatEnabled || false;

    const discount = data.discount || 0;
    let subtotal = 0;
    let tax = 0;
    const itemsWithTotals = data.items.map((item) => {
      const {
        net: lineNet,
        taxAmount,
        total,
      } = this.computeLineTotals(item, vatRate, isVatEnabled);
      subtotal += lineNet;
      tax += taxAmount;
      return {
        ...item,
        salePriceIncludesTax: item.salePriceIncludesTax ?? false,
        taxAmount,
        total,
      };
    });

    const net = subtotal + tax - discount;

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

      // Only persist safe/bank links for CASH returns
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

      const ret = await tx.salesReturn.create({
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
          companyId,
        },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      // Add stock back using StoreReceiptVoucher pattern (only for STOCKED items)
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
        // Stock will be tracked via SalesReturn items in StockService
        for (const { itemRecord } of stockedItems) {
          await this.stockService.ensureStoreItemExists(
            store.id,
            itemRecord.id,
            tx,
          );
        }
      } else {
        // Fallback: Update global stock if store not found (backward compatibility)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code_companyId: { code: item.id, companyId } },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
            await tx.item.update({
              where: { code_companyId: { code: item.id, companyId } },
              data: { stock: { increment: item.qty } },
            });
          }
        }
      }

      // Apply cash impact if applicable (sales return decreases balance)
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        await AccountingService.applyImpact({
          kind: 'sales-return',
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

      // Update customer balance for credit returns (customer owes less)
      if (data.paymentMethod === 'credit' && data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { currentBalance: { decrement: net } },
        });
      }

      return ret;
    });

    const response = this.mapToResponse(created);

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: created.userId,
      branchId: created.branchId || undefined,
      action: 'create',
      targetType: 'sales_return',
      targetId: created.code,
      details: `إنشاء مرتجع مبيعات رقم ${created.code} بقيمة ${created.net} ريال`,
    });

    return response;
  }

  async findAll(companyId: string, search?: string): Promise<SalesReturnResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' as const },
            companyId, // Ensure customer belongs to the same company
          },
        },
      ];
    }

    const salesReturns = await this.prisma.salesReturn.findMany({
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
        safe: { select: { id: true, name: true } },
        bank: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return salesReturns.map((return_) => this.mapToResponse(return_));
  }

  async findOne(companyId: string, id: string): Promise<SalesReturnResponse> {
    const salesReturn = await this.prisma.salesReturn.findUnique({
      where: { id_companyId: { id, companyId } },
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
        safe: { select: { id: true, name: true } },
        bank: { select: { id: true, name: true } },
      },
    });

    if (!salesReturn) {
      throw new NotFoundException('Sales return not found');
    }

    return this.mapToResponse(salesReturn);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdateSalesReturnRequest,
    userId: string,
  ): Promise<SalesReturnResponse> {
    // Verify the return belongs to the company
    const existingReturn = await this.findOne(companyId, id);

    try {
      // Check if date is in a closed period (use new date if provided, otherwise existing date)
      const returnDate = data.date ? new Date(data.date) : existingReturn.date;
      
      // If date is being changed, validate it's in an open period
      if (data.date) {
        const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, returnDate);
        if (!hasOpenPeriod) {
          throw new ForbiddenException('لا يمكن تعديل المرتجع: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
        }
      }
      
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, returnDate);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن تعديل المرتجع: الفترة المحاسبية مغلقة');
      }

      // Get existing return to adjust stock
      const existingReturnRecord = await this.prisma.salesReturn.findUnique({
        where: { id },
      });
      
      if (!existingReturnRecord || existingReturnRecord.companyId !== companyId) {
        throw new NotFoundException('Sales return not found');
      }

      if (existingReturnRecord) {
        // Decrease stock for old items (reverse the return)
        await this.updateStockForItems(
          companyId,
          existingReturnRecord.items as any[],
          'decrease',
        );
      }

      // Calculate new totals
      const rawItems = data.items || (existingReturnRecord?.items as any[]) || [];
      const discount =
        data.discount !== undefined
          ? data.discount
          : existingReturnRecord?.discount || 0;

      // Get company VAT settings
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      const vatRate = company?.vatRate || 0;
      const isVatEnabled = company?.isVatEnabled || false;

      let subtotal = 0;
      let tax = 0;
      const itemsWithTotals = rawItems.map((item) => {
        const {
          net: lineNet,
          taxAmount,
          total,
        } = this.computeLineTotals(item, vatRate, isVatEnabled);
        subtotal += lineNet;
        tax += taxAmount;
        return {
          ...item,
          salePriceIncludesTax: item.salePriceIncludesTax ?? false,
          taxAmount,
          total,
        };
      });

      const net = subtotal + tax - discount;

      const normalizedDate = data.date
        ? new Date(data.date)
        : existingReturnRecord?.date || new Date();
      const updated = await this.prisma.$transaction(async (tx) => {
        // Reverse previous increase
        if (existingReturnRecord) {
          for (const oldItem of (existingReturnRecord.items as any[]) || []) {
            const itemRecord = await tx.item.findUnique({
              where: { code_companyId: { code: oldItem.id, companyId } },
            });
            if (itemRecord) {
              await tx.item.update({
                where: { id: itemRecord.id },
                data: { stock: { decrement: oldItem.qty } },
              });
            }
          }
        }

        const nextPaymentMethod =
          data.paymentMethod ?? existingReturnRecord?.paymentMethod;
        const nextPaymentTargetType =
          data.paymentTargetType !== undefined
            ? data.paymentTargetType
            : (existingReturn?.paymentTargetType ?? null);
        const nextPaymentTargetId =
          data.paymentTargetId !== undefined
            ? data.paymentTargetId
            : (existingReturn?.paymentTargetId ?? null);
        const branchIdForReturn = existingReturn?.branchId ?? null;

        // Only persist safe/bank links for CASH returns
        const safeId =
          nextPaymentMethod === 'cash' &&
          nextPaymentTargetType === 'safe' &&
          branchIdForReturn
            ? await this.findSafeId(branchIdForReturn, tx)
            : null;
        const bankId =
          nextPaymentMethod === 'cash' && nextPaymentTargetType === 'bank'
            ? (nextPaymentTargetId ?? null)
            : null;

        const ret = await tx.salesReturn.update({
          where: { id },
          data: {
            ...data,
            date: normalizedDate,
            items: itemsWithTotals,
            subtotal,
            discount,
            tax,
            net,
            userId,
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
            customer: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
            safe: { select: { id: true, name: true } },
            bank: { select: { id: true, name: true } },
          },
        });

        for (const item of itemsWithTotals) {
          await tx.item.update({
            where: { code_companyId: { code: item.id, companyId } },
            data: { stock: { increment: item.qty } },
          });
        }

        // Reverse previous cash impact if needed
        if (
          existingReturn &&
          (existingReturn as any).paymentMethod === 'cash' &&
          (existingReturn as any).paymentTargetType
        ) {
          await AccountingService.reverseImpact({
            kind: 'sales-return',
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
        // Reverse previous customer balance update if needed
        if (
          existingReturn &&
          (existingReturn as any).paymentMethod === 'credit' &&
          (existingReturn as any).customerId
        ) {
          await tx.customer.update({
            where: { id: (existingReturn as any).customerId },
            data: {
              currentBalance: { increment: (existingReturn as any).net },
            },
          });
        }
        // Apply new cash impact if applicable
        const targetType =
          (ret as any).paymentMethod === 'cash'
            ? (ret as any).paymentTargetType
            : null;
        if (targetType) {
          await AccountingService.applyImpact({
            kind: 'sales-return',
            amount: (ret as any).net,
            paymentTargetType: targetType,
            branchId: (ret as any).branchId,
            bankId: targetType === 'bank' ? (ret as any).paymentTargetId : null,
            tx,
          });
        }
        // Apply new customer balance update if applicable
        if (
          (ret as any).paymentMethod === 'credit' &&
          (ret as any).customerId
        ) {
          await tx.customer.update({
            where: { id: (ret as any).customerId },
            data: { currentBalance: { decrement: (ret as any).net } },
          });
        }

        return ret;
      });

      const response = this.mapToResponse(updated);

      // Create audit log
      await this.auditLogService.createAuditLog({
        companyId,
        userId: updated.userId,
        branchId: updated.branchId || undefined,
        action: 'update',
        targetType: 'sales_return',
        targetId: updated.code,
        details: `تعديل مرتجع مبيعات رقم ${updated.code}`,
      });

      return response;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Sales return not found');
      }
      throw error;
    }
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the return belongs to the company
    const return_ = await this.findOne(companyId, id);

    try {
      // Check if return date is in a closed period
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, return_.date);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن حذف المرتجع: الفترة المحاسبية مغلقة');
      }

      // Get return to decrease stock
      const returnRecord = await this.prisma.salesReturn.findUnique({
        where: { id },
      });
      
      if (!returnRecord || returnRecord.companyId !== companyId) {
        throw new NotFoundException('Sales return not found');
      }

      if (returnRecord) {

        // Decrease stock (reverse the return)
        await this.updateStockForItems(companyId, returnRecord.items as any[], 'decrease');

        // Reverse customer balance update if applicable
        if (
          (returnRecord as any).paymentMethod === 'credit' &&
          (return_ as any).customerId
        ) {
          await this.prisma.customer.update({
            where: { id: (return_ as any).customerId },
            data: { currentBalance: { increment: (return_ as any).net } },
          });
        }
      }

      const deleted = await this.prisma.salesReturn.delete({
        where: { id },
      });

      // Create audit log
      if (return_) {
        await this.auditLogService.createAuditLog({
          companyId,
          userId: return_.userId,
          branchId: return_.branchId || undefined,
          action: 'delete',
          targetType: 'sales_return',
          targetId: return_.code,
          details: `حذف مرتجع مبيعات رقم ${return_.code}`,
        });
      }
    } catch (error) {
      throw new NotFoundException('Sales return not found');
    }
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastReturn = await this.prisma.salesReturn.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastReturn) {
      return 'RTN-00001';
    }

    const match = lastReturn.code.match(/RTN-(\d+)/);
    if (!match) {
      return 'RTN-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `RTN-${String(nextNumber).padStart(5, '0')}`;
  }

  private async updateStockForItems(
    companyId: string,
    items: any[],
    operation: 'increase' | 'decrease',
  ): Promise<void> {
    for (const item of items) {
      await this.prisma.item.update({
        where: { code_companyId: { code: item.id, companyId } },
        data: {
          stock:
            operation === 'increase'
              ? { increment: item.qty }
              : { decrement: item.qty },
        },
      });
    }
  }

  private async findSafeId(
    branchId?: string | null,
    tx: any = this.prisma,
  ): Promise<string | null> {
    if (!branchId) {
      return null;
    }
    const safe = await tx.safe.findUnique({ where: { branchId } });
    return safe?.id ?? null;
  }

  private mapToResponse(salesReturn: any): SalesReturnResponse {
    return {
      id: salesReturn.id,
      code: salesReturn.code,
      date: salesReturn.date,
      customerId: salesReturn.customerId,
      customer: salesReturn.customer,
      items: salesReturn.items,
      subtotal: salesReturn.subtotal,
      discount: salesReturn.discount,
      tax: salesReturn.tax,
      net: salesReturn.net,
      paymentMethod: salesReturn.paymentMethod,
      paymentTargetType: salesReturn.paymentTargetType,
      paymentTargetId: salesReturn.paymentTargetId,
      safeId: salesReturn.safeId,
      safe: salesReturn.safe,
      bankId: salesReturn.bankId,
      bank: salesReturn.bank,
      notes: salesReturn.notes,
      userId: salesReturn.userId,
      user: salesReturn.user,
      branchId: salesReturn.branchId,
      branch: salesReturn.branch,
      createdAt: salesReturn.createdAt,
      updatedAt: salesReturn.updatedAt,
    };
  }
}
