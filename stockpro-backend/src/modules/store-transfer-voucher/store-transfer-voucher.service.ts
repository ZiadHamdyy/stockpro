import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { StockService } from '../store/services/stock.service';
import { CreateStoreTransferVoucherDto } from './dtos/create-store-transfer-voucher.dto';
import { UpdateStoreTransferVoucherDto } from './dtos/update-store-transfer-voucher.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class StoreTransferVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  async create(
    companyId: string,
    createStoreTransferVoucherDto: CreateStoreTransferVoucherDto,
    userBranchId: string,
  ) {
    const { items, fromStoreId, ...voucherData } =
      createStoreTransferVoucherDto;

    // Check if date is in a closed period (date defaults to now() in database)
    const voucherDate = new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, voucherDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create voucher: no open fiscal period exists for this date');
    }

    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, voucherDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create voucher in a closed fiscal period');
    }

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

    const result = await this.prisma.$transaction(async (tx) => {
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

      // Ensure StoreItem exists in destination store for each item (with openingBalance = 0)
      const toStoreId = createStoreTransferVoucherDto.toStoreId;
      for (const item of items) {
        await this.stockService.ensureStoreItemExists(
          toStoreId,
          item.itemId,
          tx,
        );
      }

      // Create voucher (stock validation passed) with PENDING status
      return tx.storeTransferVoucher.create({
        data: {
          ...voucherData,
          fromStoreId,
          voucherNumber,
          totalAmount,
          companyId,
          status: 'PENDING',
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

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: result.userId,
      branchId: userBranchId,
      action: 'create',
      targetType: 'store_transfer',
      targetId: result.voucherNumber,
      details: `إنشاء تحويل مخزن رقم ${result.voucherNumber} من ${result.fromStore.name} إلى ${result.toStore.name}`,
    });

    // Create notifications for users in BOTH stores (sending and receiving)
    // Notify receiving store
    try {
      await this.notificationService.createForStoreUsers(
        companyId,
        result.toStoreId,
        'store_transfer',
        `طلب تحويل مخزن جديد رقم ${result.voucherNumber} من ${result.fromStore.name} - سيتم استلام العناصر`,
        result.id,
      );
    } catch (error) {
      console.error('Error creating notifications for receiving store:', error);
      // Continue even if notification creation fails
    }

    // Notify sending store
    try {
      await this.notificationService.createForStoreUsers(
        companyId,
        result.fromStoreId,
        'store_transfer',
        `طلب تحويل مخزن جديد رقم ${result.voucherNumber} إلى ${result.toStore.name} - سيتم إرسال العناصر`,
        result.id,
      );
    } catch (error) {
      console.error('Error creating notifications for sending store:', error);
      // Continue even if notification creation fails
    }

    return result;
  }

  async findAll(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status && ['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    return this.prisma.storeTransferVoucher.findMany({
      where,
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

  async findOne(companyId: string, id: string) {
    const voucher = await this.prisma.storeTransferVoucher.findUnique({
      where: { id_companyId: { id, companyId } },
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
    companyId: string,
    id: string,
    updateStoreTransferVoucherDto: UpdateStoreTransferVoucherDto,
    userBranchId: string,
  ) {
    const { items, fromStoreId, ...voucherData } =
      updateStoreTransferVoucherDto;

    // Check if voucher exists and get old data
    const oldVoucher = await this.prisma.storeTransferVoucher.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        items: true,
      },
    });
    
    if (!oldVoucher) {
      throw new NotFoundException('Store transfer voucher not found');
    }
    
    // Check if date is in a closed period (use existing date since DTO doesn't have date field)
    const voucherDate = oldVoucher.date;
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, voucherDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن تعديل السند: الفترة المحاسبية مغلقة');
    }
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

    const result = await this.prisma.$transaction(async (tx) => {
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
            const currentBalance = await this.stockService.getStoreItemBalance(
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

      // Get destination store ID
      const actualToStoreId =
        updateStoreTransferVoucherDto.toStoreId || oldVoucher.toStoreId;

      // Ensure StoreItem exists in destination store for each item (with openingBalance = 0)
      if (items) {
        for (const item of items) {
          await this.stockService.ensureStoreItemExists(
            actualToStoreId,
            item.itemId,
            tx,
          );
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

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: result.userId,
      branchId: userBranchId,
      action: 'update',
      targetType: 'store_transfer',
      targetId: result.voucherNumber,
      details: `تعديل تحويل مخزن رقم ${result.voucherNumber}`,
    });

    return result;
  }

  async remove(companyId: string, id: string, userBranchId: string) {
    const voucher = await this.findOne(companyId, id);

    const deleted = await this.prisma.storeTransferVoucher.delete({
      where: { id },
    });

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: voucher.userId,
      branchId: userBranchId,
      action: 'delete',
      targetType: 'store_transfer',
      targetId: voucher.voucherNumber,
      details: `حذف تحويل مخزن رقم ${voucher.voucherNumber}`,
    });

    return deleted;
  }

  async acceptTransfer(companyId: string, id: string, userBranchId: string, userId: string) {
    const voucher = await this.findOne(companyId, id);

    if (voucher.status !== 'PENDING') {
      throw new BadRequestException(
        `Transfer voucher ${voucher.voucherNumber} is not pending. Current status: ${voucher.status}`,
      );
    }

    // Update status to ACCEPTED and update stock
    const result = await this.prisma.$transaction(async (tx) => {
      // Update voucher status
      const updated = await tx.storeTransferVoucher.update({
        where: { id },
        data: { status: 'ACCEPTED' },
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

      // Stock is automatically updated via aggregation in StockService
      // (only ACCEPTED transfers are counted)

      return updated;
    });

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId,
      branchId: userBranchId,
      action: 'accept',
      targetType: 'store_transfer',
      targetId: result.voucherNumber,
      details: `قبول تحويل مخزن رقم ${result.voucherNumber} من ${result.fromStore.name} إلى ${result.toStore.name}`,
    });

    // Mark related notifications as read for all users in the receiving store
    await this.notificationService.createForStoreUsers(
      companyId,
      result.toStoreId,
      'store_transfer_accepted',
      `تم قبول تحويل المخزن رقم ${result.voucherNumber}`,
      result.id,
    );

    return result;
  }

  async rejectTransfer(companyId: string, id: string, userBranchId: string, userId: string) {
    const voucher = await this.findOne(companyId, id);

    if (voucher.status !== 'PENDING') {
      throw new BadRequestException(
        `Transfer voucher ${voucher.voucherNumber} is not pending. Current status: ${voucher.status}`,
      );
    }

    // Update status to REJECTED (stock remains unchanged)
    const result = await this.prisma.$transaction(async (tx) => {
      return tx.storeTransferVoucher.update({
        where: { id },
        data: { status: 'REJECTED' },
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

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId,
      branchId: userBranchId,
      action: 'reject',
      targetType: 'store_transfer',
      targetId: result.voucherNumber,
      details: `رفض تحويل مخزن رقم ${result.voucherNumber} من ${result.fromStore.name} إلى ${result.toStore.name}`,
    });

    // Mark related notifications as read and notify sending store
    await this.notificationService.createForStoreUsers(
      companyId,
      result.fromStoreId,
      'store_transfer_rejected',
      `تم رفض تحويل المخزن رقم ${result.voucherNumber}`,
      result.id,
    );

    return result;
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeTransferVoucher.count();
    return `STV-${String(count + 1).padStart(6, '0')}`;
  }
}
