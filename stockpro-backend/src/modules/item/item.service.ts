import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(data: CreateItemRequest): Promise<ItemResponse> {
    // Generate next code automatically
    const nextCode = await this.generateNextCode();

    const item = await this.prisma.item.create({
      data: {
        ...data,
        code: nextCode, // Use auto-generated code
        stock: data.stock || 0,
        reorderLimit: data.reorderLimit || 0,
      },
      include: {
        group: true,
        unit: true,
      },
    });

    return this.mapToResponse(item);
  }

  async findAll(): Promise<ItemResponse[]> {
    const items = await this.prisma.item.findMany({
      include: {
        group: true,
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.mapToResponse(item));
  }

  async findOne(id: string): Promise<ItemResponse> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        group: true,
        unit: true,
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return this.mapToResponse(item);
  }

  async findByCode(code: string): Promise<ItemResponse> {
    const item = await this.prisma.item.findUnique({
      where: { code },
      include: {
        group: true,
        unit: true,
      },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    return this.mapToResponse(item);
  }

  async update(id: string, data: UpdateItemRequest): Promise<ItemResponse> {
    const item = await this.prisma.item.update({
      where: { id },
      data,
      include: {
        group: true,
        unit: true,
      },
    });

    return this.mapToResponse(item);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id },
    });
  }

  private async generateNextCode(): Promise<string> {
    // Always start from 001 and find the next available code
    return await this.findNextAvailableCode(1);
  }

  private async findNextAvailableCode(startFrom: number): Promise<string> {
    let code = startFrom;
    while (true) {
      const paddedCode = code.toString().padStart(3, '0');
      const existingItem = await this.prisma.item.findUnique({
        where: { code: paddedCode },
        select: { id: true },
      });

      if (!existingItem) {
        return paddedCode;
      }
      code++;
    }
  }

  private mapToResponse(item: any): ItemResponse {
    return {
      id: item.id,
      code: item.code,
      barcode: item.barcode,
      name: item.name,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      stock: item.stock,
      reorderLimit: item.reorderLimit,
      group: {
        id: item.group.id,
        code: item.group.code,
        name: item.group.name,
        description: item.group.description,
        createdAt: item.group.createdAt,
        updatedAt: item.group.updatedAt,
      },
      unit: {
        id: item.unit.id,
        code: item.unit.code,
        name: item.unit.name,
        description: item.unit.description,
        createdAt: item.unit.createdAt,
        updatedAt: item.unit.updatedAt,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
