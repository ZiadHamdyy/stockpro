import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(companyId: string, createStoreDto: CreateStoreDto) {
    // Enforce one store per branch (friendly error; DB unique handles races)
    const existingForBranch = await this.prisma.store.findUnique({
      where: { branchId: createStoreDto.branchId },
      select: { id: true, companyId: true },
    });
    if (existingForBranch && existingForBranch.companyId === companyId) {
      throw new BadRequestException('هذا الفرع لديه مخزن بالفعل');
    }

    const last = await this.prisma.store.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    return this.prisma.store.create({
      data: { ...createStoreDto, companyId, code: nextCode },
      include: {
        branch: true,
        user: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.store.findMany({
      where: { companyId },
      include: {
        branch: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        branch: true,
        user: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async update(companyId: string, id: string, updateStoreDto: UpdateStoreDto) {
    await this.findOne(companyId, id);

    // If branch is being changed, ensure target branch does not already have a store
    if (updateStoreDto.branchId) {
      const targetHasStore = await this.prisma.store.findUnique({
        where: { branchId: updateStoreDto.branchId },
        select: { id: true, companyId: true },
      });
      if (targetHasStore && targetHasStore.id !== id && targetHasStore.companyId === companyId) {
        throw new BadRequestException('هذا الفرع لديه مخزن بالفعل');
      }
    }

    return this.prisma.store.update({
      where: { id },
      data: updateStoreDto,
      include: {
        branch: true,
        user: true,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.store.delete({
      where: { id },
    });
  }

  async findByBranchId(companyId: string, branchId: string) {
    const store = await this.prisma.store.findUnique({
      where: { branchId },
      include: {
        branch: true,
        user: true,
      },
    });

    if (!store || store.companyId !== companyId) {
      throw new NotFoundException(
        `Store not found for branch with id: ${branchId}`,
      );
    }

    return store;
  }

  async findAllStoreItems(companyId: string) {
    return this.prisma.storeItem.findMany({
      where: {
        store: {
          companyId,
        },
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
          },
        },
        store: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
