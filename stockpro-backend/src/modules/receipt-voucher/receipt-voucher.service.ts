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

    const receiptVoucher = await this.prisma.receiptVoucher.create({
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
      include: {
        user: true,
        branch: true,
      },
    });

    return this.mapToResponse(receiptVoucher);
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

      const receiptVoucher = await this.prisma.receiptVoucher.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          branch: true,
        },
      });

      return this.mapToResponse(receiptVoucher);
    } catch (error) {
      throw new NotFoundException('Receipt voucher not found');
    }
  }

  async removeReceiptVoucher(id: string): Promise<void> {
    try {
      await this.prisma.receiptVoucher.delete({
        where: { id },
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
