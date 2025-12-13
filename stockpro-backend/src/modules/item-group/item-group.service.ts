import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateItemGroupRequest } from './dtos/request/create-item-group.request';
import { UpdateItemGroupRequest } from './dtos/request/update-item-group.request';
import { ItemGroupResponse } from './dtos/response/item-group.response';

@Injectable()
export class ItemGroupService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    companyId: string,
    data: CreateItemGroupRequest,
  ): Promise<ItemGroupResponse> {
    // Generate next code for this company
    const last = await this.prisma.itemGroup.findFirst({
      where: { companyId },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = (last?.code ?? 0) + 1;

    const itemGroup = await this.prisma.itemGroup.create({
      data: { ...data, companyId, code: nextCode },
    });

    return this.mapToResponse(itemGroup);
  }

  async findAll(companyId: string): Promise<ItemGroupResponse[]> {
    const itemGroups = await this.prisma.itemGroup.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    return itemGroups.map((itemGroup) => this.mapToResponse(itemGroup));
  }

  async findOne(companyId: string, id: string): Promise<ItemGroupResponse> {
    const itemGroup = await this.prisma.itemGroup.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!itemGroup) {
      throw new NotFoundException('Item group not found');
    }

    return this.mapToResponse(itemGroup);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdateItemGroupRequest,
  ): Promise<ItemGroupResponse> {
    // Verify the item group belongs to the company
    await this.findOne(companyId, id);

    const itemGroup = await this.prisma.itemGroup.update({
      where: { id },
      data,
    });

    return this.mapToResponse(itemGroup);
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the item group belongs to the company
    await this.findOne(companyId, id);

    await this.prisma.itemGroup.delete({
      where: { id },
    });
  }

  private mapToResponse(itemGroup: any): ItemGroupResponse {
    return {
      id: itemGroup.id,
      code: itemGroup.code,
      name: itemGroup.name,
      description: itemGroup.description,
      createdAt: itemGroup.createdAt,
      updatedAt: itemGroup.updatedAt,
    };
  }
}
