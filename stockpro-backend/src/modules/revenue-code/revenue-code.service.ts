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
    data: CreateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
    const code = await this.generateNextRevenueCode();

    const revenueCode = await this.prisma.revenueCode.create({
      data: {
        ...data,
        code,
      },
    });

    return this.mapRevenueCodeToResponse(revenueCode);
  }

  async findAllRevenueCodes(search?: string): Promise<RevenueCodeResponse[]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const codes = await this.prisma.revenueCode.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return codes.map((code) => this.mapRevenueCodeToResponse(code));
  }

  async findOneRevenueCode(id: string): Promise<RevenueCodeResponse> {
    const revenueCode = await this.prisma.revenueCode.findUnique({
      where: { id },
    });

    if (!revenueCode) {
      throw new NotFoundException('Revenue code not found');
    }

    return this.mapRevenueCodeToResponse(revenueCode);
  }

  async updateRevenueCode(
    id: string,
    data: UpdateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
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

  async removeRevenueCode(id: string): Promise<void> {
    try {
      await this.prisma.revenueCode.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Revenue code not found');
    }
  }

  private async generateNextRevenueCode(
    prisma: DatabaseService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const lastCode = await prisma.revenueCode.findFirst({
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
