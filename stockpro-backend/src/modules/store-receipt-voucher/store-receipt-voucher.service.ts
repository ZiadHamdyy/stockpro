import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateStoreReceiptVoucherDto } from './dtos/create-store-receipt-voucher.dto';
import { UpdateStoreReceiptVoucherDto } from './dtos/update-store-receipt-voucher.dto';
import { StockService } from '../store/services/stock.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class StoreReceiptVoucherService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  async create(
    createStoreReceiptVoucherDto: CreateStoreReceiptVoucherDto,
    userBranchId: string,
  ) {
    const { items, ...voucherData } = createStoreReceiptVoucherDto;

    // Check if date is in a closed period (date defaults to now() in database)
    const voucherDate = new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(voucherDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create voucher: no open fiscal period exists for this date');
    }

    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(voucherDate);
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

    // Receipt operations don't need stock validation - can add any item, any quantity
    const result = await this.prisma.$transaction(async (tx) => {
      // Ensure StoreItem exists for each item (with openingBalance = 0)
      for (const item of items) {
        await this.stockService.ensureStoreItemExists(
          createStoreReceiptVoucherDto.storeId,
          item.itemId,
          tx,
        );
      }

      // Create voucher
      return tx.storeReceiptVoucher.create({
        data: {
          ...voucherData,
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

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: result.userId,
      branchId: userBranchId,
      action: 'create',
      targetType: 'store_receipt_voucher',
      targetId: result.voucherNumber,
      details: `إنشاء إذن إضافة مخزن رقم ${result.voucherNumber} بقيمة ${totalAmount} ريال`,
    });

    return result;
  }

  async findAll() {
    return this.prisma.storeReceiptVoucher.findMany({
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
    const voucher = await this.prisma.storeReceiptVoucher.findUnique({
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
      throw new NotFoundException('Store receipt voucher not found');
    }

    return voucher;
  }

  async update(
    id: string,
    updateStoreReceiptVoucherDto: UpdateStoreReceiptVoucherDto,
    userBranchId: string,
  ) {
    const { items, ...voucherData } = updateStoreReceiptVoucherDto;

    // Check if voucher exists
    const existingVoucher = await this.findOne(id);

    // Check if date is in a closed period (use existing date since DTO doesn't have date field)
    const voucherDate = existingVoucher.date;
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(voucherDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن تعديل السند: الفترة المحاسبية مغلقة');
    }

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

    // Receipt operations don't need stock validation
    const result = await this.prisma.$transaction(async (tx) => {
      // Get existing voucher to know the storeId
      const existingVoucher = await tx.storeReceiptVoucher.findUnique({
        where: { id },
        select: { storeId: true },
      });

      if (!existingVoucher) {
        throw new NotFoundException('Store receipt voucher not found');
      }

      const storeId =
        updateStoreReceiptVoucherDto.storeId || existingVoucher.storeId;

      // Ensure StoreItem exists for each new item (with openingBalance = 0)
      if (items) {
        for (const item of items) {
          await this.stockService.ensureStoreItemExists(
            storeId,
            item.itemId,
            tx,
          );
        }
      }

      // Update voucher
      return tx.storeReceiptVoucher.update({
        where: { id },
        data: {
          ...voucherData,
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

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: result.userId,
      branchId: userBranchId,
      action: 'update',
      targetType: 'store_receipt_voucher',
      targetId: result.voucherNumber,
      details: `تعديل إذن إضافة مخزن رقم ${result.voucherNumber}`,
    });

    return result;
  }

  async remove(id: string, userBranchId: string) {
    const voucher = await this.findOne(id);

    const deleted = await this.prisma.storeReceiptVoucher.delete({
      where: { id },
    });

    // Create audit log
    await this.auditLogService.createAuditLog({
      userId: voucher.userId,
      branchId: userBranchId,
      action: 'delete',
      targetType: 'store_receipt_voucher',
      targetId: voucher.voucherNumber,
      details: `حذف إذن إضافة مخزن رقم ${voucher.voucherNumber}`,
    });

    return deleted;
  }

  private async generateVoucherNumber(): Promise<string> {
    const count = await this.prisma.storeReceiptVoucher.count();
    return `SRV-${String(count + 1).padStart(6, '0')}`;
  }
}
