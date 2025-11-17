import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSalesReturnRequest } from './dtos/request/create-sales-return.request';
import { UpdateSalesReturnRequest } from './dtos/request/update-sales-return.request';
import { SalesReturnResponse } from './dtos/response/sales-return.response';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';

@Injectable()
export class SalesReturnService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
  ) {}

  async create(
    data: CreateSalesReturnRequest,
    userId: string,
    branchId?: string,
  ): Promise<SalesReturnResponse> {
    // Validations
    if (!data.customerId) {
      throwHttp(422, ERROR_CODES.INV_CUSTOMER_REQUIRED, 'Customer is required');
    }
    if (!data.items || data.items.length === 0) {
      throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
    }
    if (data.paymentMethod === 'cash') {
      if (!data.paymentTargetType || !data.paymentTargetId) {
        throwHttp(
          422,
          ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
          'Safe or bank is required for cash payments',
        );
      }
    } else if (data.paymentMethod === 'credit') {
      if (data.paymentTargetType || data.paymentTargetId) {
        throwHttp(
          422,
          ERROR_CODES.INV_PAYMENT_ACCOUNT_FOR_CREDIT_NOT_ALLOWED,
          'Payment account must be empty for credit payments',
        );
      }
    }
    const code = await this.generateNextCode();

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const discount = data.discount || 0;

    // Get company VAT settings
    const company = await this.prisma.company.findFirst();
    const vatRate = company?.vatRate || 0;
    const isVatEnabled = company?.isVatEnabled || false;

    const tax = isVatEnabled ? subtotal * (vatRate / 100) : 0;
    const net = subtotal + tax - discount;

    // Update items with calculated values
    const itemsWithTotals = data.items.map((item) => ({
      ...item,
      taxAmount: isVatEnabled ? item.qty * item.price * (vatRate / 100) : 0,
      total: item.qty * item.price,
    }));

    // Get store from branch
    let store: any = null;
    if (branchId) {
      try {
        store = await this.storeService.findByBranchId(branchId);
      } catch (error) {
        // Store not found, will use fallback
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      // Get store in transaction
      if (branchId && !store) {
        store = await tx.store.findFirst({
          where: { branchId },
        });
      }

      const ret = await tx.salesReturn.create({
        data: {
          code,
          date: data.date ? new Date(data.date) : new Date(),
          customerId: data.customerId,
          items: itemsWithTotals,
          subtotal,
          discount,
          tax,
          net,
          paymentMethod: data.paymentMethod,
          paymentTargetType: data.paymentTargetType,
          paymentTargetId: data.paymentTargetId,
          notes: data.notes,
          userId,
          branchId,
        },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      // Add stock back using StoreReceiptVoucher pattern (only for STOCKED items)
      if (store) {
        // Filter STOCKED items and get item records
        const stockedItemsWithRecords = await Promise.all(
          data.items.map(async (item) => {
            const itemRecord = await tx.item.findUnique({
              where: { code: item.id },
            });
            if (itemRecord && (itemRecord as any).type === 'STOCKED') {
              return { item, itemRecord };
            }
            return null;
          }),
        );
        const stockedItems = stockedItemsWithRecords.filter(Boolean) as Array<{
          item: any;
          itemRecord: any;
        }>;

        // Ensure StoreItem exists for each item (with openingBalance = 0)
        // Stock will be tracked via SalesReturn items in StockService
        for (const { itemRecord } of stockedItems) {
          await this.stockService.ensureStoreItemExists(
            store.id,
            itemRecord.id,
            tx,
          );
        }
      } else {
        // Fallback: Update global stock if store not found (backward compatibility)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code: item.id },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
            await tx.item.update({
              where: { code: item.id },
              data: { stock: { increment: item.qty } },
            });
          }
        }
      }

      // Apply cash impact if applicable (sales return decreases balance)
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        await AccountingService.applyImpact({
          kind: 'sales-return',
          amount: net,
          paymentTargetType: data.paymentTargetType as any,
          branchId,
          bankId:
            data.paymentTargetType === 'bank'
              ? data.paymentTargetId || null
              : null,
          tx,
        });
      }

      // Customer balance updates are disabled
      // if (data.paymentMethod === 'credit' && data.customerId) {
      //   await tx.customer.update({
      //     where: { id: data.customerId },
      //     data: { currentBalance: { decrement: net } },
      //   });
      // }

      return ret;
    });

    return this.mapToResponse(created);
  }

  async findAll(search?: string): Promise<SalesReturnResponse[]> {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            {
              customer: {
                name: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const salesReturns = await this.prisma.salesReturn.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return salesReturns.map((return_) => this.mapToResponse(return_));
  }

  async findOne(id: string): Promise<SalesReturnResponse> {
    const salesReturn = await this.prisma.salesReturn.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!salesReturn) {
      throw new NotFoundException('Sales return not found');
    }

    return this.mapToResponse(salesReturn);
  }

  async update(
    id: string,
    data: UpdateSalesReturnRequest,
    userId: string,
  ): Promise<SalesReturnResponse> {
    try {
      // Get existing return to adjust stock
      const existingReturn = await this.prisma.salesReturn.findUnique({
        where: { id },
      });

      if (existingReturn) {
        // Decrease stock for old items (reverse the return)
        await this.updateStockForItems(
          existingReturn.items as any[],
          'decrease',
        );
      }

      // Calculate new totals
      const items = data.items || (existingReturn?.items as any[]) || [];
      const subtotal = items.reduce(
        (sum, item) => sum + item.qty * item.price,
        0,
      );
      const discount =
        data.discount !== undefined
          ? data.discount
          : existingReturn?.discount || 0;

      // Get company VAT settings
      const company = await this.prisma.company.findFirst();
      const vatRate = company?.vatRate || 0;
      const isVatEnabled = company?.isVatEnabled || false;

      const tax = isVatEnabled ? subtotal * (vatRate / 100) : 0;
      const net = subtotal + tax - discount;

      // Update items with calculated values
      const itemsWithTotals = items.map((item) => ({
        ...item,
        taxAmount: isVatEnabled ? item.qty * item.price * (vatRate / 100) : 0,
        total: item.qty * item.price,
      }));

      const updated = await this.prisma.$transaction(async (tx) => {
        // Reverse previous increase
        if (existingReturn) {
          for (const oldItem of (existingReturn.items as any[]) || []) {
            await tx.item.update({
              where: { code: oldItem.id },
              data: { stock: { decrement: oldItem.qty } },
            });
          }
        }

        const ret = await tx.salesReturn.update({
          where: { id },
          data: {
            ...data,
            items: itemsWithTotals,
            subtotal,
            discount,
            tax,
            net,
            userId,
          },
          include: {
            customer: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          },
        });

        for (const item of items) {
          await tx.item.update({
            where: { code: item.id },
            data: { stock: { increment: item.qty } },
          });
        }

        // Reverse previous cash impact if needed
        if (
          existingReturn &&
          (existingReturn as any).paymentMethod === 'cash' &&
          (existingReturn as any).paymentTargetType
        ) {
          await AccountingService.reverseImpact({
            kind: 'sales-return',
            amount: (existingReturn as any).net,
            paymentTargetType: (existingReturn as any).paymentTargetType,
            branchId: (existingReturn as any).branchId,
            bankId:
              (existingReturn as any).paymentTargetType === 'bank'
                ? (existingReturn as any).paymentTargetId
                : null,
            tx,
          });
        }
        // Customer balance updates are disabled
        // if (existingReturn && (existingReturn as any).paymentMethod === 'credit' && (existingReturn as any).customerId) {
        //   await tx.customer.update({
        //     where: { id: (existingReturn as any).customerId },
        //     data: { currentBalance: { increment: (existingReturn as any).net } },
        //   });
        // }
        // Apply new cash impact if applicable
        const targetType =
          (ret as any).paymentMethod === 'cash'
            ? (ret as any).paymentTargetType
            : null;
        if (targetType) {
          await AccountingService.applyImpact({
            kind: 'sales-return',
            amount: (ret as any).net,
            paymentTargetType: targetType,
            branchId: (ret as any).branchId,
            bankId: targetType === 'bank' ? (ret as any).paymentTargetId : null,
            tx,
          });
        }
        // Customer balance updates are disabled
        // if ((ret as any).paymentMethod === 'credit' && (ret as any).customerId) {
        //   await tx.customer.update({
        //     where: { id: (ret as any).customerId },
        //     data: { currentBalance: { decrement: (ret as any).net } },
        //   });
        // }

        return ret;
      });

      return this.mapToResponse(updated);
    } catch (error) {
      throw new NotFoundException('Sales return not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Get return to decrease stock
      const return_ = await this.prisma.salesReturn.findUnique({
        where: { id },
      });

      if (return_) {
        // Decrease stock (reverse the return)
        await this.updateStockForItems(return_.items as any[], 'decrease');

        // Customer balance updates are disabled
        // if ((return_ as any).paymentMethod === 'credit' && (return_ as any).customerId) {
        //   await this.prisma.customer.update({
        //     where: { id: (return_ as any).customerId },
        //     data: { currentBalance: { increment: (return_ as any).net } },
        //   });
        // }
      }

      await this.prisma.salesReturn.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Sales return not found');
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastReturn = await this.prisma.salesReturn.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastReturn) {
      return 'RTN-00001';
    }

    const match = lastReturn.code.match(/RTN-(\d+)/);
    if (!match) {
      return 'RTN-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `RTN-${String(nextNumber).padStart(5, '0')}`;
  }

  private async updateStockForItems(
    items: any[],
    operation: 'increase' | 'decrease',
  ): Promise<void> {
    for (const item of items) {
      await this.prisma.item.update({
        where: { code: item.id },
        data: {
          stock:
            operation === 'increase'
              ? { increment: item.qty }
              : { decrement: item.qty },
        },
      });
    }
  }

  private mapToResponse(salesReturn: any): SalesReturnResponse {
    return {
      id: salesReturn.id,
      code: salesReturn.code,
      date: salesReturn.date,
      customerId: salesReturn.customerId,
      customer: salesReturn.customer,
      items: salesReturn.items,
      subtotal: salesReturn.subtotal,
      discount: salesReturn.discount,
      tax: salesReturn.tax,
      net: salesReturn.net,
      paymentMethod: salesReturn.paymentMethod,
      paymentTargetType: salesReturn.paymentTargetType,
      paymentTargetId: salesReturn.paymentTargetId,
      notes: salesReturn.notes,
      userId: salesReturn.userId,
      user: salesReturn.user,
      branchId: salesReturn.branchId,
      branch: salesReturn.branch,
      createdAt: salesReturn.createdAt,
      updatedAt: salesReturn.updatedAt,
    };
  }
}
