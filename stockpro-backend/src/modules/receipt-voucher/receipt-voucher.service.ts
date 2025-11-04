import { Injectable, NotFoundException } from '@nestjs/common';
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
      // Credit target account
      if (data.paymentMethod === 'safe') {
        await tx.safe.update({
          where: { id: data.safeId! },
          data: { currentBalance: { increment: data.amount } } as any,
        });
      } else if (data.paymentMethod === 'bank') {
        await tx.bank.update({
          where: { id: data.bankId! },
          data: { currentBalance: { increment: data.amount } } as any,
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

        // Reverse previous effect
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { decrement: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { decrement: existing.amount } } as any });
        }

        // Determine new target and apply
        const newPaymentMethod = data.paymentMethod || existing.paymentMethod;
        const newAmount = data.amount !== undefined ? data.amount : existing.amount;
        const newSafeId = newPaymentMethod === 'safe' ? (data.safeId || existing.safeId) : null;
        const newBankId = newPaymentMethod === 'bank' ? (data.bankId || existing.bankId) : null;

        if (newPaymentMethod === 'safe') {
          await tx.safe.update({ where: { id: newSafeId! }, data: { currentBalance: { increment: newAmount } } as any });
        } else if (newPaymentMethod === 'bank') {
          await tx.bank.update({ where: { id: newBankId! }, data: { currentBalance: { increment: newAmount } } as any });
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

        // Reverse effect
        if (existing.paymentMethod === 'safe' && existing.safeId) {
          await tx.safe.update({ where: { id: existing.safeId }, data: { currentBalance: { decrement: existing.amount } } as any });
        } else if (existing.paymentMethod === 'bank' && existing.bankId) {
          await tx.bank.update({ where: { id: existing.bankId }, data: { currentBalance: { decrement: existing.amount } } as any });
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

      default:
        return '';
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
