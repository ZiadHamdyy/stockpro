import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateReceiptVoucherRequest } from './dtos/request/create-receipt-voucher.request';
import { UpdateReceiptVoucherRequest } from './dtos/request/update-receipt-voucher.request';
import { ReceiptVoucherResponse } from './dtos/response/receipt-voucher.response';

@Injectable()
export class ReceiptVoucherService {
  constructor(private readonly prisma: DatabaseService) {}

  // ==================== CRUD Operations ====================

  async createReceiptVoucher(
    data: CreateReceiptVoucherRequest,
    userId: string,
  ): Promise<ReceiptVoucherResponse> {
    const code = await this.generateNextCode();

    // Fetch entity name based on type
    const entityName = await this.fetchEntityName(
      data.entityType,
      data.customerId || data.supplierId || data.currentAccountId || '',
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // Always debit cash/bank account (new rule) with conflict checks
      if (data.paymentMethod === 'safe') {
        const acct = await tx.safe.findUnique({ where: { id: data.safeId! } });
        if (!acct) throw new NotFoundException('Safe not found');
        if ((acct as any).currentBalance < data.amount) throw new ConflictException(`الرصيد غير كافي في ${acct.name}`);
        await tx.safe.update({ where: { id: data.safeId! }, data: { currentBalance: { decrement: data.amount } } as any });
      } else if (data.paymentMethod === 'bank') {
        const acct = await tx.bank.findUnique({ where: { id: data.bankId! } });
        if (!acct) throw new NotFoundException('Bank not found');
        if ((acct as any).currentBalance < data.amount) throw new ConflictException(`الرصيد غير كافي في ${acct.name}`);
        await tx.bank.update({ where: { id: data.bankId! }, data: { currentBalance: { decrement: data.amount } } as any });
      }

      // Apply entity-side effect (decrement per new rule)
      await this.applyEntityBalanceEffect(tx, data.entityType, {
        currentAccountId: data.currentAccountId,
        receivableAccountId: (data as any).receivableAccountId,
        payableAccountId: (data as any).payableAccountId,
        amount: data.amount,
        direction: 'decrement',
      });

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
          userId,
          branchId: data.branchId,
        },
        include: { user: true, branch: true },
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
      orderBy: { date: 'desc' },
    });

    return vouchers.map((voucher) => this.mapToResponse(voucher));
  }

  async findOneReceiptVoucher(id: string): Promise<ReceiptVoucherResponse> {
    const receiptVoucher = await this.prisma.receiptVoucher.findUnique({
      where: { id },
      include: {
        user: true,
        branch: true,
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
      const result = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.receiptVoucher.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Receipt voucher not found');

        // Reverse previous effect on cash/bank (increment back)
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }

        // Reverse previous entity effect (increment back)
        await this.applyEntityBalanceEffect(tx, existing.entityType, {
          currentAccountId: existing.currentAccountId,
          receivableAccountId: (existing as any).receivableAccountId,
          payableAccountId: (existing as any).payableAccountId,
          amount: existing.amount,
          direction: 'increment',
        });

        // Determine new target and apply
        const newPaymentMethod = data.paymentMethod || existing.paymentMethod;
        const newAmount = data.amount !== undefined ? data.amount : existing.amount;
        const newSafeId = newPaymentMethod === 'safe' ? (data.safeId || existing.safeId) : null;
        const newBankId = newPaymentMethod === 'bank' ? (data.bankId || existing.bankId) : null;

        if (newPaymentMethod === 'safe') {
          const acct = await tx.safe.findUnique({ where: { id: newSafeId! } });
          if (!acct) throw new NotFoundException('Safe not found');
          if ((acct as any).currentBalance < newAmount) throw new ConflictException(`الرصيد غير كافي في ${acct.name}`);
          await tx.safe.update({ where: { id: newSafeId! }, data: { currentBalance: { decrement: newAmount } } as any });
        } else if (newPaymentMethod === 'bank') {
          const acct = await tx.bank.findUnique({ where: { id: newBankId! } });
          if (!acct) throw new NotFoundException('Bank not found');
          if ((acct as any).currentBalance < newAmount) throw new ConflictException(`الرصيد غير كافي في ${acct.name}`);
          await tx.bank.update({ where: { id: newBankId! }, data: { currentBalance: { decrement: newAmount } } as any });
        }

        // Apply new entity effect (decrement)
        const newEntityType = data.entityType || existing.entityType;
        const newEntityIds: any = {
          currentAccountId: data.currentAccountId ?? existing.currentAccountId,
          receivableAccountId: (data as any).receivableAccountId ?? (existing as any).receivableAccountId,
          payableAccountId: (data as any).payableAccountId ?? (existing as any).payableAccountId,
        };
        await this.applyEntityBalanceEffect(tx, newEntityType, {
          ...newEntityIds,
          amount: newAmount,
          direction: 'decrement',
        });

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
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.receiptVoucher.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Receipt voucher not found');

        // Reverse effect on cash/bank (increment back)
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { increment: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { increment: existing.amount } } as any });
        }

        // Reverse entity effect (increment back)
        await this.applyEntityBalanceEffect(tx, existing.entityType, {
          currentAccountId: existing.currentAccountId,
          receivableAccountId: (existing as any).receivableAccountId,
          payableAccountId: (existing as any).payableAccountId,
          amount: existing.amount,
          direction: 'increment',
        });

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
      if (op === 'decrement') {
        const acc = await (tx as any).currentAccount.findUnique({ where: { id: params.currentAccountId } });
        if (!acc) throw new NotFoundException('Current account not found');
        if ((acc as any).currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في الحساب الجاري');
        }
      }
      await (tx as any).currentAccount.update({
        where: { id: params.currentAccountId },
        data: { currentBalance: { [op]: params.amount } } as any,
      });
    } else if (entityType === 'receivable_account' && params.receivableAccountId) {
      if (op === 'decrement') {
        const acc = await (tx as any).receivableAccount.findUnique({ where: { id: params.receivableAccountId } });
        if (!acc) throw new NotFoundException('Receivable account not found');
        if ((acc as any).currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في حساب العملاء');
        }
      }
      await (tx as any).receivableAccount.update({
        where: { id: params.receivableAccountId },
        data: { currentBalance: { [op]: params.amount } } as any,
      });
    } else if (entityType === 'payable_account' && params.payableAccountId) {
      if (op === 'decrement') {
        const acc = await (tx as any).payableAccount.findUnique({ where: { id: params.payableAccountId } });
        if (!acc) throw new NotFoundException('Payable account not found');
        if ((acc as any).currentBalance < params.amount) {
          throw new ConflictException('الرصيد غير كافي في حساب الموردين');
        }
      }
      await (tx as any).payableAccount.update({
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
      userId: voucher.userId,
      branchId: voucher.branchId,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
}
