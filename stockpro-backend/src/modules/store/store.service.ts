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

  async create(createStoreDto: CreateStoreDto) {
    // Enforce one store per branch (friendly error; DB unique handles races)
    const existingForBranch = await this.prisma.store.findFirst({
      where: { branchId: createStoreDto.branchId },
      select: { id: true },
    });
    if (existingForBranch) {
      throw new BadRequestException('هذا الفرع لديه مخزن بالفعل');
    }

    const last = await this.prisma.store.findFirst({
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    return this.prisma.store.create({
      data: { ...createStoreDto, code: nextCode },
      include: {
        branch: true,
        user: true,
      },
    });
  }

  async findAll() {
    return this.prisma.store.findMany({
      include: {
        branch: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
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

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    await this.findOne(id);

    // If branch is being changed, ensure target branch does not already have a store
    if (updateStoreDto.branchId) {
      const targetHasStore = await this.prisma.store.findFirst({
        where: { branchId: updateStoreDto.branchId, NOT: { id } },
        select: { id: true },
      });
      if (targetHasStore) {
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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.store.delete({
      where: { id },
    });
  }

  async findByBranchId(branchId: string) {
    const store = await this.prisma.store.findFirst({
      where: { branchId },
      include: {
        branch: true,
        user: true,
      },
    });

    if (!store) {
      throw new NotFoundException(
        `Store not found for branch with id: ${branchId}`,
      );
    }

    return store;
  }

  async findAllStoreItems() {
    return this.prisma.storeItem.findMany({
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
