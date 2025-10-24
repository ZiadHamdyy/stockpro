import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSupplierRequest } from './dtos/request/create-supplier.request';
import { UpdateSupplierRequest } from './dtos/request/update-supplier.request';
import { SupplierResponse } from './dtos/response/supplier.response';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateSupplierRequest): Promise<SupplierResponse> {
    const code = await this.generateNextCode();

    const supplier = await this.prisma.supplier.create({
      data: {
        ...data,
        code,
        openingBalance: data.openingBalance || 0,
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
    try {
      await this.prisma.supplier.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Supplier not found');
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
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    };
  }
}
