import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(companyId: string, createBranchDto: CreateBranchDto) {
    // Determine next sequential code (starting from 1, company-scoped)
    const last = await this.prisma.branch.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    return this.prisma.branch.create({
      data: { ...createBranchDto, companyId, code: nextCode },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(companyId: string, id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(companyId, id);

    return this.prisma.branch.update({
      where: { id },
      data: updateBranchDto,
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
