import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { StockService } from '../store/services/stock.service';
import { CreateStoreTransferVoucherDto } from './dtos/create-store-transfer-voucher.dto';
import { UpdateStoreTransferVoucherDto } from './dtos/update-store-transfer-voucher.dto';

@Injectable()
export class StoreTransferVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly stockService: StockService,
  ) {}

  async create(createStoreTransferVoucherDto: CreateStoreTransferVoucherDto) {
    const { items, fromStoreId, ...voucherData } = createStoreTransferVoucherDto;

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
      // Validate stock in fromStore (same as issue operation)
      // No validation needed for toStore (same as receipt operation)
      for (const item of items) {
        await this.stockService.validateTransferFrom(
          fromStoreId,
          item.itemId,
          item.quantity,
          tx,
        );
      }

      // Create voucher (stock validation passed)
      return tx.storeTransferVoucher.create({
        data: {
          ...voucherData,
          fromStoreId,
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
          fromStore: {
            include: {
              branch: true,
            },
          },
          toStore: {
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

  async findAll() {
    return this.prisma.storeTransferVoucher.findMany({
      include: {
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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
    const voucher = await this.prisma.storeTransferVoucher.findUnique({
      where: { id },
      include: {
        fromStore: {
          include: {
            branch: true,
          },
        },
        toStore: {
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
      throw new NotFoundException('Store transfer voucher not found');
    }

    return voucher;
  }

  async update(
    id: string,
    updateStoreTransferVoucherDto: UpdateStoreTransferVoucherDto,
  ) {
    const { items, fromStoreId, ...voucherData } = updateStoreTransferVoucherDto;

    // Check if voucher exists and get old data
    const oldVoucher = await this.findOne(id);
    const actualFromStoreId = fromStoreId || oldVoucher.fromStoreId;

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

        // For each item, calculate net change and validate for fromStore
        for (const [itemId, newQty] of newItemsByItemId.entries()) {
          const oldQty = oldItemsByItemId.get(itemId) || 0;
          const netChange = newQty - oldQty;

          if (netChange > 0) {
            // Need to check if we have enough stock for the additional quantity
            const currentBalance =
              await this.stockService.getStoreItemBalance(
                actualFromStoreId,
                itemId,
                tx,
              );
            if (currentBalance < netChange) {
              throw new BadRequestException(
                `Insufficient stock in source store for item ${itemId}. Available: ${currentBalance}, Additional needed: ${netChange}`,
              );
            }
          }
          // If netChange <= 0, we're decreasing or staying the same, no validation needed
        }

        // Also check item existence for items that weren't in old voucher
        for (const [itemId] of newItemsByItemId.entries()) {
          if (!oldItemsByItemId.has(itemId)) {
            // New item in update - check it exists in fromStore
            const exists = await this.stockService.itemExistsInStore(
              actualFromStoreId,
              itemId,
              tx,
            );
            if (!exists) {
              throw new BadRequestException(
                `Item ${itemId} does not exist in the source store. Cannot transfer items that have never been received or transferred into this store.`,
              );
            }
          }
        }
      }

      // Update voucher
      return tx.storeTransferVoucher.update({
        where: { id },
        data: {
          ...voucherData,
          ...(fromStoreId && { fromStoreId }),
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
          fromStore: {
            include: {
              branch: true,
            },
          },
          toStore: {
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
    await this.findOne(id);

    return this.prisma.storeTransferVoucher.delete({
      where: { id },
    });
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeTransferVoucher.count();
    return `STV-${String(count + 1).padStart(6, '0')}`;
  }
}
