import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createBranchDto: CreateBranchDto) {
    // Determine next sequential code (starting from 1)
    const last = await this.prisma.branch.findFirst({
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    return this.prisma.branch.create({
      data: { ...createBranchDto, code: nextCode },
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.branch.findMany({
      include: {
        stores: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
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

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id);

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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.branch.delete({
      where: { id },
    });
  }
}
