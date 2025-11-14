import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSupplierRequest } from './dtos/request/create-supplier.request';
import { UpdateSupplierRequest } from './dtos/request/update-supplier.request';
import { SupplierResponse } from './dtos/response/supplier.response';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateSupplierRequest): Promise<SupplierResponse> {
    const code = await this.generateNextCode();
    const openingBalance = data.openingBalance || 0;

    const supplier = await this.prisma.supplier.create({
      data: {
        ...data,
        code,
        openingBalance,
        currentBalance: openingBalance, // Initialize currentBalance from openingBalance
      },
    });

    return this.mapToResponse(supplier);
  }

  async findAll(search?: string): Promise<SupplierResponse[]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { taxNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return suppliers.map((supplier) => this.mapToResponse(supplier));
  }

  async findOne(id: string): Promise<SupplierResponse> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.mapToResponse(supplier);
  }

  async findByCode(code: string): Promise<SupplierResponse> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { code },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.mapToResponse(supplier);
  }

  async update(
    id: string,
    data: UpdateSupplierRequest,
  ): Promise<SupplierResponse> {
    try {
      // If openingBalance is being updated, adjust currentBalance accordingly
      if (data.openingBalance !== undefined) {
        const existingSupplier = await this.prisma.supplier.findUnique({
          where: { id },
        });
        
        if (existingSupplier) {
          const openingBalanceDiff = data.openingBalance - existingSupplier.openingBalance;
          const supplier = await this.prisma.supplier.update({
            where: { id },
            data: {
              ...data,
              currentBalance: {
                increment: openingBalanceDiff, // Adjust currentBalance by the difference
              },
            },
          });

          return this.mapToResponse(supplier);
        }
      }

      const supplier = await this.prisma.supplier.update({
        where: { id },
        data,
      });

      return this.mapToResponse(supplier);
    } catch (error) {
      throw new NotFoundException('Supplier not found');
    }
  }

  async remove(id: string): Promise<void> {
    // Prevent deletion if there are related transactions
    const [purchaseInvoicesCount, purchaseReturnsCount, paymentVouchersCount, receiptVouchersCount] =
      await Promise.all([
        this.prisma.purchaseInvoice.count({ where: { supplierId: id } }),
        this.prisma.purchaseReturn.count({ where: { supplierId: id } }),
        this.prisma.paymentVoucher.count({ where: { supplierId: id } }),
        this.prisma.receiptVoucher.count({ where: { supplierId: id } }),
      ]);

    if (
      purchaseInvoicesCount +
        purchaseReturnsCount +
        paymentVouchersCount +
        receiptVouchersCount >
      0
    ) {
      throw new ConflictException('لا يمكن الحذف لوجود بيانات مرتبطة.');
    }

    try {
      await this.prisma.supplier.delete({ where: { id } });
    } catch (error: any) {
      // Prisma: record not found
      if (error?.code === 'P2025') {
        throw new NotFoundException('Supplier not found');
      }
      // Prisma: foreign key constraint failed (fallback)
      if (error?.code === 'P2003') {
        throw new ConflictException('لا يمكن الحذف لوجود بيانات مرتبطة.');
      }
      throw error;
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastSupplier = await this.prisma.supplier.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastSupplier) {
      return 'SUP-001';
    }

    const match = lastSupplier.code.match(/SUP-(\d+)/);
    if (!match) {
      return 'SUP-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `SUP-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapToResponse(supplier: any): SupplierResponse {
    return {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      commercialReg: supplier.commercialReg,
      taxNumber: supplier.taxNumber,
      nationalAddress: supplier.nationalAddress,
      phone: supplier.phone,
      openingBalance: supplier.openingBalance,
      currentBalance: supplier.currentBalance,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
