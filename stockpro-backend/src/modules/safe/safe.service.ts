import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSafeRequest } from './dtos/request/create-safe.request';
import { UpdateSafeRequest } from './dtos/request/update-safe.request';
import { SafeResponse } from './dtos/response/safe.response';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class SafeService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(companyId: string, data: CreateSafeRequest): Promise<SafeResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'safes');

    const code = await this.generateNextCode(companyId);

    // Enforce one safe per branch (friendly error; DB unique handles races)
    const existingForBranch = await this.prisma.safe.findUnique({
      where: { branchId: data.branchId },
      select: { id: true, companyId: true },
    });
    if (existingForBranch && existingForBranch.companyId === companyId) {
      throw new BadRequestException('هذا الفرع لديه خزنة بالفعل');
    }

    const safe = await this.prisma.safe.create({
      data: {
        ...data,
        companyId,
        code,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.openingBalance || 0,
      },
      include: {
        branch: true,
      },
    });

    return this.mapToResponse(safe);
  }

  async findAll(companyId: string, search?: string): Promise<SafeResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        {
          branch: {
            name: { contains: search, mode: 'insensitive' as const },
          },
        },
      ];
    }

    const safes = await this.prisma.safe.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: { code: 'asc' },
    });

    return safes.map((safe) => this.mapToResponse(safe));
  }

  async findOne(companyId: string, id: string): Promise<SafeResponse> {
    const safe = await this.prisma.safe.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        branch: true,
      },
    });

    if (!safe) {
      throw new NotFoundException('Safe not found');
    }

    return this.mapToResponse(safe);
  }

  async findByCode(companyId: string, code: string): Promise<SafeResponse> {
    const safe = await this.prisma.safe.findUnique({
      where: { code_companyId: { code, companyId } },
      include: {
        branch: true,
      },
    });

    if (!safe) {
      throw new NotFoundException('Safe not found');
    }

    return this.mapToResponse(safe);
  }

  async update(companyId: string, id: string, data: UpdateSafeRequest): Promise<SafeResponse> {
    // Verify the safe belongs to the company
    await this.findOne(companyId, id);

    // If branch is being changed, ensure target branch does not already have a safe
    if (data.branchId) {
      const targetHasSafe = await this.prisma.safe.findUnique({
        where: { branchId: data.branchId },
        select: { id: true, companyId: true },
      });
      if (targetHasSafe && targetHasSafe.id !== id && targetHasSafe.companyId === companyId) {
        throw new BadRequestException('هذا الفرع لديه خزنة بالفعل');
      }
    }

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

  async findAvailableBranches(companyId: string, includeId?: string) {
    const available = await this.prisma.branch.findMany({
      where: { 
        companyId,
        safes: { is: null },
      },
      orderBy: { code: 'asc' },
    });
    if (!includeId) return available;

    const included = await this.prisma.branch.findUnique({
      where: { id: includeId },
    });
    if (!included || included.companyId !== companyId) {
      return available;
    }
    if (!included) return available;

    const exists = available.some((b) => b.id === included.id);
    return exists ? available : [included, ...available];
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the safe belongs to the company
    await this.findOne(companyId, id);

    try {
      await this.prisma.safe.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Safe not found');
    }
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastSafe = await this.prisma.safe.findFirst({
      where: { companyId },
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
      currentBalance: safe.currentBalance ?? safe.openingBalance,
      createdAt: safe.createdAt,
      updatedAt: safe.updatedAt,
    };
  }
}
