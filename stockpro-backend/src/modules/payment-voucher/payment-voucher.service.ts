import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePaymentVoucherRequest } from './dtos/request/create-payment-voucher.request';
import { UpdatePaymentVoucherRequest } from './dtos/request/update-payment-voucher.request';
import { PaymentVoucherResponse } from './dtos/response/payment-voucher.response';

@Injectable()
export class PaymentVoucherService {
  constructor(private readonly prisma: DatabaseService) {}

  // ==================== CRUD Operations ====================

  async createPaymentVoucher(
    data: CreatePaymentVoucherRequest,
    userId: string,
  ): Promise<PaymentVoucherResponse> {
    const code = await this.generateNextCode();

    // Fetch entity name based on type
    const entityId = data.customerId || 
                     data.supplierId || 
                     data.currentAccountId || 
                     data.expenseCodeId || 
                     data.receivableAccountId || 
                     data.payableAccountId || 
                     '';
    const entityName = await this.fetchEntityName(data.entityType, entityId);

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate and debit from source
      if (data.paymentMethod === 'safe') {
        const sender = await tx.safe.findUnique({ where: { id: data.safeId! } });
        if (!sender) throw new NotFoundException('Safe not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await tx.safe.update({ where: { id: data.safeId! }, data: { currentBalance: { decrement: data.amount } } as any });
      } else if (data.paymentMethod === 'bank') {
        const sender = await tx.bank.findUnique({ where: { id: data.bankId! } });
        if (!sender) throw new NotFoundException('Bank not found');
        if ( (sender as any).currentBalance < data.amount) {
          throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
        }
        await tx.bank.update({ where: { id: data.bankId! }, data: { currentBalance: { decrement: data.amount } } as any });
      }

      // Apply entity balance effects
      if (data.entityType === 'supplier' && data.supplierId) {
        // Supplier: decrement (we paid supplier)
        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentBalance: { decrement: data.amount } },
        });
      } else if (data.entityType === 'customer' && data.customerId) {
        // Customer: increment (we refunded customer)
        await tx.customer.update({
          where: { id: data.customerId },
          data: { currentBalance: { increment: data.amount } },
        });
      } else if ((data.entityType === 'expense' || data.entityType === 'expense-Type') && data.expenseCodeId) {
        // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
        // If tracking is needed, add currentBalance field to ExpenseCode model
      } else {
        // Apply entity-side effect for other account types
        const direction = data.entityType === 'payable_account' ? 'decrement' : 'increment';
        await this.applyEntityBalanceEffect(tx, data.entityType, {
          currentAccountId: data.currentAccountId,
          receivableAccountId: data.receivableAccountId as any,
          payableAccountId: data.payableAccountId as any,
          amount: data.amount,
          direction,
        });
      }

      const paymentVoucher = await tx.paymentVoucher.create({
        data: ({
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
          expenseCodeId: data.expenseCodeId,
          receivableAccountId: (data as any).receivableAccountId,
          payableAccountId: (data as any).payableAccountId,
          userId,
          branchId: data.branchId,
        } as any),
        include: { user: true, branch: true },
      });
      return paymentVoucher;
    });

    return this.mapToResponse(result);
  }

  async findAllPaymentVouchers(
    search?: string,
  ): Promise<PaymentVoucherResponse[]> {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { entityName: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const vouchers = await this.prisma.paymentVoucher.findMany({
      where,
      include: {
        user: true,
        branch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findExpenseVouchers(): Promise<PaymentVoucherResponse[]> {
    const vouchers = await this.prisma.paymentVoucher.findMany({
      where: {
        expenseCodeId: { not: null },
      },
      include: {
        expenseCode: true,
        safe: true,
        bank: true,
        user: true,
        branch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findOnePaymentVoucher(id: string): Promise<PaymentVoucherResponse> {
    const paymentVoucher = await this.prisma.paymentVoucher.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
      },
    });

    if (!paymentVoucher) {
      throw new NotFoundException('Payment voucher not found');
    }

    return this.mapToResponse(paymentVoucher);
  }

  async updatePaymentVoucher(
    id: string,
    data: UpdatePaymentVoucherRequest,
  ): Promise<PaymentVoucherResponse> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.paymentVoucher.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Payment voucher not found');

        // Reverse previous debit on safe/bank
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }

        // Reverse previous entity effect
        if (existing.entityType === 'supplier' && existing.supplierId) {
          await tx.supplier.update({
            where: { id: existing.supplierId },
            data: { currentBalance: { increment: existing.amount } },
          });
        } else if (existing.entityType === 'customer' && existing.customerId) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { currentBalance: { decrement: existing.amount } },
          });
        } else if ((existing.entityType === 'expense' || existing.entityType === 'expense-Type') && existing.expenseCodeId) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else {
          const reverseDirection = existing.entityType === 'payable_account' ? 'increment' : 'decrement';
          await this.applyEntityBalanceEffect(tx, existing.entityType, {
            currentAccountId: existing.currentAccountId,
            receivableAccountId: (existing as any).receivableAccountId,
            payableAccountId: (existing as any).payableAccountId,
            amount: existing.amount,
            direction: reverseDirection,
          });
        }

        // Determine new source and amount, then validate and apply debit
        const newPaymentMethod = data.paymentMethod || existing.paymentMethod;
        const newAmount = data.amount !== undefined ? data.amount : existing.amount;
        const newSafeId = newPaymentMethod === 'safe' ? (data.safeId || existing.safeId) : null;
        const newBankId = newPaymentMethod === 'bank' ? (data.bankId || existing.bankId) : null;

        if (newPaymentMethod === 'safe') {
          const sender = await tx.safe.findUnique({ where: { id: newSafeId! } });
          if (!sender) throw new NotFoundException('Safe not found');
          if ((sender as any).currentBalance < newAmount) throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          await tx.safe.update({ where: { id: newSafeId! }, data: { currentBalance: { decrement: newAmount } } as any });
        } else if (newPaymentMethod === 'bank') {
          const sender = await tx.bank.findUnique({ where: { id: newBankId! } });
          if (!sender) throw new NotFoundException('Bank not found');
          if ((sender as any).currentBalance < newAmount) throw new ConflictException(`الرصيد غير كافي في ${sender.name}`);
          await tx.bank.update({ where: { id: newBankId! }, data: { currentBalance: { decrement: newAmount } } as any });
        }

        // Apply new entity effect
        const newEntityType = data.entityType || existing.entityType;
        const newSupplierId = data.supplierId ?? existing.supplierId;
        const newCustomerId = data.customerId ?? existing.customerId;
        const newExpenseCodeId = data.expenseCodeId ?? existing.expenseCodeId;
        
        if (newEntityType === 'supplier' && newSupplierId) {
          await tx.supplier.update({
            where: { id: newSupplierId },
            data: { currentBalance: { decrement: newAmount } },
          });
        } else if (newEntityType === 'customer' && newCustomerId) {
          await tx.customer.update({
            where: { id: newCustomerId },
            data: { currentBalance: { increment: newAmount } },
          });
        } else if ((newEntityType === 'expense' || newEntityType === 'expense-Type') && newExpenseCodeId) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else {
          const newEntityIds: any = {
            currentAccountId: data.currentAccountId ?? existing.currentAccountId,
            receivableAccountId: (data as any).receivableAccountId ?? (existing as any).receivableAccountId,
            payableAccountId: (data as any).payableAccountId ?? (existing as any).payableAccountId,
          };
          const direction = newEntityType === 'payable_account' ? 'decrement' : 'increment';
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
        };

        // If entity type or ID changed, fetch new entity name
        const newEntityId = data.customerId ?? 
                           data.supplierId ?? 
                           data.currentAccountId ?? 
                           data.expenseCodeId ?? 
                           data.receivableAccountId ?? 
                           data.payableAccountId ?? 
                           null;
        if (newEntityType !== existing.entityType || newEntityId !== null) {
          const entityIdToUse = newEntityId || 
                                existing.customerId || 
                                existing.supplierId || 
                                existing.currentAccountId || 
                                existing.expenseCodeId || 
                                (existing as any).receivableAccountId || 
                                (existing as any).payableAccountId || 
                                '';
          updateData.entityName = await this.fetchEntityName(newEntityType, entityIdToUse);
        }

        const updated = await tx.paymentVoucher.update({
          where: { id },
          data: updateData as any,
          include: { user: true, branch: true },
        });
        return updated;
      });

      return this.mapToResponse(result);
    } catch (error) {
      throw new NotFoundException('Payment voucher not found');
    }
  }

  async removePaymentVoucher(id: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.paymentVoucher.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Payment voucher not found');

        // Reverse debit on safe/bank
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }

        // Reverse entity effect
        if (existing.entityType === 'supplier' && existing.supplierId) {
          await tx.supplier.update({
            where: { id: existing.supplierId },
            data: { currentBalance: { increment: existing.amount } },
          });
        } else if (existing.entityType === 'customer' && existing.customerId) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { currentBalance: { decrement: existing.amount } },
          });
        } else if ((existing.entityType === 'expense' || existing.entityType === 'expense-Type') && existing.expenseCodeId) {
          // Expense-Type: Note - ExpenseCode doesn't have currentBalance field
          // If tracking is needed, add currentBalance field to ExpenseCode model
        } else {
          const reverseDirection = existing.entityType === 'payable_account' ? 'increment' : 'decrement';
          await this.applyEntityBalanceEffect(tx, existing.entityType, {
            currentAccountId: existing.currentAccountId,
            receivableAccountId: (existing as any).receivableAccountId,
            payableAccountId: (existing as any).payableAccountId,
            amount: existing.amount,
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

  private async generateNextCode(): Promise<string> {
    const lastVoucher = await this.prisma.paymentVoucher.findFirst({
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
        const receivable = await (this.prisma as any).receivableAccount.findUnique({
          where: { id: entityId },
        });
        return receivable?.name || '';

      case 'payable_account':
        const payable = await (this.prisma as any).payableAccount.findUnique({
          where: { id: entityId },
        });
        return payable?.name || '';

      case 'expense':
      case 'expense-Type':
        const expenseCode = await this.prisma.expenseCode.findUnique({
          where: { id: entityId },
        });
        return expenseCode?.name || '';

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
    const deltaOp = params.direction;
    if (entityType === 'current_account' && params.currentAccountId) {
      // Current account: decrement for payment (check balance)
      if (deltaOp === 'decrement') {
        const acc = await (tx as any).currentAccount.findUnique({ where: { id: params.currentAccountId } });
        if (!acc) throw new NotFoundException('Current account not found');
        if ((acc as any).currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في الحساب الجاري');
        }
      }
      await (tx as any).currentAccount.update({
        where: { id: params.currentAccountId },
        data: { currentBalance: { [deltaOp]: params.amount } } as any,
      });
    } else if (entityType === 'receivable_account' && params.receivableAccountId) {
      // Receivable account: increment for payment (no balance check needed)
      await (tx as any).receivableAccount.update({
        where: { id: params.receivableAccountId },
        data: { currentBalance: { [deltaOp]: params.amount } } as any,
      });
    } else if (entityType === 'payable_account' && params.payableAccountId) {
      // Payable account: decrement for payment (check balance)
      if (deltaOp === 'decrement') {
        const acc = await (tx as any).payableAccount.findUnique({ where: { id: params.payableAccountId } });
        if (!acc) throw new NotFoundException('Payable account not found');
        if ((acc as any).currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في حساب الموردين');
        }
      }
      await (tx as any).payableAccount.update({
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
      description: voucher.description,
      paymentMethod: voucher.paymentMethod,
      safeId: voucher.safeId,
      bankId: voucher.bankId,
      customerId: voucher.customerId,
      supplierId: voucher.supplierId,
      currentAccountId: voucher.currentAccountId,
      expenseCodeId: voucher.expenseCodeId,
      receivableAccountId: (voucher as any).receivableAccountId || null,
      payableAccountId: (voucher as any).payableAccountId || null,
      userId: voucher.userId,
      branchId: voucher.branchId,
      branch: voucher.branch || null,
      expenseCode: voucher.expenseCode,
      safe: voucher.safe,
      bank: voucher.bank,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
}
