import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSupplierRequest } from './dtos/request/create-supplier.request';
import { UpdateSupplierRequest } from './dtos/request/update-supplier.request';
import { SupplierResponse } from './dtos/response/supplier.response';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(companyId: string, data: CreateSupplierRequest): Promise<SupplierResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'suppliers');

    // Check financial period status (use current date for suppliers without date field)
    const supplierDate = new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, supplierDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إضافة مورد: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, supplierDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إضافة مورد: الفترة المحاسبية مغلقة');
    }

    const code = await this.generateNextCode(companyId);
    const openingBalance = data.openingBalance || 0;

    const supplier = await this.prisma.supplier.create({
      data: {
        ...data,
        companyId,
        code,
        openingBalance,
        currentBalance: openingBalance, // Initialize currentBalance from openingBalance
      },
    });

    return this.mapToResponse(supplier);
  }

  async findAll(companyId: string, search?: string): Promise<SupplierResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { taxNumber: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const suppliers = await this.prisma.supplier.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return suppliers.map((supplier) => this.mapToResponse(supplier));
  }

  async findOne(companyId: string, id: string): Promise<SupplierResponse> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.mapToResponse(supplier);
  }

  async findByCode(companyId: string, code: string): Promise<SupplierResponse> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { code_companyId: { code, companyId } },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.mapToResponse(supplier);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdateSupplierRequest,
  ): Promise<SupplierResponse> {
    // Verify the supplier belongs to the company
    await this.findOne(companyId, id);

    try {
      // If openingBalance is being updated, adjust currentBalance accordingly
      if (data.openingBalance !== undefined) {
        const existingSupplier = await this.prisma.supplier.findFirst({
          where: { id, companyId },
        });

        if (existingSupplier) {
          const openingBalanceDiff =
            data.openingBalance - existingSupplier.openingBalance;
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

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the supplier belongs to the company
    await this.findOne(companyId, id);

    // Prevent deletion if there are related transactions
    const [
      purchaseInvoicesCount,
      purchaseReturnsCount,
      paymentVouchersCount,
      receiptVouchersCount,
    ] = await Promise.all([
      this.prisma.purchaseInvoice.count({ where: { supplierId: id, companyId } }),
      this.prisma.purchaseReturn.count({ where: { supplierId: id, companyId } }),
      this.prisma.paymentVoucher.count({ where: { supplierId: id, companyId } }),
      this.prisma.receiptVoucher.count({ where: { supplierId: id, companyId } }),
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

  private async generateNextCode(companyId: string): Promise<string> {
    const lastSupplier = await this.prisma.supplier.findFirst({
      where: { companyId },
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
