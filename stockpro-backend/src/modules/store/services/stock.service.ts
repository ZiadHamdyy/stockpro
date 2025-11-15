import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../../configs/database/database.service';

@Injectable()
export class StockService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Get StoreItem's openingBalance for an item in a store
   */
  async getStoreItemOpeningBalance(
    storeId: string,
    itemId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    const storeItem = await client.storeItem.findUnique({
      where: {
        storeId_itemId: {
          storeId,
          itemId,
        },
      },
      select: {
        openingBalance: true,
      },
    });

    return storeItem?.openingBalance || 0;
  }

  /**
   * Calculate current stock balance for an item in a store
   * Stock = Opening Balance + Receipts (+) - Issues (-) - Transfers Out (-) + Transfers In (+)
   * + PurchaseInvoice items (+) + SalesReturn items (+) - SalesInvoice items (-) - PurchaseReturn items (-)
   */
  async getStoreItemBalance(
    storeId: string,
    itemId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    // Get opening balance from StoreItem
    const openingBalance = await this.getStoreItemOpeningBalance(storeId, itemId, tx);

    // Get store's branchId
    const store = await client.store.findUnique({
      where: { id: storeId },
      select: { branchId: true },
    });

    if (!store) {
      throw new BadRequestException(`Store with id ${storeId} not found`);
    }

    // Get item code for matching invoice items
    const item = await client.item.findUnique({
      where: { id: itemId },
      select: { code: true },
    });

    if (!item) {
      throw new BadRequestException(`Item with id ${itemId} not found`);
    }

    // Sum of all receipts for this item in this store (manual warehouse receipts)
    const receipts = await client.storeReceiptVoucherItem.aggregate({
      where: {
        itemId,
        voucher: {
          storeId,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Sum of all issues for this item in this store (manual warehouse issues)
    const issues = await client.storeIssueVoucherItem.aggregate({
      where: {
        itemId,
        voucher: {
          storeId,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Sum of all transfers OUT (from this store)
    const transfersOut = await client.storeTransferVoucherItem.aggregate({
      where: {
        itemId,
        voucher: {
          fromStoreId: storeId,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Sum of all transfers IN (to this store)
    const transfersIn = await client.storeTransferVoucherItem.aggregate({
      where: {
        itemId,
        voucher: {
          toStoreId: storeId,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    // Sum quantities from PurchaseInvoice items (adds to stock)
    const purchaseInvoices = await client.purchaseInvoice.findMany({
      where: {
        branchId: store.branchId,
      },
      select: {
        items: true,
      },
    });

    let purchaseInvoiceQty = 0;
    for (const invoice of purchaseInvoices) {
      const items = invoice.items as any[];
      for (const invItem of items) {
        if (invItem.id === item.code) {
          purchaseInvoiceQty += invItem.qty || 0;
        }
      }
    }

    // Sum quantities from SalesReturn items (adds to stock)
    const salesReturns = await client.salesReturn.findMany({
      where: {
        branchId: store.branchId,
      },
      select: {
        items: true,
      },
    });

    let salesReturnQty = 0;
    for (const ret of salesReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === item.code) {
          salesReturnQty += retItem.qty || 0;
        }
      }
    }

    // Sum quantities from SalesInvoice items (subtracts from stock)
    const salesInvoices = await client.salesInvoice.findMany({
      where: {
        branchId: store.branchId,
      },
      select: {
        items: true,
      },
    });

    let salesInvoiceQty = 0;
    for (const invoice of salesInvoices) {
      const items = invoice.items as any[];
      for (const invItem of items) {
        if (invItem.id === item.code) {
          salesInvoiceQty += invItem.qty || 0;
        }
      }
    }

    // Sum quantities from PurchaseReturn items (subtracts from stock)
    const purchaseReturns = await client.purchaseReturn.findMany({
      where: {
        branchId: store.branchId,
      },
      select: {
        items: true,
      },
    });

    let purchaseReturnQty = 0;
    for (const ret of purchaseReturns) {
      const items = ret.items as any[];
      for (const retItem of items) {
        if (retItem.id === item.code) {
          purchaseReturnQty += retItem.qty || 0;
        }
      }
    }

    const balance =
      openingBalance +
      (receipts._sum.quantity || 0) +
      purchaseInvoiceQty +
      salesReturnQty -
      (issues._sum.quantity || 0) -
      salesInvoiceQty -
      purchaseReturnQty -
      (transfersOut._sum.quantity || 0) +
      (transfersIn._sum.quantity || 0);

    return balance;
  }

  /**
   * Check if item exists in store (has StoreItem entry or any movement history)
   */
  async itemExistsInStore(
    storeId: string,
    itemId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx || this.prisma;

    // Check if StoreItem entry exists
    const storeItem = await client.storeItem.findUnique({
      where: {
        storeId_itemId: {
          storeId,
          itemId,
        },
      },
    });

    if (storeItem) return true;

    // Get store's branchId and item code
    const store = await client.store.findUnique({
      where: { id: storeId },
      select: { branchId: true },
    });

    if (!store) return false;

    const item = await client.item.findUnique({
      where: { id: itemId },
      select: { code: true },
    });

    if (!item) return false;

    // Check if item has any receipt, issue, or transfer records in this store
    const hasReceipt = await client.storeReceiptVoucherItem.findFirst({
      where: {
        itemId,
        voucher: {
          storeId,
        },
      },
    });

    if (hasReceipt) return true;

    const hasIssue = await client.storeIssueVoucherItem.findFirst({
      where: {
        itemId,
        voucher: {
          storeId,
        },
      },
    });

    if (hasIssue) return true;

    const hasTransferOut = await client.storeTransferVoucherItem.findFirst({
      where: {
        itemId,
        voucher: {
          fromStoreId: storeId,
        },
      },
    });

    if (hasTransferOut) return true;

    const hasTransferIn = await client.storeTransferVoucherItem.findFirst({
      where: {
        itemId,
        voucher: {
          toStoreId: storeId,
        },
      },
    });

    if (hasTransferIn) return true;

    // Check if item exists in any invoices for this branch
    const hasPurchaseInvoice = await client.purchaseInvoice.findFirst({
      where: {
        branchId: store.branchId,
      },
      select: { items: true },
    });

    if (hasPurchaseInvoice) {
      const items = hasPurchaseInvoice.items as any[];
      if (items.some((invItem) => invItem.id === item.code)) {
        return true;
      }
    }

    const hasSalesInvoice = await client.salesInvoice.findFirst({
      where: {
        branchId: store.branchId,
      },
      select: { items: true },
    });

    if (hasSalesInvoice) {
      const items = hasSalesInvoice.items as any[];
      if (items.some((invItem) => invItem.id === item.code)) {
        return true;
      }
    }

    const hasSalesReturn = await client.salesReturn.findFirst({
      where: {
        branchId: store.branchId,
      },
      select: { items: true },
    });

    if (hasSalesReturn) {
      const items = hasSalesReturn.items as any[];
      if (items.some((retItem) => retItem.id === item.code)) {
        return true;
      }
    }

    const hasPurchaseReturn = await client.purchaseReturn.findFirst({
      where: {
        branchId: store.branchId,
      },
      select: { items: true },
    });

    if (hasPurchaseReturn) {
      const items = hasPurchaseReturn.items as any[];
      if (items.some((retItem) => retItem.id === item.code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate and decrease stock for issue operations
   * Throws if item doesn't exist or insufficient stock
   */
  async validateAndDecreaseStock(
    storeId: string,
    itemId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Check if item exists in store
    const exists = await this.itemExistsInStore(storeId, itemId, tx);
    if (!exists) {
      throw new BadRequestException(
        `Item does not exist in the store. Cannot issue items that have never been received or transferred into this store.`,
      );
    }

    // Get current balance
    const balance = await this.getStoreItemBalance(storeId, itemId, tx);

    // Validate sufficient stock
    if (balance < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${balance}, Requested: ${quantity}`,
      );
    }
  }

  /**
   * Validate stock for transfer from store
   * Throws if item doesn't exist or insufficient stock
   */
  async validateTransferFrom(
    storeId: string,
    itemId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Same validation as issue
    await this.validateAndDecreaseStock(storeId, itemId, quantity, tx);
  }

  /**
   * Get balance info for frontend (includes existence check)
   */
  async getStoreItemBalanceInfo(
    storeId: string,
    itemId: string,
  ): Promise<{ existsInStore: boolean; availableQty: number }> {
    const exists = await this.itemExistsInStore(storeId, itemId);
    const balance = await this.getStoreItemBalance(storeId, itemId);

    return {
      existsInStore: exists,
      availableQty: Math.max(0, balance), // Never return negative
    };
  }

  /**
   * Ensure StoreItem entry exists for an item in a store
   * Creates StoreItem with openingBalance = 0 if it doesn't exist
   * Idempotent - safe to call multiple times
   */
  async ensureStoreItemExists(
    storeId: string,
    itemId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.storeItem.upsert({
      where: {
        storeId_itemId: { storeId, itemId },
      },
      update: {}, // Don't update if exists
      create: {
        storeId,
        itemId,
        openingBalance: 0, // Always 0 for non-new-item operations
      },
    });
  }
}

