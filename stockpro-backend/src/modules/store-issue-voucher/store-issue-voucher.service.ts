import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { StockService } from '../store/services/stock.service';
import { CreateStoreIssueVoucherDto } from './dtos/create-store-issue-voucher.dto';
import { UpdateStoreIssueVoucherDto } from './dtos/update-store-issue-voucher.dto';

@Injectable()
export class StoreIssueVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly stockService: StockService,
  ) {}

  async create(createStoreIssueVoucherDto: CreateStoreIssueVoucherDto) {
    const { items, storeId, ...voucherData } = createStoreIssueVoucherDto;

    // Validate quantities are positive
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `Quantity must be greater than zero for item ${item.itemId}`,
        );
      }
    }

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber();

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return this.prisma.$transaction(async (tx) => {
      // Validate stock for each item before creating voucher
      for (const item of items) {
        await this.stockService.validateAndDecreaseStock(
          storeId,
          item.itemId,
          item.quantity,
          tx,
        );
      }

      // Create voucher (stock validation passed)
      return tx.storeIssueVoucher.create({
        data: {
          ...voucherData,
          storeId,
          voucherNumber,
          totalAmount,
          items: {
            create: items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              itemId: item.itemId,
            })),
          },
        },
        include: {
          store: true,
          user: true,
          items: {
            include: {
              item: {
                include: {
                  group: true,
                  unit: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.storeIssueVoucher.findMany({
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.storeIssueVoucher.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        items: {
          include: {
            item: {
              include: {
                group: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Store issue voucher not found');
    }

    return voucher;
  }

  async update(
    id: string,
    updateStoreIssueVoucherDto: UpdateStoreIssueVoucherDto,
  ) {
    const { items, storeId, ...voucherData } = updateStoreIssueVoucherDto;

    // Check if voucher exists and get old data
    const oldVoucher = await this.findOne(id);
    const actualStoreId = storeId || oldVoucher.storeId;

    // Validate quantities are positive if items provided
    if (items) {
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new BadRequestException(
            `Quantity must be greater than zero for item ${item.itemId}`,
          );
        }
      }
    }

    // Calculate total amount if items are provided
    const totalAmount = items
      ? items.reduce((sum, item) => sum + item.totalPrice, 0)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      // If items are being updated, validate stock accounting for old items being deleted
      if (items) {
        // Group old items by itemId to sum quantities
        const oldItemsByItemId = new Map<string, number>();
        if (oldVoucher.items) {
          for (const oldItem of oldVoucher.items) {
            const current = oldItemsByItemId.get(oldItem.itemId) || 0;
            oldItemsByItemId.set(oldItem.itemId, current + oldItem.quantity);
          }
        }

        // Group new items by itemId to sum quantities
        const newItemsByItemId = new Map<string, number>();
        for (const newItem of items) {
          const current = newItemsByItemId.get(newItem.itemId) || 0;
          newItemsByItemId.set(newItem.itemId, current + newItem.quantity);
        }

        // For each item, calculate net change and validate
        for (const [itemId, newQty] of newItemsByItemId.entries()) {
          const oldQty = oldItemsByItemId.get(itemId) || 0;
          const netChange = newQty - oldQty;

          if (netChange > 0) {
            // Need to check if we have enough stock for the additional quantity
            // Current stock includes old items, so we need: current stock >= netChange
            const currentBalance = await this.stockService.getStoreItemBalance(
              actualStoreId,
              itemId,
              tx,
            );
            if (currentBalance < netChange) {
              throw new BadRequestException(
                `Insufficient stock for item ${itemId}. Available: ${currentBalance}, Additional needed: ${netChange}`,
              );
            }
          }
          // If netChange <= 0, we're decreasing or staying the same, no validation needed
        }

        // Also check item existence for items that weren't in old voucher
        for (const [itemId] of newItemsByItemId.entries()) {
          if (!oldItemsByItemId.has(itemId)) {
            // New item in update - check it exists in store
            const exists = await this.stockService.itemExistsInStore(
              actualStoreId,
              itemId,
              tx,
            );
            if (!exists) {
              throw new BadRequestException(
                `Item ${itemId} does not exist in the store. Cannot issue items that have never been received or transferred into this store.`,
              );
            }
          }
        }
      }

      // Update voucher
      return tx.storeIssueVoucher.update({
        where: { id },
        data: {
          ...voucherData,
          ...(storeId && { storeId }),
          ...(totalAmount !== undefined && { totalAmount }),
          ...(items && {
            items: {
              deleteMany: {},
              create: items.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                itemId: item.itemId,
              })),
            },
          }),
        },
        include: {
          store: {
            include: {
              branch: true,
            },
          },
          user: true,
          items: {
            include: {
              item: {
                include: {
                  group: true,
                  unit: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    // Get voucher before deletion to know what to rollback
    const voucher = await this.findOne(id);

    // Delete voucher (stock is automatically "restored" since the voucher items are deleted)
    // No need to explicitly rollback since stock is calculated from voucher history
    return this.prisma.storeIssueVoucher.delete({
      where: { id },
    });
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeIssueVoucher.count();
    return `SIV-${String(count + 1).padStart(6, '0')}`;
  }
}
