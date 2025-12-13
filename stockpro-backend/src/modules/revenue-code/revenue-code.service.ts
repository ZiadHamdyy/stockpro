import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateRevenueCodeRequest } from './dtos/request/create-revenue-code.request';
import { UpdateRevenueCodeRequest } from './dtos/request/update-revenue-code.request';
import { RevenueCodeResponse } from './dtos/response/revenue-code.response';

@Injectable()
export class RevenueCodeService {
  constructor(private readonly prisma: DatabaseService) {}

  async createRevenueCode(
    companyId: string,
    data: CreateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
    const code = await this.generateNextRevenueCode(companyId);

    const revenueCode = await this.prisma.revenueCode.create({
      data: {
        ...data,
        companyId,
        code,
      },
    });

    return this.mapRevenueCodeToResponse(revenueCode);
  }

  async findAllRevenueCodes(companyId: string, search?: string): Promise<RevenueCodeResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const codes = await this.prisma.revenueCode.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return codes.map((code) => this.mapRevenueCodeToResponse(code));
  }

  async findOneRevenueCode(companyId: string, id: string): Promise<RevenueCodeResponse> {
    const revenueCode = await this.prisma.revenueCode.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!revenueCode) {
      throw new NotFoundException('Revenue code not found');
    }

    return this.mapRevenueCodeToResponse(revenueCode);
  }

  async updateRevenueCode(
    companyId: string,
    id: string,
    data: UpdateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
    // Verify the revenue code belongs to the company
    await this.findOneRevenueCode(companyId, id);
    
    try {
      const revenueCode = await this.prisma.revenueCode.update({
        where: { id },
        data,
      });

      return this.mapRevenueCodeToResponse(revenueCode);
    } catch (error) {
      throw new NotFoundException('Revenue code not found');
    }
  }

  async removeRevenueCode(companyId: string, id: string): Promise<void> {
    // Verify the revenue code belongs to the company
    await this.findOneRevenueCode(companyId, id);
    
    try {
      await this.prisma.revenueCode.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Revenue code not found');
    }
  }

  private async generateNextRevenueCode(
    companyId: string,
    prisma: DatabaseService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const lastCode = await prisma.revenueCode.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastCode) {
      return 'REV-001';
    }

    const match = lastCode.code.match(/REV-(\d+)/);
    if (!match) {
      return 'REV-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `REV-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapRevenueCodeToResponse(revenueCode: any): RevenueCodeResponse {
    return {
      id: revenueCode.id,
      code: revenueCode.code,
      name: revenueCode.name,
      createdAt: revenueCode.createdAt,
      updatedAt: revenueCode.updatedAt,
    };
  }
}
