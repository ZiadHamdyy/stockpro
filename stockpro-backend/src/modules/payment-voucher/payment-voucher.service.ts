import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePaymentVoucherRequest } from './dtos/request/create-payment-voucher.request';
import { UpdatePaymentVoucherRequest } from './dtos/request/update-payment-voucher.request';
import { PaymentVoucherResponse } from './dtos/response/payment-voucher.response';
import { AccountingService } from '../../common/services/accounting.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PaymentVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ==================== CRUD Operations ====================

  async createPaymentVoucher(
    companyId: string,
    data: CreatePaymentVoucherRequest,
    userId: string,
  ): Promise<PaymentVoucherResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'financialVouchersPerMonth');

    const voucherDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, voucherDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create voucher: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, voucherDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create voucher in a closed fiscal period');
    }

    const code = await this.generateNextCode(companyId);

    // Fetch entity name based on type
    const entityId =
      data.customerId ||
      data.supplierId ||
      data.currentAccountId ||
      data.expenseCodeId ||
      data.revenueCodeId ||
      data.receivableAccountId ||
      data.payableAccountId ||
      '';
    const entityName = await this.fetchEntityName(companyId, data.entityType, entityId);

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate and debit from source
      if (data.paymentMethod === 'safe') {
        if (!data.safeId) throw new NotFoundException('Safe not found');
        const sender = await tx.safe.findUnique({
          where: { id: data.safeId },
        });
        if (!sender || sender.companyId !== companyId) throw new NotFoundException('Safe not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await AccountingService.applyImpact({
          kind: 'payment-voucher',
          amount: data.amount,
          paymentTargetType: 'safe',
          branchId: sender.branchId ?? data.branchId ?? null,
          safeId: sender.id,
          tx,
        });
      } else if (data.paymentMethod === 'bank') {
        if (!data.bankId) throw new NotFoundException('Bank not found');
        const sender = await tx.bank.findUnique({
          where: { id: data.bankId },
        });
        if (!sender || sender.companyId !== companyId) throw new NotFoundException('Bank not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await AccountingService.applyImpact({
          kind: 'payment-voucher',
          amount: data.amount,
          paymentTargetType: 'bank',
          bankId: sender.id,
          tx,
        });
      }

      // Apply entity balance effects (skip for VAT and profit_and_loss types)
      if (data.entityType === 'vat' || data.entityType === 'profit_and_loss') {
        // VAT and profit_and_loss vouchers don't affect entity balances
      } else if (data.entityType === 'supplier' && data.supplierId) {
        // Supplier: decrement (we paid supplier)
        const supplier = await tx.supplier.findUnique({
          where: { id: data.supplierId },
        });
        if (supplier && supplier.companyId === companyId) {
          await tx.supplier.update({
            where: { id: data.supplierId },
            data: { currentBalance: { decrement: data.amount } },
          });
        }
      } else if (data.entityType === 'customer' && data.customerId) {
        // Customer: increment (we refunded customer)
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });
        if (customer && customer.companyId === companyId) {
          await tx.customer.update({
            where: { id: data.customerId },
            data: { currentBalance: { increment: data.amount } },
          });
        }
      } else if (
        (data.entityType === 'expense' || data.entityType === 'expense-Type') &&
        data.expenseCodeId
      ) {
        // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
        // If tracking is needed, add currentBalance field to ExpenseCode model
      } else if (data.entityType === 'revenue' && data.revenueCodeId) {
        // Revenue: Note - RevenueCode doesn't have currentBalance field
        // Revenue codes are for categorization only
        } else {
          // Apply entity-side effect for other account types
          // For payable_account, receivable_account, and current_account: increment (transfer money to account)
          const direction = 'increment';
          await this.applyEntityBalanceEffect(companyId, tx, data.entityType, {
            currentAccountId: data.currentAccountId,
            receivableAccountId: data.receivableAccountId as any,
            payableAccountId: data.payableAccountId as any,
            amount: data.amount,
            direction,
          });
        }

      const paymentVoucher = await tx.paymentVoucher.create({
        data: {
          code,
          date: new Date(data.date),
          entityType: data.entityType,
          entityName,
          amount: data.amount,
          priceBeforeTax: data.priceBeforeTax,
          taxPrice: data.taxPrice,
          description: data.description,
          paymentMethod: data.paymentMethod,
          safeId: data.safeId,
          bankId: data.bankId,
          customerId: data.customerId,
          supplierId: data.supplierId,
          currentAccountId: data.currentAccountId,
          expenseCodeId: data.expenseCodeId,
          revenueCodeId: data.revenueCodeId,
          receivableAccountId: (data as any).receivableAccountId,
          payableAccountId: (data as any).payableAccountId,
          userId,
          branchId: data.branchId,
          companyId,
        } as any,
        include: { user: true, branch: true, expenseCode: true, revenueCode: true },
      });
      return paymentVoucher;
    });

    return this.mapToResponse(result);
  }

  async findAllPaymentVouchers(
    companyId: string,
    search?: string,
  ): Promise<PaymentVoucherResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        { entityName: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const vouchers = await this.prisma.paymentVoucher.findMany({
      where,
      include: {
        user: true,
        branch: true,
        expenseCode: true,
        revenueCode: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findExpenseVouchers(companyId: string): Promise<PaymentVoucherResponse[]> {
    const vouchers = await this.prisma.paymentVoucher.findMany({
      where: {
        companyId,
        expenseCodeId: { not: null },
      },
      include: {
        expenseCode: true,
        revenueCode: true,
        safe: true,
        bank: true,
        user: true,
        branch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findOnePaymentVoucher(companyId: string, id: string): Promise<PaymentVoucherResponse> {
    const paymentVoucher = await this.prisma.paymentVoucher.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
        expenseCode: true,
        revenueCode: true,
      },
    });

    if (!paymentVoucher || paymentVoucher.companyId !== companyId) {
      throw new NotFoundException('Payment voucher not found');
    }

    return this.mapToResponse(paymentVoucher);
  }

  async updatePaymentVoucher(
    companyId: string,
    id: string,
    data: UpdatePaymentVoucherRequest,
  ): Promise<PaymentVoucherResponse> {
    // Verify the voucher belongs to the company
    const existing = await this.findOnePaymentVoucher(companyId, id);

    try {
      // Check if date is in a closed period (use new date if provided, otherwise existing date)
      const voucherDate = data.date ? new Date(data.date) : existing.date;
      
      // If date is being changed, validate it's in an open period
      if (data.date) {
        const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, voucherDate);
        if (!hasOpenPeriod) {
          throw new ForbiddenException('لا يمكن تعديل السند: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
        }
      }
      
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, voucherDate);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن تعديل السند: الفترة المحاسبية مغلقة');
      }

      // Get existing voucher record for operations
      const existingRecord = await this.prisma.paymentVoucher.findUnique({
        where: { id },
      });
      if (!existingRecord || existingRecord.companyId !== companyId) {
        throw new NotFoundException('Payment voucher not found');
      }

      const result = await this.prisma.$transaction(async (tx) => {

        // Reverse previous debit on safe/bank
        if (existingRecord.paymentMethod === 'safe' && existingRecord.safeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existingRecord.safeId },
          });
          if (!safe || safe.companyId !== companyId) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'payment-voucher',
            amount: existingRecord.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existingRecord.safeId,
            tx,
          });
        } else if (existingRecord.paymentMethod === 'bank' && existingRecord.bankId) {
          await AccountingService.reverseImpact({
            kind: 'payment-voucher',
            amount: existingRecord.amount,
            paymentTargetType: 'bank',
            bankId: existingRecord.bankId,
            tx,
          });
        }

        // Reverse previous entity effect (skip for VAT type)
        if (existingRecord.entityType === 'vat' || existingRecord.entityType === 'profit_and_loss') {
          // VAT and profit_and_loss vouchers don't affect entity balances
        } else if (existingRecord.entityType === 'supplier' && existingRecord.supplierId) {
          const supplier = await tx.supplier.findUnique({
            where: { id: existingRecord.supplierId },
          });
          if (supplier && supplier.companyId === companyId) {
            await tx.supplier.update({
              where: { id: existingRecord.supplierId },
              data: { currentBalance: { increment: existingRecord.amount } },
            });
          }
        } else if (existingRecord.entityType === 'customer' && existingRecord.customerId) {
          const customer = await tx.customer.findUnique({
            where: { id: existingRecord.customerId },
          });
          if (customer && customer.companyId === companyId) {
            await tx.customer.update({
              where: { id: existingRecord.customerId },
              data: { currentBalance: { decrement: existingRecord.amount } },
            });
          }
        } else if (
          (existingRecord.entityType === 'expense' ||
            existingRecord.entityType === 'expense-Type') &&
          existingRecord.expenseCodeId
        ) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else {
          // Reverse: decrement for all account types (subtract the money we previously added)
          const reverseDirection = 'decrement';
          await this.applyEntityBalanceEffect(companyId, tx, existingRecord.entityType, {
            currentAccountId: existingRecord.currentAccountId,
            receivableAccountId: (existingRecord as any).receivableAccountId,
            payableAccountId: (existingRecord as any).payableAccountId,
            amount: existingRecord.amount,
            direction: reverseDirection,
          });
        }

        // Determine new source and amount, then validate and apply debit
        const newPaymentMethod = data.paymentMethod || existingRecord.paymentMethod;
        const newAmount =
          data.amount !== undefined ? data.amount : existingRecord.amount;
        const newSafeId =
          newPaymentMethod === 'safe' ? data.safeId || existingRecord.safeId : null;
        const newBankId =
          newPaymentMethod === 'bank' ? data.bankId || existingRecord.bankId : null;

        if (newPaymentMethod === 'safe') {
          if (!newSafeId) throw new NotFoundException('Safe not found');
          const sender = await tx.safe.findUnique({
            where: { id: newSafeId },
          });
          if (!sender || sender.companyId !== companyId) throw new NotFoundException('Safe not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await AccountingService.applyImpact({
            kind: 'payment-voucher',
            amount: newAmount,
            paymentTargetType: 'safe',
            branchId: sender.branchId ?? data.branchId ?? null,
            safeId: newSafeId,
            tx,
          });
        } else if (newPaymentMethod === 'bank') {
          if (!newBankId) throw new NotFoundException('Bank not found');
          const sender = await tx.bank.findUnique({
            where: { id: newBankId },
          });
          if (!sender || sender.companyId !== companyId) throw new NotFoundException('Bank not found');
          if ((sender as any).currentBalance < newAmount) {
            throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          }
          await AccountingService.applyImpact({
            kind: 'payment-voucher',
            amount: newAmount,
            paymentTargetType: 'bank',
            bankId: newBankId,
            tx,
          });
        }

        // Apply new entity effect (skip for VAT type)
        const newEntityType = data.entityType || existingRecord.entityType;
        const newSupplierId = data.supplierId ?? existingRecord.supplierId;
        const newCustomerId = data.customerId ?? existingRecord.customerId;
        const newExpenseCodeId = data.expenseCodeId ?? existingRecord.expenseCodeId;

        if (newEntityType === 'vat') {
          // VAT vouchers don't affect entity balances
        } else if (newEntityType === 'supplier' && newSupplierId) {
          const supplier = await tx.supplier.findUnique({
            where: { id: newSupplierId },
          });
          if (supplier && supplier.companyId === companyId) {
            await tx.supplier.update({
              where: { id: newSupplierId },
              data: { currentBalance: { decrement: newAmount } },
            });
          }
        } else if (newEntityType === 'customer' && newCustomerId) {
          const customer = await tx.customer.findUnique({
            where: { id: newCustomerId },
          });
          if (customer && customer.companyId === companyId) {
            await tx.customer.update({
              where: { id: newCustomerId },
              data: { currentBalance: { increment: newAmount } },
            });
          }
        } else if (
          (newEntityType === 'expense' || newEntityType === 'expense-Type') &&
          newExpenseCodeId
        ) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else if (newEntityType === 'revenue' && data.revenueCodeId) {
          // Revenue: Note - RevenueCode doesn't have currentBalance field
          // Revenue codes are for categorization only
        } else {
          const newEntityIds: any = {
            currentAccountId:
              data.currentAccountId ?? existingRecord.currentAccountId,
            receivableAccountId:
              (data as any).receivableAccountId ??
              (existingRecord as any).receivableAccountId,
            payableAccountId:
              (data as any).payableAccountId ??
              (existingRecord as any).payableAccountId,
          };
          // For payable_account, receivable_account, and current_account: increment (transfer money to account)
          const direction = 'increment';
          await this.applyEntityBalanceEffect(companyId, tx, newEntityType, {
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
          data.expenseCodeId ??
          data.revenueCodeId ??
          data.receivableAccountId ??
          data.payableAccountId ??
          null;
        if (newEntityType !== existing.entityType || newEntityId !== null) {
          const entityIdToUse =
            newEntityId ||
            existing.customerId ||
            existing.supplierId ||
            existing.currentAccountId ||
            existing.expenseCodeId ||
            existing.revenueCodeId ||
            (existing as any).receivableAccountId ||
            (existing as any).payableAccountId ||
            '';
          updateData.entityName = await this.fetchEntityName(
            companyId,
            newEntityType,
            entityIdToUse,
          );
        }

        const updated = await tx.paymentVoucher.update({
          where: { id },
          data: updateData,
          include: { user: true, branch: true, expenseCode: true, revenueCode: true },
        });
        return updated;
      });

      return this.mapToResponse(result);
    } catch (error) {
      throw new NotFoundException('Payment voucher not found');
    }
  }

  async removePaymentVoucher(companyId: string, id: string): Promise<void> {
    // Verify the voucher belongs to the company
    const existing = await this.findOnePaymentVoucher(companyId, id);

    try {
      // Check if voucher date is in a closed period before starting transaction
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, existing.date);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن حذف السند: الفترة المحاسبية مغلقة');
      }

      await this.prisma.$transaction(async (tx) => {
        const existingInTx = await tx.paymentVoucher.findUnique({ where: { id_companyId: { id, companyId } } });
        if (!existingInTx) throw new NotFoundException('Payment voucher not found');

        // Reverse debit on safe/bank
        if (existingInTx.paymentMethod === 'safe' && existingInTx.safeId) {
          const safe = await tx.safe.findUnique({
            where: { id: existingInTx.safeId },
          });
          if (!safe || safe.companyId !== companyId) throw new NotFoundException('Safe not found');
          await AccountingService.reverseImpact({
            kind: 'payment-voucher',
            amount: existingInTx.amount,
            paymentTargetType: 'safe',
            branchId: safe.branchId,
            safeId: existingInTx.safeId,
            tx,
          });
        } else if (existingInTx.paymentMethod === 'bank' && existingInTx.bankId) {
          await AccountingService.reverseImpact({
            kind: 'payment-voucher',
            amount: existingInTx.amount,
            paymentTargetType: 'bank',
            bankId: existingInTx.bankId,
            tx,
          });
        }

        // Reverse entity effect (skip for VAT type)
        if (existingInTx.entityType === 'vat' || existingInTx.entityType === 'profit_and_loss') {
          // VAT and profit_and_loss vouchers don't affect entity balances
        } else if (existingInTx.entityType === 'supplier' && existingInTx.supplierId) {
          await tx.supplier.update({
            where: { id: existingInTx.supplierId },
            data: { currentBalance: { increment: existingInTx.amount } },
          });
        } else if (existingInTx.entityType === 'customer' && existingInTx.customerId) {
          await tx.customer.update({
            where: { id: existingInTx.customerId },
            data: { currentBalance: { decrement: existingInTx.amount } },
          });
        } else if (
          (existingInTx.entityType === 'expense' ||
            existingInTx.entityType === 'expense-Type') &&
          existingInTx.expenseCodeId
        ) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else {
          // Reverse: decrement for all account types (subtract the money we previously added)
          const reverseDirection = 'decrement';
          await this.applyEntityBalanceEffect(companyId, tx, existingInTx.entityType, {
            currentAccountId: existingInTx.currentAccountId,
            receivableAccountId: (existingInTx as any).receivableAccountId,
            payableAccountId: (existingInTx as any).payableAccountId,
            amount: existingInTx.amount,
            direction: reverseDirection,
          });
        }

        await tx.paymentVoucher.delete({ where: { id } });
      });
    } catch (error) {
      throw new NotFoundException('Payment voucher not found');
    }
  }

  // ==================== Private Helper Methods ====================

  private async generateNextCode(companyId: string): Promise<string> {
    const lastVoucher = await this.prisma.paymentVoucher.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastVoucher) {
      return 'PAY-001';
    }

    const match = lastVoucher.code.match(/PAY-(\d+)/);
    if (!match) {
      return 'PAY-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `PAY-${String(nextNumber).padStart(3, '0')}`;
  }

  private async fetchEntityName(
    companyId: string,
    entityType: string,
    entityId: string,
  ): Promise<string> {
    switch (entityType) {
      case 'customer':
        const customer = await this.prisma.customer.findUnique({
          where: { id: entityId },
        });
        return customer && customer.companyId === companyId ? customer.name : '';

      case 'supplier':
        const supplier = await this.prisma.supplier.findUnique({
          where: { id: entityId },
        });
        return supplier && supplier.companyId === companyId ? supplier.name : '';

      case 'current_account':
        const currentAccount = await this.prisma.currentAccount.findUnique({
          where: { id: entityId },
        });
        return currentAccount && currentAccount.companyId === companyId ? currentAccount.name : '';

      case 'receivable_account':
        const receivable = await (
          this.prisma as any
        ).receivableAccount.findUnique({
          where: { id: entityId },
        });
        return receivable && receivable.companyId === companyId ? receivable.name : '';

      case 'payable_account':
        const payable = await (this.prisma as any).payableAccount.findUnique({
          where: { id: entityId },
        });
        return payable && payable.companyId === companyId ? payable.name : '';

      case 'expense':
      case 'expense-Type':
        const expenseCode = await this.prisma.expenseCode.findUnique({
          where: { id: entityId },
        });
        return expenseCode && expenseCode.companyId === companyId ? expenseCode.name : '';

      case 'revenue':
        const revenueCode = await this.prisma.revenueCode.findUnique({
          where: { id: entityId },
        });
        return revenueCode && revenueCode.companyId === companyId ? revenueCode.name : '';

      case 'vat':
        return 'ضريبة القيمة المضافة';

      case 'profit_and_loss':
        return 'الارباح والخسائر المبقاه';

      default:
        return '';
    }
  }

  private async applyEntityBalanceEffect(
    companyId: string,
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
    const deltaOp = params.direction;
    if (entityType === 'current_account' && params.currentAccountId) {
      // Current account: decrement for payment (check balance)
      if (deltaOp === 'decrement') {
        const acc = await tx.currentAccount.findUnique({
          where: { id: params.currentAccountId },
        });
        if (!acc || acc.companyId !== companyId) throw new NotFoundException('Current account not found');
        if (acc.currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في الحساب الجاري');
        }
      }
      await tx.currentAccount.update({
        where: { id: params.currentAccountId },
        data: { currentBalance: { [deltaOp]: params.amount } } as any,
      });
    } else if (
      entityType === 'receivable_account' &&
      params.receivableAccountId
    ) {
      // Receivable account: increment for payment (no balance check needed)
      await tx.receivableAccount.update({
        where: { id: params.receivableAccountId },
        data: { currentBalance: { [deltaOp]: params.amount } } as any,
      });
    } else if (entityType === 'payable_account' && params.payableAccountId) {
      // Payable account: increment for payment (transfer money to account, no balance check needed)
      await tx.payableAccount.update({
        where: { id: params.payableAccountId },
        data: { currentBalance: { [deltaOp]: params.amount } } as any,
      });
    }
  }

  private mapToResponse(voucher: any): PaymentVoucherResponse {
    return {
      id: voucher.id,
      code: voucher.code,
      date: voucher.date,
      entityType: voucher.entityType,
      entityName: voucher.entityName,
      amount: voucher.amount,
      priceBeforeTax: voucher.priceBeforeTax || null,
      taxPrice: voucher.taxPrice || null,
      description: voucher.description,
      paymentMethod: voucher.paymentMethod,
      safeId: voucher.safeId,
      bankId: voucher.bankId,
      customerId: voucher.customerId,
      supplierId: voucher.supplierId,
      currentAccountId: voucher.currentAccountId,
      expenseCodeId: voucher.expenseCodeId,
      revenueCodeId: voucher.revenueCodeId,
      receivableAccountId: voucher.receivableAccountId || null,
      payableAccountId: voucher.payableAccountId || null,
      userId: voucher.userId,
      branchId: voucher.branchId,
      branch: voucher.branch || null,
      expenseCode: voucher.expenseCode,
      revenueCode: voucher.revenueCode,
      safe: voucher.safe,
      bank: voucher.bank,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
}
