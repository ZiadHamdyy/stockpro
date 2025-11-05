import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../../configs/database/database.service';

@Injectable()
export class StockService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Calculate current stock balance for an item in a store
   * Stock = Receipts (+) - Issues (-) - Transfers Out (-) + Transfers In (+)
   */
  async getStoreItemBalance(
    storeId: string,
    itemId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;

    // Sum of all receipts for this item in this store
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

    // Sum of all issues for this item in this store
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

    const balance =
      (receipts._sum.quantity || 0) -
      (issues._sum.quantity || 0) -
      (transfersOut._sum.quantity || 0) +
      (transfersIn._sum.quantity || 0);

    return balance;
  }

  /**
   * Check if item exists in store (has any movement history)
   */
  async itemExistsInStore(
    storeId: string,
    itemId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx || this.prisma;

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

    return !!hasTransferIn;
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
}

