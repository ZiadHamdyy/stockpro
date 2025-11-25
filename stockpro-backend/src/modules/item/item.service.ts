import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import type { currentUserType } from '../../common/types/current-user.type';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
  ) {}

  async create(
    data: CreateItemRequest,
    currentUser: currentUserType,
  ): Promise<ItemResponse> {
    // Generate next code automatically
    const nextCode = await this.generateNextCode();

    // Get user's store from their branch
    const store = await this.storeService.findByBranchId(currentUser.branchId);

    const openingStock = data.type === 'SERVICE' ? 0 : data.stock || 0;

    const payload: any = {
      ...data,
      code: nextCode, // Use auto-generated code
      salePrice: (data as any).salePrice ?? 0,
      stock: 0, // Set global stock to 0, use StoreItem for store-specific stock
      reorderLimit: data.reorderLimit || 0,
      type: (data as any).type ?? 'STOCKED',
    };

    // Create item and StoreItem in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: payload,
        include: {
          group: true,
          unit: true,
        },
      });

      // Create StoreItem entry for the user's store with opening stock
      await tx.storeItem.create({
        data: {
          storeId: store.id,
          itemId: item.id,
          openingBalance: openingStock,
        },
      });

      return item;
    });

    return this.mapToResponse(result);
  }

  async findAll(storeId?: string, priceDate?: string): Promise<ItemResponse[]> {
    const items = await this.prisma.item.findMany({
      include: {
        group: true,
        unit: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let lastPurchasePriceMap: Map<string, number> | null = null;
    if (priceDate) {
      const referenceDate = new Date(priceDate);
      if (!Number.isNaN(referenceDate.getTime())) {
        referenceDate.setHours(23, 59, 59, 999);
        lastPurchasePriceMap = await this.buildLastPurchasePriceMap(
          referenceDate,
        );
      }
    }

    // If storeId provided, calculate store-specific balances and include openingBalance
    if (storeId) {
      const itemsWithBalances = await Promise.all(
        items.map(async (item) => {
          const balance = await this.stockService.getStoreItemBalance(
            storeId,
            item.id,
          );
          const openingBalance =
            await this.stockService.getStoreItemOpeningBalance(
              storeId,
              item.id,
            );
          return this.mapToResponse({
            ...item,
            stock: balance,
            openingBalance,
            lastPurchasePrice:
              lastPurchasePriceMap?.get(item.code) ?? undefined,
          });
        }),
      );
      return itemsWithBalances;
    }

    // If no storeId, return with global stock (0 for new items)
    return items.map((item) =>
      this.mapToResponse({
        ...item,
        lastPurchasePrice: lastPurchasePriceMap?.get(item.code),
      }),
    );
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
    const coerced: any =
      data?.type === 'SERVICE' ? { ...data, stock: 0 } : data;
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
        const {
          GenericHttpException,
        } = require('../../common/application/exceptions/generic-http-exception');
        const { HttpStatus } = require('@nestjs/common');
        throw new GenericHttpException(
          'Cannot delete item because it has related transactions',
          HttpStatus.CONFLICT,
        );
      }
      // Prisma: record not found
      if (error?.code === 'P2025') {
        const {
          GenericHttpException,
        } = require('../../common/application/exceptions/generic-http-exception');
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

  private async buildLastPurchasePriceMap(
    referenceDate: Date,
  ): Promise<Map<string, number>> {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: {
        date: {
          lte: referenceDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        items: true,
      },
    });

    const priceMap = new Map<string, number>();

    for (const invoice of invoices) {
      const invItems = (invoice.items as any[]) || [];
      for (const invItem of invItems) {
        const itemCode = invItem?.id || invItem?.code;
        if (!itemCode) continue;
        if (priceMap.has(itemCode)) continue;
        if (typeof invItem?.price === 'number') {
          priceMap.set(itemCode, invItem.price);
        }
      }
    }

    return priceMap;
  }

  private mapToResponse(item: any): ItemResponse {
    return {
      id: item.id,
      code: item.code,
      barcode: item.barcode,
      name: item.name,
      purchasePrice: item.purchasePrice,
      lastPurchasePrice:
        typeof item.lastPurchasePrice === 'number'
          ? item.lastPurchasePrice
          : undefined,
      salePrice: item.salePrice,
      stock: item.stock,
      openingBalance: item.openingBalance,
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
