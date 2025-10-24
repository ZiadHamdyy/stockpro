import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createStoreDto: CreateStoreDto) {
    return this.prisma.store.create({
      data: createStoreDto,
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
        createdAt: 'desc',
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
}

