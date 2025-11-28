import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import type { currentUserType } from '../../common/types/current-user.type';
import { GenericHttpException } from '../../common/application/exceptions/generic-http-exception';

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
      initialPurchasePrice: data.purchasePrice ?? 0,
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

  async findAll(
    storeId?: string,
    _priceDate?: string,
  ): Promise<ItemResponse[]> {
    const items = await this.prisma.item.findMany({
      include: {
        group: true,
        unit: true,
      },
      orderBy: { createdAt: 'asc' },
    });

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
          });
        }),
      );
      return itemsWithBalances;
    }

    // If no storeId, return with global stock (0 for new items)
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
    // First, retrieve the item to get its code (items are referenced by code in JSON fields)
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: { id: true, code: true },
    });

    if (!item) {
      throw new GenericHttpException('Item not found', HttpStatus.NOT_FOUND);
    }

    // Check for related data before attempting deletion
    const relatedDataTypes: string[] = [];

    // Check direct foreign key relationships
    const [
      inventoryCountItemsCount,
      storeIssueVoucherItemsCount,
      storeReceiptVoucherItemsCount,
      storeTransferVoucherItemsCount,
    ] = await Promise.all([
      this.prisma.inventoryCountItem.count({
        where: { itemId: id },
      }),
      this.prisma.storeIssueVoucherItem.count({
        where: { itemId: id },
      }),
      this.prisma.storeReceiptVoucherItem.count({
        where: { itemId: id },
      }),
      this.prisma.storeTransferVoucherItem.count({
        where: { itemId: id },
      }),
    ]);

    if (inventoryCountItemsCount > 0) {
      relatedDataTypes.push('inventory counts');
    }
    if (storeIssueVoucherItemsCount > 0) {
      relatedDataTypes.push('store issue vouchers');
    }
    if (storeReceiptVoucherItemsCount > 0) {
      relatedDataTypes.push('store receipt vouchers');
    }
    if (storeTransferVoucherItemsCount > 0) {
      relatedDataTypes.push('store transfer vouchers');
    }

    // Check JSON-based relationships (items are stored with id field matching item code)
    const [
      salesInvoices,
      salesReturns,
      purchaseInvoices,
      purchaseReturns,
      priceQuotations,
    ] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        select: { id: true, items: true },
      }),
      this.prisma.salesReturn.findMany({
        select: { id: true, items: true },
      }),
      this.prisma.purchaseInvoice.findMany({
        select: { id: true, items: true },
      }),
      this.prisma.purchaseReturn.findMany({
        select: { id: true, items: true },
      }),
      this.prisma.priceQuotation.findMany({
        select: { id: true, items: true },
      }),
    ]);

    // Check if item code appears in any JSON items array
    const itemCode = item.code;
    const hasSalesInvoiceReference = salesInvoices.some((invoice) => {
      const items = invoice.items as any[];
      return Array.isArray(items) && items.some((item) => item.id === itemCode);
    });

    const hasSalesReturnReference = salesReturns.some((returnRecord) => {
      const items = returnRecord.items as any[];
      return Array.isArray(items) && items.some((item) => item.id === itemCode);
    });

    const hasPurchaseInvoiceReference = purchaseInvoices.some((invoice) => {
      const items = invoice.items as any[];
      return Array.isArray(items) && items.some((item) => item.id === itemCode);
    });

    const hasPurchaseReturnReference = purchaseReturns.some((returnRecord) => {
      const items = returnRecord.items as any[];
      return Array.isArray(items) && items.some((item) => item.id === itemCode);
    });

    const hasPriceQuotationReference = priceQuotations.some((quotation) => {
      const items = quotation.items as any[];
      return Array.isArray(items) && items.some((item) => item.id === itemCode);
    });

    if (hasSalesInvoiceReference) {
      relatedDataTypes.push('sales invoices');
    }
    if (hasSalesReturnReference) {
      relatedDataTypes.push('sales returns');
    }
    if (hasPurchaseInvoiceReference) {
      relatedDataTypes.push('purchase invoices');
    }
    if (hasPurchaseReturnReference) {
      relatedDataTypes.push('purchase returns');
    }
    if (hasPriceQuotationReference) {
      relatedDataTypes.push('price quotations');
    }

    // If any related data exists, throw an error
    if (relatedDataTypes.length > 0) {
      const relatedDataList = relatedDataTypes.join(', ');
      throw new GenericHttpException(
        `Cannot delete item because it has related data: ${relatedDataList}`,
        HttpStatus.CONFLICT,
      );
    }

    // If no related data exists, proceed with deletion
    try {
      await this.prisma.item.delete({
        where: { id },
      });
    } catch (error: any) {
      // Prisma: record not found (shouldn't happen since we checked above, but handle it anyway)
      if (error?.code === 'P2025') {
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
      initialPurchasePrice: item.initialPurchasePrice,
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
