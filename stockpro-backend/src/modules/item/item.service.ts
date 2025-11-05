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

    const payload: any = {
      ...data,
      code: nextCode, // Use auto-generated code
      salePrice: (data as any).salePrice ?? 0,
      stock: data.type === 'SERVICE' ? 0 : (data.stock || 0),
      reorderLimit: data.reorderLimit || 0,
      type: (data as any).type ?? 'STOCKED',
    };

    const item = await this.prisma.item.create({
      data: payload,
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
      orderBy: { createdAt: 'asc' },
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
    const coerced: any = data?.type === 'SERVICE' ? { ...data, stock: 0 } : data;
    const item = await this.prisma.item.update({
      where: { id },
      data: coerced,
      include: {
        group: true,
        unit: true,
      },
    });

    return this.mapToResponse(item);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.item.delete({
        where: { id },
      });
    } catch (error: any) {
      // Prisma: foreign key constraint failed
      if (error?.code === 'P2003') {
        const { GenericHttpException } = require('../../common/application/exceptions/generic-http-exception');
        const { HttpStatus } = require('@nestjs/common');
        throw new GenericHttpException(
          'Cannot delete item because it has related transactions',
          HttpStatus.CONFLICT,
        );
      }
      // Prisma: record not found
      if (error?.code === 'P2025') {
        const { GenericHttpException } = require('../../common/application/exceptions/generic-http-exception');
        const { HttpStatus } = require('@nestjs/common');
        throw new GenericHttpException('Item not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
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
      type: item.type,
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
