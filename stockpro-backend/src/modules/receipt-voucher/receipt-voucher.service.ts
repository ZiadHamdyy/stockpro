import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateReceiptVoucherRequest } from './dtos/request/create-receipt-voucher.request';
import { UpdateReceiptVoucherRequest } from './dtos/request/update-receipt-voucher.request';
import { ReceiptVoucherResponse } from './dtos/response/receipt-voucher.response';
import { AccountingService } from '../../common/services/accounting.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class ReceiptVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  // ==================== CRUD Operations ====================

  async createReceiptVoucher(
    data: CreateReceiptVoucherRequest,
    userId: string,
  ): Promise<ReceiptVoucherResponse> {
    const voucherDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(voucherDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create voucher: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(voucherDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create voucher in a closed fiscal period');
    }

    const code = await this.generateNextCode();

    // Fetch entity name based on type
    const entityId =
      data.customerId ||
      data.supplierId ||
      data.currentAccountId ||
      data.revenueCodeId ||
      (data as any).receivableAccountId ||
      (data as any).payableAccountId ||
      '';
    const entityName = await this.fetchEntityName(data.entityType, entityId);

    const result = await this.prisma.$transaction(async (tx) => {
      let safeBranchId: string | null = null;
      let safeId: string | null = null;
      let bankId: string | null = null;

      if (data.paymentMethod === 'safe') {
        if (!data.safeId) {
          throw new NotFoundException('Safe not found');
        }
        const safe = await tx.safe.findUnique({ where: { id: data.safeId } });
        if (!safe) {
          throw new NotFoundException('Safe not found');
        }
        safeId = safe.id;
        safeBranchId = safe.branchId;
        await AccountingService.applyImpact({
          kind: 'receipt-voucher',
          amount: data.amount,
          paymentTargetType: 'safe',
          branchId: safeBranchId ?? data.branchId ?? null,
          safeId,
          tx,
        });
      } else if (data.paymentMethod === 'bank') {
        if (!data.bankId) {
          throw new NotFoundException('Bank not found');
        }
        const bank = await tx.bank.findUnique({ where: { id: data.bankId } });
        if (!bank) {
          throw new NotFoundException('Bank not found');
        }
        bankId = bank.id;
        await AccountingService.applyImpact({
          kind: 'receipt-voucher',
          amount: data.amount,
          paymentTargetType: 'bank',
          bankId,
          tx,
        });
      }

      // Apply entity balance effects (skip for VAT and profit_and_loss types)
      if (data.entityType === 'vat' || data.entityType === 'profit_and_loss') {
        // VAT and profit_and_loss vouchers don't affect entity balances
      } else if (data.entityType === 'customer' && data.customerId) {
        // Customer: decrement (customer paid us)
        await tx.customer.update({
          where: { id: data.customerId },
          data: { currentBalance: { decrement: data.amount } },
        });
      } else if (data.entityType === 'supplier' && data.supplierId) {
        // Supplier: increment (we received from supplier)
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: { increment: data.amount } },
        });
      } else {
        // Apply entity-side effect for other account types
        const direction =
          data.entityType === 'receivable_account' ? 'decrement' : 'increment';
        await this.applyEntityBalanceEffect(tx, data.entityType, {
          currentAccountId: data.currentAccountId,
          receivableAccountId: (data as any).receivableAccountId,
          payableAccountId: (data as any).payableAccountId,
          amount: data.amount,
          direction,
        });
      }

      const receiptVoucher = await tx.receiptVoucher.create({
        data: {
          code,
          date: new Date(data.date),
          entityType: data.entityType,
          entityName,
          amount: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          safeId: data.safeId,
          bankId: data.bankId,
          customerId: data.customerId,
          supplierId: data.supplierId,
          currentAccountId: data.currentAccountId,
          receivableAccountId: (data as any).receivableAccountId,
          payableAccountId: (data as any).payableAccountId,
          revenueCodeId: data.revenueCodeId,
          userId,
          branchId: data.branchId,
        },
        include: { user: true, branch: true, revenueCode: true },
      });
      return receiptVoucher;
    });

    return this.mapToResponse(result);
  }

  async findAllReceiptVouchers(
    search?: string,
  ): Promise<ReceiptVoucherResponse[]> {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { entityName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const vouchers = await this.prisma.receiptVoucher.findMany({
      where,
      include: {
        user: true,
        branch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findOneReceiptVoucher(id: string): Promise<ReceiptVoucherResponse> {
    const receiptVoucher = await this.prisma.receiptVoucher.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        revenueCode: true,
      },
    });

    if (!receiptVoucher) {
      throw new NotFoundException('Receipt voucher not found');
    }

    return this.mapToResponse(receiptVoucher);
  }

  async updateReceiptVoucher(
    id: string,
    data: UpdateReceiptVoucherRequest,
  ): Promise<ReceiptVoucherResponse> {
    try {
      // Get existing voucher to check date
      const existing = await this.prisma.receiptVoucher.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Receipt voucher not found');

      // Check if date is in a closed period (use new date if provided, otherwise existing date)
      const voucherDate = data.date ? new Date(data.date) : existing.date;
      
      // If date is being changed, validate it's in an open period
      if (data.date) {
        const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(voucherDate);
        if (!hasOpenPeriod) {
          throw new ForbiddenException('لا يمكن تعديل السند: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
        }
      }
      
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(voucherDate);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن تعديل السند: الفترة المحاسبية مغلقة');
      }

      const result = await this.prisma.$transaction(async (tx) => {

        // Reverse previous effect on cash/bank (decrement back)
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existing.safeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'receipt-voucher',
            amount: existing.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existing.safeId,
            tx,
          });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await AccountingService.reverseImpact({
            kind: 'receipt-voucher',
            amount: existing.amount,
            paymentTargetType: 'bank',
            bankId: existing.bankId,
            tx,
          });
        }

        // Reverse previous entity effect (skip for VAT and profit_and_loss types)
        if (existing.entityType === 'vat' || existing.entityType === 'profit_and_loss') {
          // VAT and profit_and_loss vouchers don't affect entity balances
        } else if (existing.entityType === 'customer' && existing.customerId) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { currentBalance: { increment: existing.amount } },
          });
        } else if (existing.entityType === 'supplier' && existing.supplierId) {
          await tx.supplier.update({
            where: { id: existing.supplierId },
            data: { currentBalance: { decrement: existing.amount } },
          });
        } else {
          const reverseDirection =
            existing.entityType === 'receivable_account'
              ? 'increment'
              : 'decrement';
          await this.applyEntityBalanceEffect(tx, existing.entityType, {
            currentAccountId: existing.currentAccountId,
            receivableAccountId: (existing as any).receivableAccountId,
            payableAccountId: (existing as any).payableAccountId,
            amount: existing.amount,
            direction: reverseDirection,
          });
        }

        // Determine new target and apply
        const newPaymentMethod = data.paymentMethod || existing.paymentMethod;
        const newAmount =
          data.amount !== undefined ? data.amount : existing.amount;
        const newSafeId =
          newPaymentMethod === 'safe' ? data.safeId || existing.safeId : null;
        const newBankId =
          newPaymentMethod === 'bank' ? data.bankId || existing.bankId : null;

        if (newPaymentMethod === 'safe') {
          if (!newSafeId) throw new NotFoundException('Safe not found');
          const safe = await tx.safe.findUnique({ where: { id: newSafeId } });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.applyImpact({
            kind: 'receipt-voucher',
            amount: newAmount,
            paymentTargetType: 'safe',
            branchId: safe.branchId ?? data.branchId ?? null,
            safeId: newSafeId,
            tx,
          });
        } else if (newPaymentMethod === 'bank') {
          if (!newBankId) throw new NotFoundException('Bank not found');
          const bank = await tx.bank.findUnique({ where: { id: newBankId } });
          if (!bank) throw new NotFoundException('Bank not found');
          await AccountingService.applyImpact({
            kind: 'receipt-voucher',
            amount: newAmount,
            paymentTargetType: 'bank',
            bankId: newBankId,
            tx,
          });
        }

        // Apply new entity effect (skip for VAT type)
        const newEntityType = data.entityType || existing.entityType;
        const newCustomerId = data.customerId ?? existing.customerId;
        const newSupplierId = data.supplierId ?? existing.supplierId;

        if (newEntityType === 'vat') {
          // VAT vouchers don't affect entity balances
        } else if (newEntityType === 'revenue' && data.revenueCodeId) {
          // Revenue: Note - RevenueCode doesn't have currentBalance field
          // Revenue codes are for categorization only
        } else if (newEntityType === 'customer' && newCustomerId) {
          await tx.customer.update({
            where: { id: newCustomerId },
            data: { currentBalance: { decrement: newAmount } },
          });
        } else if (newEntityType === 'supplier' && newSupplierId) {
          await tx.supplier.update({
            where: { id: newSupplierId },
            data: { currentBalance: { increment: newAmount } },
          });
        } else {
          const newEntityIds: any = {
            currentAccountId:
              data.currentAccountId ?? existing.currentAccountId,
            receivableAccountId:
              (data as any).receivableAccountId ??
              (existing as any).receivableAccountId,
            payableAccountId:
              (data as any).payableAccountId ??
              (existing as any).payableAccountId,
          };
          const direction =
            newEntityType === 'receivable_account' ? 'decrement' : 'increment';
          await this.applyEntityBalanceEffect(tx, newEntityType, {
            ...newEntityIds,
            amount: newAmount,
            direction,
          });
        }

        const updateData: any = {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          paymentMethod: newPaymentMethod,
          amount: newAmount,
          safeId: newSafeId,
          bankId: newBankId,
          revenueCodeId: data.revenueCodeId ?? existing.revenueCodeId,
        };

        // If entity type or ID changed, fetch new entity name
        const newEntityId =
          data.customerId ??
          data.supplierId ??
          data.currentAccountId ??
          data.revenueCodeId ??
          (data as any).receivableAccountId ??
          (data as any).payableAccountId ??
          null;
        if (newEntityType !== existing.entityType || newEntityId !== null) {
          const entityIdToUse =
            newEntityId ||
            existing.customerId ||
            existing.supplierId ||
            existing.currentAccountId ||
            existing.revenueCodeId ||
            (existing as any).receivableAccountId ||
            (existing as any).payableAccountId ||
            '';
          updateData.entityName = await this.fetchEntityName(
            newEntityType,
            entityIdToUse,
          );
        }

        const updated = await tx.receiptVoucher.update({
          where: { id },
          data: updateData,
          include: { user: true, branch: true },
        });
        return updated;
      });

      return this.mapToResponse(result);
    } catch (error) {
      throw new NotFoundException('Receipt voucher not found');
    }
  }

  async removeReceiptVoucher(id: string): Promise<void> {
    try {
      // Check if voucher date is in a closed period before starting transaction
      const existing = await this.prisma.receiptVoucher.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Receipt voucher not found');

      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(existing.date);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن حذف السند: الفترة المحاسبية مغلقة');
      }

      await this.prisma.$transaction(async (tx) => {
        const existingInTx = await tx.receiptVoucher.findUnique({ where: { id } });
        if (!existingInTx) throw new NotFoundException('Receipt voucher not found');

        // Reverse effect on cash/bank (decrement back)
        if (existingInTx.paymentMethod === 'safe' && existingInTx.safeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existingInTx.safeId },
          });
          if (!safe) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'receipt-voucher',
            amount: existingInTx.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existingInTx.safeId,
            tx,
          });
        } else if (existingInTx.paymentMethod === 'bank' && existingInTx.bankId) {
          await AccountingService.reverseImpact({
            kind: 'receipt-voucher',
            amount: existingInTx.amount,
            paymentTargetType: 'bank',
            bankId: existingInTx.bankId,
            tx,
          });
        }

        // Reverse entity effect (skip for VAT and profit_and_loss types)
        if (existingInTx.entityType === 'vat' || existingInTx.entityType === 'profit_and_loss') {
          // VAT and profit_and_loss vouchers don't affect entity balances
        } else if (existingInTx.entityType === 'customer' && existingInTx.customerId) {
          await tx.customer.update({
            where: { id: existingInTx.customerId },
            data: { currentBalance: { increment: existingInTx.amount } },
          });
        } else if (existingInTx.entityType === 'supplier' && existingInTx.supplierId) {
          await tx.supplier.update({
            where: { id: existingInTx.supplierId },
            data: { currentBalance: { decrement: existingInTx.amount } },
          });
        } else {
          const reverseDirection =
            existingInTx.entityType === 'receivable_account'
              ? 'increment'
              : 'decrement';
          await this.applyEntityBalanceEffect(tx, existingInTx.entityType, {
            currentAccountId: existingInTx.currentAccountId,
            receivableAccountId: (existingInTx as any).receivableAccountId,
            payableAccountId: (existingInTx as any).payableAccountId,
            amount: existingInTx.amount,
            direction: reverseDirection,
          });
        }

        await tx.receiptVoucher.delete({ where: { id } });
      });
    } catch (error) {
      throw new NotFoundException('Receipt voucher not found');
    }
  }

  // ==================== Private Helper Methods ====================

  private async generateNextCode(): Promise<string> {
    const lastVoucher = await this.prisma.receiptVoucher.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastVoucher) {
      return 'RCV-001';
    }

    const match = lastVoucher.code.match(/RCV-(\d+)/);
    if (!match) {
      return 'RCV-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `RCV-${String(nextNumber).padStart(3, '0')}`;
  }

  private async fetchEntityName(
    entityType: string,
    entityId: string,
  ): Promise<string> {
    switch (entityType) {
      case 'customer':
        const customer = await this.prisma.customer.findUnique({
          where: { id: entityId },
        });
        return customer?.name || '';

      case 'supplier':
        const supplier = await this.prisma.supplier.findUnique({
          where: { id: entityId },
        });
        return supplier?.name || '';

      case 'current_account':
        const currentAccount = await this.prisma.currentAccount.findUnique({
          where: { id: entityId },
        });
        return currentAccount?.name || '';

      case 'receivable_account':
        const receivable = await this.prisma.receivableAccount.findUnique({
          where: { id: entityId },
        });
        return receivable?.name || '';

      case 'payable_account':
        const payable = await this.prisma.payableAccount.findUnique({
          where: { id: entityId },
        });
        return payable?.name || '';

      case 'revenue':
        const revenueCode = await this.prisma.revenueCode.findUnique({
          where: { id: entityId },
        });
        return revenueCode?.name || '';

      case 'vat':
        return 'ضريبة القيمة المضافة';

      case 'profit_and_loss':
        return 'الارباح والخسائر المبقاه';

      default:
        return '';
    }
  }

  private async applyEntityBalanceEffect(
    tx: any,
    entityType: string,
    params: {
      currentAccountId?: string | null;
      receivableAccountId?: string | null;
      payableAccountId?: string | null;
      amount: number;
      direction: 'increment' | 'decrement';
    },
  ): Promise<void> {
    const op = params.direction;
    if (entityType === 'current_account' && params.currentAccountId) {
      // Current account: increment for receipt (no balance check needed)
      await tx.currentAccount.update({
        where: { id: params.currentAccountId },
        data: { currentBalance: { [op]: params.amount } } as any,
      });
    } else if (
      entityType === 'receivable_account' &&
      params.receivableAccountId
    ) {
      // Receivable account: decrement for receipt (check balance)
      if (op === 'decrement') {
        const acc = await tx.receivableAccount.findUnique({
          where: { id: params.receivableAccountId },
        });
        if (!acc) throw new NotFoundException('Receivable account not found');
        if (acc.currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في حساب العملاء');
        }
      }
      await tx.receivableAccount.update({
        where: { id: params.receivableAccountId },
        data: { currentBalance: { [op]: params.amount } } as any,
      });
    } else if (entityType === 'payable_account' && params.payableAccountId) {
      // Payable account: increment for receipt (no balance check needed)
      await tx.payableAccount.update({
        where: { id: params.payableAccountId },
        data: { currentBalance: { [op]: params.amount } } as any,
      });
    }
  }

  private mapToResponse(voucher: any): ReceiptVoucherResponse {
    return {
      id: voucher.id,
      code: voucher.code,
      date: voucher.date,
      entityType: voucher.entityType,
      entityName: voucher.entityName,
      amount: voucher.amount,
      description: voucher.description,
      paymentMethod: voucher.paymentMethod,
      safeId: voucher.safeId,
      bankId: voucher.bankId,
      customerId: voucher.customerId,
      supplierId: voucher.supplierId,
      currentAccountId: voucher.currentAccountId,
      receivableAccountId: voucher.receivableAccountId || null,
      payableAccountId: voucher.payableAccountId || null,
      revenueCodeId: voucher.revenueCodeId,
      userId: voucher.userId,
      branchId: voucher.branchId,
      branch: voucher.branch || null,
      revenueCode: voucher.revenueCode || null,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
}
