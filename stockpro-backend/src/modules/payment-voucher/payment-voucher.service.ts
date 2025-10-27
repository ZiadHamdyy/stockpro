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
      data.customerId ||
        data.supplierId ||
        data.currentAccountId ||
        data.expenseCodeId ||
        '',
    );

    const paymentVoucher = await this.prisma.paymentVoucher.create({
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
      include: {
        user: true,
        branch: true,
      },
    });

    return this.mapToResponse(paymentVoucher);
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
      const updateData: any = { ...data };

      if (data.date) {
        updateData.date = new Date(data.date);
      }

      // If entity type or ID changed, fetch new entity name
      if (data.entityType && data.entityId) {
        updateData.entityName = await this.fetchEntityName(
          data.entityType,
          data.entityId,
        );
      }

      const paymentVoucher = await this.prisma.paymentVoucher.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          branch: true,
        },
      });

      return this.mapToResponse(paymentVoucher);
    } catch (error) {
      throw new NotFoundException('Payment voucher not found');
    }
  }

  async removePaymentVoucher(id: string): Promise<void> {
    try {
      await this.prisma.paymentVoucher.delete({
        where: { id },
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
