import { Injectable, NotFoundException } from '@nestjs/common';
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
    const entityName = await this.fetchEntityName(
      data.entityType,
      data.customerId || data.supplierId || data.currentAccountId || data.expenseCodeId || '',
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate and debit from source
      if (data.paymentMethod === 'safe') {
        const sender = await tx.safe.findUnique({ where: { id: data.safeId! } });
        if (!sender) throw new NotFoundException('Safe not found');
        if ((sender as any).currentBalance < data.amount) {
          throw new NotFoundException('Insufficient balance');
        }
        await tx.safe.update({ where: { id: data.safeId! }, data: { currentBalance: { decrement: data.amount } } as any });
      } else if (data.paymentMethod === 'bank') {
        const sender = await tx.bank.findUnique({ where: { id: data.bankId! } });
        if (!sender) throw new NotFoundException('Bank not found');
        if ( (sender as any).currentBalance < data.amount) {
          throw new NotFoundException('Insufficient balance');
        }
        await tx.bank.update({ where: { id: data.bankId! }, data: { currentBalance: { decrement: data.amount } } as any });
      }

      const paymentVoucher = await tx.paymentVoucher.create({
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
          expenseCodeId: data.expenseCodeId,
          userId,
          branchId: data.branchId,
        },
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
      orderBy: { date: 'desc' },
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
      orderBy: { date: 'desc' },
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

        // Reverse previous debit
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }

        // Determine new source and amount, then validate and apply debit
        const newPaymentMethod = data.paymentMethod || existing.paymentMethod;
        const newAmount = data.amount !== undefined ? data.amount : existing.amount;
        const newSafeId = newPaymentMethod === 'safe' ? (data.safeId || existing.safeId) : null;
        const newBankId = newPaymentMethod === 'bank' ? (data.bankId || existing.bankId) : null;

        if (newPaymentMethod === 'safe') {
          const sender = await tx.safe.findUnique({ where: { id: newSafeId! } });
          if (!sender) throw new NotFoundException('Safe not found');
          if ((sender as any).currentBalance < newAmount) throw new NotFoundException('Insufficient balance');
          await tx.safe.update({ where: { id: newSafeId! }, data: { currentBalance: { decrement: newAmount } } as any });
        } else if (newPaymentMethod === 'bank') {
          const sender = await tx.bank.findUnique({ where: { id: newBankId! } });
          if (!sender) throw new NotFoundException('Bank not found');
          if ((sender as any).currentBalance < newAmount) throw new NotFoundException('Insufficient balance');
          await tx.bank.update({ where: { id: newBankId! }, data: { currentBalance: { decrement: newAmount } } as any });
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
        if (data.entityType && data.entityId) {
          updateData.entityName = await this.fetchEntityName(data.entityType, data.entityId);
        }

        const updated = await tx.paymentVoucher.update({
          where: { id },
          data: updateData,
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

        // Reverse debit
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
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

      case 'expense':
        const expenseCode = await this.prisma.expenseCode.findUnique({
          where: { id: entityId },
        });
        return expenseCode?.name || '';

      default:
        return '';
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
      userId: voucher.userId,
      branchId: voucher.branchId,
      expenseCode: voucher.expenseCode,
      safe: voucher.safe,
      bank: voucher.bank,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
}
