import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSafeRequest } from './dtos/request/create-safe.request';
import { UpdateSafeRequest } from './dtos/request/update-safe.request';
import { SafeResponse } from './dtos/response/safe.response';

@Injectable()
export class SafeService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateSafeRequest): Promise<SafeResponse> {
    const code = await this.generateNextCode();

    const safe = await this.prisma.safe.create({
      data: {
        ...data,
        code,
        openingBalance: data.openingBalance || 0,
      },
      include: {
        branch: true,
      },
    });

    return this.mapToResponse(safe);
  }

  async findAll(search?: string): Promise<SafeResponse[]> {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            {
              branch: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const safes = await this.prisma.safe.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: { code: 'asc' },
    });

    return safes.map((safe) => this.mapToResponse(safe));
  }

  async findOne(id: string): Promise<SafeResponse> {
    const safe = await this.prisma.safe.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!safe) {
      throw new NotFoundException('Safe not found');
    }

    return this.mapToResponse(safe);
  }

  async findByCode(code: string): Promise<SafeResponse> {
    const safe = await this.prisma.safe.findUnique({
      where: { code },
      include: {
        branch: true,
      },
    });

    if (!safe) {
      throw new NotFoundException('Safe not found');
    }

    return this.mapToResponse(safe);
  }

  async update(id: string, data: UpdateSafeRequest): Promise<SafeResponse> {
    try {
      const safe = await this.prisma.safe.update({
        where: { id },
        data,
        include: {
          branch: true,
        },
      });

      return this.mapToResponse(safe);
    } catch {
      throw new NotFoundException('Safe not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.safe.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Safe not found');
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastSafe = await this.prisma.safe.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastSafe) {
      return 'SF-001';
    }

    const match = lastSafe.code.match(/SF-(\d+)/);
    if (!match) {
      return 'SF-001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `SF-${String(nextNumber).padStart(3, '0')}`;
  }

  private mapToResponse(safe: any): SafeResponse {
    return {
      id: safe.id,
      code: safe.code,
      name: safe.name,
      branchId: safe.branchId,
      branchName: safe.branch.name,
      openingBalance: safe.openingBalance,
      createdAt: safe.createdAt,
      updatedAt: safe.updatedAt,
    };
  }
}
