import { Injectable, NotFoundException } from '@nestjs/common';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSalesInvoiceRequest } from './dtos/request/create-sales-invoice.request';
import { UpdateSalesInvoiceRequest } from './dtos/request/update-sales-invoice.request';
import { SalesInvoiceResponse } from './dtos/response/sales-invoice.response';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';

@Injectable()
export class SalesInvoiceService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
  ) {}

  private computeLineTotals(
    item: { qty: number; price: number; salePriceIncludesTax?: boolean },
    vatRate: number,
    isVatEnabled: boolean,
  ) {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const lineAmount = qty * price;

    if (!isVatEnabled || vatRate <= 0) {
      return { net: lineAmount, taxAmount: 0, total: lineAmount };
    }

    const includesTax = Boolean(item.salePriceIncludesTax);

    if (includesTax) {
      // When price includes tax: net = total / (1 + taxRate)
      const net = lineAmount / (1 + vatRate / 100);
      const taxAmount = lineAmount - net;
      return { net, taxAmount, total: lineAmount };
    }

    // When price excludes tax: tax = base * taxRate, total = base + tax
    const taxAmount = lineAmount * (vatRate / 100);
    const total = lineAmount + taxAmount;
    return { net: lineAmount, taxAmount, total };
  }

  async create(
    data: CreateSalesInvoiceRequest,
    userId: string,
    branchId?: string,
  ): Promise<SalesInvoiceResponse> {
    // Basic validations
    // Customer is only required for credit payments
    if (data.paymentMethod === 'credit' && !data.customerId) {
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

    // Get company VAT settings
    const company = await this.prisma.company.findFirst();
    const vatRate = company?.vatRate || 0;
    const isVatEnabled = company?.isVatEnabled || false;

    const discount = data.discount || 0;
    let subtotal = 0;
    let tax = 0;

    const itemsWithTotals = data.items.map((item) => {
      const {
        net: lineNet,
        taxAmount,
        total,
      } = this.computeLineTotals(item, vatRate, isVatEnabled);
      subtotal += lineNet;
      tax += taxAmount;
      return {
        ...item,
        salePriceIncludesTax: item.salePriceIncludesTax ?? false,
        taxAmount,
        total,
      };
    });

    const net = subtotal + tax - discount;

    // Get store from branch
    let storeId: string | null = null;
    if (branchId) {
      try {
        const store = await this.storeService.findByBranchId(branchId);
        storeId = store.id;
      } catch (error) {
        // If store not found, continue without store-specific stock tracking
        // This maintains backward compatibility
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Get store for stock validation and operations
      let store: any = null;
      if (branchId) {
        try {
          store = await tx.store.findFirst({
            where: { branchId },
          });
        } catch (error) {
          // Store not found, skip store-specific operations
        }
      }

      // Validate stock availability for STOCKED items only (skip SERVICE items)
      // Skip validation if allowInsufficientStock is true
      if (!data.allowInsufficientStock && store) {
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code: item.id },
          });
          if (!itemRecord) {
            throwHttp(
              404,
              ERROR_CODES.INV_ITEM_NOT_FOUND,
              `Item ${item.id} not found`,
            );
          }
          // Only validate stock for STOCKED items, SERVICE items don't have stock
          if ((itemRecord as any).type === 'STOCKED') {
            const balance = await this.stockService.getStoreItemBalance(
              store.id,
              itemRecord.id,
              tx,
            );
            if (balance < item.qty) {
              throwHttp(
                409,
                ERROR_CODES.INV_STOCK_INSUFFICIENT,
                `Insufficient stock for item ${itemRecord.name}. Available: ${balance}, Requested: ${item.qty}`,
              );
            }
          }
        }
      }

      // Only persist safe/bank links for CASH invoices
      const safeId =
        data.paymentMethod === 'cash' &&
        data.paymentTargetType === 'safe' &&
        branchId
          ? (
              await tx.safe.findFirst({
                where: { branchId },
              })
            )?.id || null
          : null;
      const bankId =
        data.paymentMethod === 'cash' && data.paymentTargetType === 'bank'
          ? data.paymentTargetId || null
          : null;

      const created = await tx.salesInvoice.create({
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
          // For credit invoices, do not persist any payment target metadata
          paymentTargetType:
            data.paymentMethod === 'cash' ? data.paymentTargetType : null,
          paymentTargetId:
            data.paymentMethod === 'cash' ? data.paymentTargetId : null,
          safeId,
          bankId,
          notes: data.notes,
          userId,
          branchId,
        },
        include: {
          customer: {
            select: { id: true, name: true, code: true },
          },
          user: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          safe: { select: { id: true, name: true } },
          bank: { select: { id: true, name: true } },
        },
      });

      // Validate and track stock directly (only for STOCKED items)
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

        // Validate stock for STOCKED items (stock will be tracked via SalesInvoice items in StockService)
        for (const { item, itemRecord } of stockedItems) {
          await this.stockService.validateAndDecreaseStock(
            store.id,
            itemRecord.id,
            item.qty,
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
              data: { stock: { decrement: item.qty } },
            });
          }
        }
      }

      // Apply cash impact if applicable
      if (data.paymentMethod === 'cash' && data.paymentTargetType) {
        await AccountingService.applyImpact({
          kind: 'sales-invoice',
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

      // Update customer balance for credit sales (customer owes more)
      if (data.paymentMethod === 'credit' && data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { currentBalance: { increment: net } },
        });
      }

      return created;
    });

    return this.mapToResponse(result);
  }

  async findAll(search?: string): Promise<SalesInvoiceResponse[]> {
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

    const salesInvoices = await this.prisma.salesInvoice.findMany({
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
        safe: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return salesInvoices.map((invoice) => this.mapToResponse(invoice));
  }

  async findOne(id: string): Promise<SalesInvoiceResponse> {
    const salesInvoice = await this.prisma.salesInvoice.findUnique({
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
        safe: { select: { id: true, name: true } },
        bank: { select: { id: true, name: true } },
      },
    });

    if (!salesInvoice) {
      throw new NotFoundException('Sales invoice not found');
    }

    return this.mapToResponse(salesInvoice);
  }

  async update(
    id: string,
    data: UpdateSalesInvoiceRequest,
    userId: string,
  ): Promise<SalesInvoiceResponse> {
    try {
      const { allowInsufficientStock, ...persistableData } = data as any;
      // Validate base fields
      const incomingItems = data.items;
      if (incomingItems && incomingItems.length === 0) {
        throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
      }
      if (data.paymentMethod) {
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
      }
      // Get existing invoice to restore stock
      const existingInvoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
      });
      // Customer is only required for credit payments
      // If payment method is credit (or being changed to credit), customer must be provided
      const paymentMethod =
        data.paymentMethod || existingInvoice?.paymentMethod;
      if (paymentMethod === 'credit' && data.customerId === null) {
        throwHttp(
          422,
          ERROR_CODES.INV_CUSTOMER_REQUIRED,
          'Customer is required for credit payments',
        );
      }

      if (existingInvoice) {
        // Restore stock for old items
        await this.updateStockForItems(
          existingInvoice.items as any[],
          'increase',
        );
      }

      // Calculate new totals
      const rawItems = data.items || (existingInvoice?.items as any[]) || [];
      const discount =
        data.discount !== undefined
          ? data.discount
          : existingInvoice?.discount || 0;

      // Get company VAT settings
      const company = await this.prisma.company.findFirst();
      const vatRate = company?.vatRate || 0;
      const isVatEnabled = company?.isVatEnabled || false;

      let subtotal = 0;
      let tax = 0;
      const itemsWithTotals = rawItems.map((item) => {
        const {
          net: lineNet,
          taxAmount,
          total,
        } = this.computeLineTotals(item, vatRate, isVatEnabled);
        subtotal += lineNet;
        tax += taxAmount;
        return {
          ...item,
          salePriceIncludesTax: item.salePriceIncludesTax ?? false,
          taxAmount,
          total,
        };
      });

      const net = subtotal + tax - discount;

      const normalizedDate = data.date
        ? new Date(data.date)
        : existingInvoice?.date || new Date();
      const updated = await this.prisma.$transaction(async (tx) => {
        // Restore stock for old items (only for STOCKED items, SERVICE items don't have stock)
        if (existingInvoice) {
          for (const oldItem of (existingInvoice.items as any[]) || []) {
            const oldItemRecord = await tx.item.findUnique({
              where: { code: oldItem.id },
            });
            if (oldItemRecord && (oldItemRecord as any).type === 'STOCKED') {
              await tx.item.update({
                where: { code: oldItem.id },
                data: { stock: { increment: oldItem.qty } },
              });
            }
          }
        }

        // Validate stock for new items (only for STOCKED items, skip SERVICE items)
        // Skip validation if allowInsufficientStock is true
        if (!allowInsufficientStock) {
          for (const item of itemsWithTotals) {
            const itemRecord = await tx.item.findUnique({
              where: { code: item.id },
            });
            if (!itemRecord) {
              throwHttp(
                404,
                ERROR_CODES.INV_ITEM_NOT_FOUND,
                `Item ${item.id} not found`,
              );
            }
            // Only validate stock for STOCKED items, SERVICE items don't have stock
            if (
              (itemRecord as any).type === 'STOCKED' &&
              itemRecord.stock < item.qty
            ) {
              throwHttp(
                409,
                ERROR_CODES.INV_STOCK_INSUFFICIENT,
                `Insufficient stock for item ${itemRecord.name}`,
              );
            }
          }
        }

        const nextPaymentMethod =
          data.paymentMethod ?? existingInvoice?.paymentMethod;
        const nextPaymentTargetType =
          data.paymentTargetType !== undefined
            ? data.paymentTargetType
            : existingInvoice?.paymentTargetType ?? null;
        const nextPaymentTargetId =
          data.paymentTargetId !== undefined
            ? data.paymentTargetId
            : existingInvoice?.paymentTargetId ?? null;
        const branchIdForInvoice = existingInvoice?.branchId ?? null;

        // Only persist safe/bank links for CASH invoices
        const safeId =
          nextPaymentMethod === 'cash' &&
          nextPaymentTargetType === 'safe' &&
          branchIdForInvoice
            ? await this.findSafeId(branchIdForInvoice, tx)
            : null;
        const bankId =
          nextPaymentMethod === 'cash' && nextPaymentTargetType === 'bank'
            ? nextPaymentTargetId ?? null
            : null;

        const inv = await tx.salesInvoice.update({
          where: { id },
          data: {
            ...persistableData,
            date: normalizedDate,
            items: itemsWithTotals,
            subtotal,
            discount,
            tax,
            net,
            userId,
            // For credit invoices, do not persist any payment target metadata
            paymentTargetType:
              nextPaymentMethod === 'cash' ? nextPaymentTargetType : null,
            paymentTargetId:
              nextPaymentMethod === 'cash' && nextPaymentTargetType
                ? nextPaymentTargetId
                : null,
            safeId,
            bankId,
          },
          include: {
            customer: { select: { id: true, name: true, code: true } },
            user: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
            safe: { select: { id: true, name: true } },
            bank: { select: { id: true, name: true } },
          },
        });

        // Decrease stock for new items (only for STOCKED items, SERVICE items don't have stock)
        for (const item of itemsWithTotals) {
          const itemRecord = await tx.item.findUnique({
            where: { code: item.id },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
            await tx.item.update({
              where: { code: item.id },
              data: { stock: { decrement: item.qty } },
            });
          }
        }

        // Reverse previous cash impact if needed
        if (
          existingInvoice?.paymentMethod === 'cash' &&
          existingInvoice.paymentTargetType
        ) {
          await AccountingService.reverseImpact({
            kind: 'sales-invoice',
            amount: (existingInvoice as any).net,
            paymentTargetType: existingInvoice.paymentTargetType as any,
            branchId: (existingInvoice as any).branchId,
            bankId:
              existingInvoice.paymentTargetType === 'bank'
                ? (existingInvoice as any).paymentTargetId
                : null,
            tx,
          });
        }
        // Reverse previous customer balance update if needed
        if (existingInvoice?.paymentMethod === 'credit' && existingInvoice.customerId) {
          await tx.customer.update({
            where: { id: existingInvoice.customerId },
            data: { currentBalance: { decrement: (existingInvoice as any).net } },
          });
        }
        // Apply new cash impact if applicable
        const targetType =
          (inv as any).paymentMethod === 'cash'
            ? (inv as any).paymentTargetType
            : null;
        if (targetType) {
          await AccountingService.applyImpact({
            kind: 'sales-invoice',
            amount: (inv as any).net,
            paymentTargetType: targetType,
            branchId: (inv as any).branchId,
            bankId: targetType === 'bank' ? (inv as any).paymentTargetId : null,
            tx,
          });
        }
        // Apply new customer balance update if applicable
        if ((inv as any).paymentMethod === 'credit' && (inv as any).customerId) {
          await tx.customer.update({
            where: { id: (inv as any).customerId },
            data: { currentBalance: { increment: (inv as any).net } },
          });
        }

        return inv;
      });

      return this.mapToResponse(updated);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Sales invoice not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Get invoice to restore stock
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
      });

      if (invoice) {
        // Restore stock
        await this.updateStockForItems(invoice.items as any[], 'increase');

        // Reverse cash impact if applicable
        if (
          (invoice as any).paymentMethod === 'cash' &&
          (invoice as any).paymentTargetType
        ) {
          await this.prisma.$transaction(async (tx) => {
            await AccountingService.reverseImpact({
              kind: 'sales-invoice',
              amount: (invoice as any).net,
              paymentTargetType: (invoice as any).paymentTargetType,
              branchId: (invoice as any).branchId,
              bankId:
                (invoice as any).paymentTargetType === 'bank'
                  ? (invoice as any).paymentTargetId
                  : null,
              tx,
            });
          });
        }
        // Reverse customer balance update if applicable
        if ((invoice as any).paymentMethod === 'credit' && (invoice as any).customerId) {
          await this.prisma.customer.update({
            where: { id: (invoice as any).customerId },
            data: { currentBalance: { decrement: (invoice as any).net } },
          });
        }
      }

      await this.prisma.salesInvoice.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Sales invoice not found');
    }
  }

  private async generateNextCode(): Promise<string> {
    const lastInvoice = await this.prisma.salesInvoice.findFirst({
      orderBy: { code: 'desc' },
    });

    if (!lastInvoice) {
      return 'INV-00001';
    }

    const match = lastInvoice.code.match(/INV-(\d+)/);
    if (!match) {
      return 'INV-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `INV-${String(nextNumber).padStart(5, '0')}`;
  }

  private async updateStockForItems(
    items: any[],
    operation: 'increase' | 'decrease',
  ): Promise<void> {
    for (const item of items) {
      const itemRecord = await this.prisma.item.findUnique({
        where: { code: item.id },
      });
      // Only update stock for STOCKED items, SERVICE items don't have stock
      if (itemRecord && (itemRecord as any).type === 'STOCKED') {
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
  }

  private async findSafeId(
    branchId?: string | null,
    tx: any = this.prisma,
  ): Promise<string | null> {
    if (!branchId) {
      return null;
    }
    const safe = await tx.safe.findFirst({
      where: { branchId },
    });
    return safe?.id ?? null;
  }

  private mapToResponse(salesInvoice: any): SalesInvoiceResponse {
    return {
      id: salesInvoice.id,
      code: salesInvoice.code,
      date: salesInvoice.date,
      customerId: salesInvoice.customerId,
      customer: salesInvoice.customer,
      items: salesInvoice.items,
      subtotal: salesInvoice.subtotal,
      discount: salesInvoice.discount,
      tax: salesInvoice.tax,
      net: salesInvoice.net,
      paymentMethod: salesInvoice.paymentMethod,
      paymentTargetType: salesInvoice.paymentTargetType,
      paymentTargetId: salesInvoice.paymentTargetId,
      safeId: salesInvoice.safeId,
      safe: salesInvoice.safe,
      bankId: salesInvoice.bankId,
      bank: salesInvoice.bank,
      notes: salesInvoice.notes,
      userId: salesInvoice.userId,
      user: salesInvoice.user,
      branchId: salesInvoice.branchId,
      branch: salesInvoice.branch,
      createdAt: salesInvoice.createdAt,
      updatedAt: salesInvoice.updatedAt,
    };
  }
}
