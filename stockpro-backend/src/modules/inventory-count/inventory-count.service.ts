import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateInventoryCountDto } from './dtos/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dtos/update-inventory-count.dto';
import { InventoryCountResponse } from './dtos/response/inventory-count.response';
import { StoreReceiptVoucherService } from '../store-receipt-voucher/store-receipt-voucher.service';
import { StoreIssueVoucherService } from '../store-issue-voucher/store-issue-voucher.service';
import { StockService } from '../store/services/stock.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class InventoryCountService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeReceiptVoucherService: StoreReceiptVoucherService,
    private readonly storeIssueVoucherService: StoreIssueVoucherService,
    private readonly stockService: StockService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  async create(
    companyId: string,
    createInventoryCountDto: CreateInventoryCountDto,
  ): Promise<InventoryCountResponse> {
    const { items, date, ...countData } = createInventoryCountDto;

    // Validate items array
    if (!items || items.length === 0) {
      throw new BadRequestException('Inventory count must contain at least one item');
    }

    // Check financial period status
    const countDate = date ? new Date(date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, countDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء جرد: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, countDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء جرد: الفترة المحاسبية مغلقة');
    }

    // Generate code
    const code = await this.generateNextCode(companyId);

    // Calculate total variance value
    const totalVarianceValue = items.reduce(
      (sum, item) => sum + item.difference * item.cost,
      0,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
      // Create inventory count
      const inventoryCount = await tx.inventoryCount.create({
        data: {
          ...countData,
          date: date ? new Date(date) : new Date(),
          code,
          status: 'PENDING',
          totalVarianceValue,
          items: {
            create: items.map((item) => ({
              itemId: item.itemId,
              systemStock: item.systemStock,
              actualStock: item.actualStock,
              difference: item.difference,
              cost: item.cost,
            })),
          },
          companyId,
        },
        include: {
          store: {
            include: {
              branch: true,
            },
          },
          user: true,
          branch: true,
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

        return this.mapToResponse(inventoryCount);
      });
    } catch (error) {
      // Handle database errors
      if (error instanceof Error) {
        if (error.message.includes('does not exist')) {
          throw new BadRequestException(
            'Database tables not found. Please run migrations first.',
          );
        }
        if (error.message.includes('Foreign key constraint')) {
          throw new BadRequestException(
            'Invalid store, user, or branch ID provided',
          );
        }
      }
      throw error;
    }
  }

  async findAll(companyId: string): Promise<InventoryCountResponse[]> {
    try {
      const counts = await this.prisma.inventoryCount.findMany({
        where: { companyId },
        include: {
          store: {
            include: {
              branch: true,
            },
          },
          user: true,
          branch: true,
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
          createdAt: 'desc',
        },
      });

      return counts.map((count) => this.mapToResponse(count));
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async findOne(companyId: string, id: string): Promise<InventoryCountResponse> {
    const count = await this.prisma.inventoryCount.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        branch: true,
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

    if (!count || count.companyId !== companyId) {
      throw new NotFoundException('Inventory count not found');
    }

    return this.mapToResponse(count);
  }

  async update(
    companyId: string,
    id: string,
    updateInventoryCountDto: UpdateInventoryCountDto,
  ): Promise<InventoryCountResponse> {
    // Check if count exists and is pending
    const existing = await this.findOne(companyId, id);
    if (existing.status === 'POSTED') {
      throw new BadRequestException(
        'Cannot update a posted inventory count',
      );
    }

    const { items, date, ...countData } = updateInventoryCountDto;
    const parsedDate = date ? new Date(date) : undefined;

    // Calculate total variance value if items are provided
    const totalVarianceValue = items
      ? items.reduce((sum, item) => sum + item.difference * item.cost, 0)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Update inventory count
      const inventoryCount = await tx.inventoryCount.update({
        where: { id },
        data: {
          ...countData,
          ...(parsedDate && { date: parsedDate }),
          ...(totalVarianceValue !== undefined && { totalVarianceValue }),
          ...(items && {
            items: {
              deleteMany: {},
              create: items.map((item) => ({
                itemId: item.itemId,
                systemStock: item.systemStock,
                actualStock: item.actualStock,
                difference: item.difference,
                cost: item.cost,
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
          branch: true,
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

      return this.mapToResponse(inventoryCount);
    });
  }

  async post(companyId: string, id: string): Promise<InventoryCountResponse> {
    // Get the inventory count
    const count = await this.prisma.inventoryCount.findUnique({
      where: { id_companyId: { id, companyId } },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        store: true,
        user: true,
      },
    });

    if (!count || count.companyId !== companyId) {
      throw new NotFoundException('Inventory count not found');
    }

    if (count.status === 'POSTED') {
      throw new BadRequestException('Inventory count is already posted');
    }

    // Create settlement vouchers
    await this.createSettlementVouchers(companyId, count);

    // Update status to POSTED
    const updated = await this.prisma.inventoryCount.update({
      where: { id },
      data: { status: 'POSTED' },
      include: {
        store: {
          include: {
            branch: true,
          },
        },
        user: true,
        branch: true,
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

    return this.mapToResponse(updated);
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Check if count exists and is pending
    const existing = await this.findOne(companyId, id);
    if (existing.status === 'POSTED') {
      throw new BadRequestException(
        'Cannot delete a posted inventory count',
      );
    }

    await this.prisma.inventoryCount.delete({
      where: { id },
    });
  }

  private async createSettlementVouchers(companyId: string, count: any): Promise<void> {
    const receiptItems: any[] = [];
    const issueItems: any[] = [];

    // Get user's branchId from the count
    const userBranchId = count.user?.branchId || count.branchId || '';

    // Separate items into receipt (surplus) and issue (shortage)
    for (const countItem of count.items) {
      const difference = countItem.difference;
      const cost = countItem.cost;

      if (difference < 0) {
        // Shortage: create issue voucher to remove the shortage (negative difference means we need to reduce)
        const quantity = Math.abs(difference);
        issueItems.push({
          itemId: countItem.itemId,
          quantity,
          unitPrice: cost,
          totalPrice: quantity * cost,
        });
      } else if (difference > 0) {
        // Surplus: create receipt voucher to add the surplus (positive difference means we need to add)
        const quantity = difference;
        receiptItems.push({
          itemId: countItem.itemId,
          quantity,
          unitPrice: cost,
          totalPrice: quantity * cost,
        });
      }
    }

    // Create receipt voucher for surpluses (when actual > system, we add the difference)
    if (receiptItems.length > 0) {
      await this.storeReceiptVoucherService.create(
        companyId,
        {
          storeId: count.storeId,
          userId: count.userId,
          notes: `تسوية جرد - إضافة الزيادة من جرد ${count.code}`,
          items: receiptItems,
        },
        userBranchId,
      );
    }

    // Create issue voucher for shortages (when actual < system, we remove the difference)
    if (issueItems.length > 0) {
      await this.storeIssueVoucherService.create(
        companyId,
        {
          storeId: count.storeId,
          userId: count.userId,
          notes: `تسوية جرد - إزالة العجز من جرد ${count.code}`,
          items: issueItems,
        },
        userBranchId,
      );
    }
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastCount = await this.prisma.inventoryCount.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastCount) {
      return 'INVC-0001';
    }

    const match = lastCount.code.match(/INVC-(\d+)/);
    if (!match) {
      return 'INVC-0001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `INVC-${String(nextNumber).padStart(4, '0')}`;
  }

  private mapToResponse(count: any): InventoryCountResponse {
    // Handle case where relations might not be loaded
    if (!count.store || !count.user) {
      throw new Error('Store and User relations must be included in the query');
    }

    return {
      id: count.id,
      code: count.code,
      date: count.date,
      status: count.status,
      notes: count.notes,
      totalVarianceValue: count.totalVarianceValue,
      store: {
        id: count.store.id,
        code: count.store.code,
        name: count.store.name,
        address: count.store.address || undefined,
        phone: count.store.phone || undefined,
        description: count.store.description || undefined,
        branch: count.store.branch
          ? {
              id: count.store.branch.id,
              code: count.store.branch.code,
              name: count.store.branch.name,
              address: count.store.branch.address || undefined,
              phone: count.store.branch.phone || undefined,
              description: count.store.branch.description || undefined,
            }
          : undefined,
      },
      user: {
        id: count.user.id,
        code: count.user.code,
        email: count.user.email,
        name: count.user.name || undefined,
      },
      branch: count.branch
        ? {
            id: count.branch.id,
            code: count.branch.code,
            name: count.branch.name,
            address: count.branch.address || undefined,
            phone: count.branch.phone || undefined,
            description: count.branch.description || undefined,
          }
        : undefined,
      items: (count.items || []).map((item: any) => {
        if (!item.item) {
          throw new Error('Item relation must be included in the query');
        }
        return {
          id: item.id,
          systemStock: item.systemStock,
          actualStock: item.actualStock,
          difference: item.difference,
          cost: item.cost,
          item: {
            id: item.item.id,
            code: item.item.code,
            barcode: item.item.barcode || undefined,
            name: item.item.name,
            purchasePrice: item.item.purchasePrice,
            initialPurchasePrice: item.item.initialPurchasePrice,
            salePrice: item.item.salePrice,
            stock: item.item.stock,
            reorderLimit: item.item.reorderLimit,
            type: item.item.type,
            group: {
              id: item.item.group.id,
              code: item.item.group.code,
              name: item.item.group.name,
              description: item.item.group.description || undefined,
            },
            unit: {
              id: item.item.unit.id,
              code: item.item.unit.code,
              name: item.item.unit.name,
              description: item.item.unit.description || undefined,
            },
          },
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
      createdAt: count.createdAt,
      updatedAt: count.updatedAt,
    };
  }
}

