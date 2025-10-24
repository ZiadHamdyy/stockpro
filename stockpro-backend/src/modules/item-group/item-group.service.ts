import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateItemGroupRequest } from './dtos/request/create-item-group.request';
import { UpdateItemGroupRequest } from './dtos/request/update-item-group.request';
import { ItemGroupResponse } from './dtos/response/item-group.response';

@Injectable()
export class ItemGroupService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateItemGroupRequest): Promise<ItemGroupResponse> {
    const itemGroup = await this.prisma.itemGroup.create({
      data,
    });

    return this.mapToResponse(itemGroup);
  }

  async findAll(): Promise<ItemGroupResponse[]> {
    const itemGroups = await this.prisma.itemGroup.findMany({
      orderBy: { name: 'asc' },
    });

    return itemGroups.map(itemGroup => this.mapToResponse(itemGroup));
  }

  async findOne(id: string): Promise<ItemGroupResponse> {
    const itemGroup = await this.prisma.itemGroup.findUnique({
      where: { id },
    });

    if (!itemGroup) {
      throw new Error('Item group not found');
    }

    return this.mapToResponse(itemGroup);
  }

  async update(id: string, data: UpdateItemGroupRequest): Promise<ItemGroupResponse> {
    const itemGroup = await this.prisma.itemGroup.update({
      where: { id },
      data,
    });

    return this.mapToResponse(itemGroup);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.itemGroup.delete({
      where: { id },
    });
  }

  private mapToResponse(itemGroup: any): ItemGroupResponse {
    return {
      id: itemGroup.id,
      name: itemGroup.name,
      description: itemGroup.description,
      createdAt: itemGroup.createdAt,
      updatedAt: itemGroup.updatedAt,
    };
  }
}
