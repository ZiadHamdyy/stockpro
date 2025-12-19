import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSalesInvoiceRequest } from './dtos/request/create-sales-invoice.request';
import { UpdateSalesInvoiceRequest } from './dtos/request/update-sales-invoice.request';
import { SalesInvoiceResponse } from './dtos/response/sales-invoice.response';
import { AccountingService } from '../../common/services/accounting.service';
import { StoreService } from '../store/store.service';
import { StockService } from '../store/services/stock.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { ZatcaService } from '../zatca/zatca.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SalesInvoiceService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
    private readonly auditLogService: AuditLogService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
    private readonly zatcaService: ZatcaService,
    private readonly configService: ConfigService,
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
    companyId: string,
    data: CreateSalesInvoiceRequest,
    userId: string,
    branchId?: string,
  ): Promise<SalesInvoiceResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'invoicesPerMonth');

    const invoiceDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, invoiceDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('Cannot create invoice: no open fiscal period exists for this date');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoiceDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('Cannot create invoice in a closed fiscal period');
    }

    // Basic validations
    // Customer is only required for credit payments
    if (data.paymentMethod === 'credit' && !data.customerId) {
      throwHttp(422, ERROR_CODES.INV_CUSTOMER_REQUIRED, 'Customer is required');
    }
    if (!data.items || data.items.length === 0) {
      throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
    }
    if (data.paymentMethod === 'cash') {
      // Validate split payment if enabled
      if (data.isSplitPayment) {
        if (!data.splitSafeId || !data.splitBankId) {
          throwHttp(
            422,
            ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
            'Safe and bank are required for split payments',
          );
        }
        if (
          data.splitCashAmount === undefined ||
          data.splitBankAmount === undefined
        ) {
          throwHttp(
            422,
            ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
            'Split amounts are required for split payments',
          );
        }
      } else {
        // Regular payment validation
        if (!data.paymentTargetType || !data.paymentTargetId) {
          throwHttp(
            422,
            ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
            'Safe or bank is required for cash payments',
          );
        }
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

    const code = await this.generateNextCode(companyId);

    // Get company VAT settings
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
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

    // Validate split payment amounts if enabled
    if (data.paymentMethod === 'cash' && data.isSplitPayment) {
      const totalSplit =
        (data.splitCashAmount || 0) + (data.splitBankAmount || 0);
      if (Math.abs(totalSplit - net) > 0.01) {
        throwHttp(
          422,
          ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
          `Split amounts (${totalSplit}) must equal net total (${net})`,
        );
      }
    }

    // Get store from branch
    let storeId: string | null = null;
    if (branchId) {
      try {
        const store = await this.storeService.findByBranchId(companyId, branchId);
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
          store = await tx.store.findUnique({
            where: { branchId },
          });
          if (store && store.companyId !== companyId) {
            store = null;
          }
        } catch (error) {
          // Store not found, skip store-specific operations
        }
      }

      // Validate stock availability for STOCKED items only (skip SERVICE items)
      // Skip validation if allowInsufficientStock is true
      if (!data.allowInsufficientStock && store) {
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code_companyId: { code: item.id, companyId } },
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
            // Ensure balance is not negative (shouldn't happen, but safety check)
            const availableBalance = Math.max(0, balance);
            if (availableBalance < item.qty) {
              throwHttp(
                409,
                ERROR_CODES.INV_STOCK_INSUFFICIENT,
                `Insufficient stock for item ${itemRecord.name}. Available: ${availableBalance}, Requested: ${item.qty}`,
              );
            }
          }
        }
      }

      // Only persist safe/bank links for CASH invoices
      let safeId: string | null = null;
      let bankId: string | null = null;

      if (data.paymentMethod === 'cash') {
        if (data.isSplitPayment) {
          // For split payments, use splitSafeId and splitBankId
          safeId = data.splitSafeId || null;
          bankId = data.splitBankId || null;
        } else {
          // Regular payment logic
          safeId =
            data.paymentTargetType === 'safe' && branchId
              ? (
                  await tx.safe.findUnique({
                    where: { branchId },
                  })
                )?.id || null
              : null;
          bankId =
            data.paymentTargetType === 'bank'
              ? data.paymentTargetId || null
              : null;
        }
      }

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
            data.paymentMethod === 'cash' && !data.isSplitPayment
              ? data.paymentTargetType
              : null,
          paymentTargetId:
            data.paymentMethod === 'cash' && !data.isSplitPayment
              ? data.paymentTargetId
              : null,
          safeId,
          bankId,
          bankTransactionType:
            data.paymentMethod === 'cash' ? data.bankTransactionType : undefined,
          isSplitPayment:
            data.paymentMethod === 'cash' ? data.isSplitPayment || false : false,
          splitCashAmount:
            data.paymentMethod === 'cash' && data.isSplitPayment
              ? data.splitCashAmount
              : null,
          splitBankAmount:
            data.paymentMethod === 'cash' && data.isSplitPayment
              ? data.splitBankAmount
              : null,
          splitSafeId:
            data.paymentMethod === 'cash' && data.isSplitPayment
              ? data.splitSafeId
              : null,
          splitBankId:
            data.paymentMethod === 'cash' && data.isSplitPayment
              ? data.splitBankId
              : null,
          notes: data.notes,
          userId,
          branchId,
          companyId,
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

      // Stock for store-aware flows is derived from aggregated movements in StockService.
      // We already validated sufficient stock BEFORE creating the invoice (lines 186–215)
      // using getStoreItemBalance, so no further per-item validation is needed here when a store exists.
      // For legacy flows without a store, we continue to update the global item.stock field.
      if (!store) {
        // Fallback: Update global stock if store not found (backward compatibility)
        for (const item of data.items) {
          const itemRecord = await tx.item.findUnique({
            where: { code_companyId: { code: item.id, companyId } },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
              await tx.item.update({
                where: { code_companyId: { code: item.id, companyId } },
              data: { stock: { decrement: item.qty } },
            });
          }
        }
      }

      // Apply cash impact if applicable
      if (data.paymentMethod === 'cash') {
        if (data.isSplitPayment) {
          // Apply impact to safe (cash portion)
          if (data.splitCashAmount && data.splitCashAmount > 0) {
            if (!data.splitSafeId) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Safe ID is required for split payment cash portion',
              );
            }
            await AccountingService.applyImpact({
              kind: 'sales-invoice',
              amount: data.splitCashAmount,
              paymentTargetType: 'safe' as any,
              branchId,
              safeId: data.splitSafeId,
              bankId: null,
              tx,
            });
          }
          // Apply impact to bank (bank portion)
          if (data.splitBankAmount && data.splitBankAmount > 0) {
            if (!data.splitBankId) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Bank ID is required for split payment bank portion',
              );
            }
            await AccountingService.applyImpact({
              kind: 'sales-invoice',
              amount: data.splitBankAmount,
              paymentTargetType: 'bank' as any,
              branchId,
              safeId: null,
              bankId: data.splitBankId,
              tx,
            });
          }
        } else if (data.paymentTargetType) {
          // Regular payment
          if (data.paymentTargetType === 'safe') {
            // For safe, use the resolved safeId (or branchId as fallback)
            await AccountingService.applyImpact({
              kind: 'sales-invoice',
              amount: net,
              paymentTargetType: 'safe' as any,
              branchId,
              safeId: safeId || null,
              bankId: null,
              tx,
            });
          } else if (data.paymentTargetType === 'bank') {
            // For bank, use the resolved bankId
            if (!bankId) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Bank ID is required for bank payments',
              );
            }
            await AccountingService.applyImpact({
              kind: 'sales-invoice',
              amount: net,
              paymentTargetType: 'bank' as any,
              branchId,
              safeId: null,
              bankId: bankId,
              tx,
            });
          }
        }
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

    const response = this.mapToResponse(result);

    // Create audit log
    await this.auditLogService.createAuditLog({
      companyId,
      userId: result.userId,
      branchId: result.branchId || undefined,
      action: 'create',
      targetType: 'sales_invoice',
      targetId: result.code,
      details: `إنشاء فاتورة مبيعات رقم ${result.code} بقيمة ${result.net} ريال`,
    });

    // Process for ZATCA if VAT is enabled
    if (company?.isVatEnabled) {
      try {
        // Process invoice for ZATCA (generate UUID, sequential number, XML, hash)
        await this.zatcaService.processInvoiceForZatca(result.id);

        // Auto-submit to ZATCA if configured
        const autoSubmit = this.configService.get<string>('ZATCA_AUTO_SUBMIT') === 'true';
        if (autoSubmit) {
          // Submit asynchronously to avoid blocking the response
          this.zatcaService.submitToZatca(result.id).catch((error) => {
            // Log error but don't fail the invoice creation
            console.error('Failed to auto-submit invoice to ZATCA:', error);
          });
        }
      } catch (error: any) {
        // Log error but don't fail the invoice creation
        // ZATCA processing can be done manually later
        console.error('Failed to process invoice for ZATCA:', error);
      }
    }

    return response;
  }

  async findAll(companyId: string, search?: string): Promise<SalesInvoiceResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' as const },
            companyId, // Ensure customer belongs to the same company
          },
        },
      ];
    }

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

  async findOne(companyId: string, id: string): Promise<SalesInvoiceResponse> {
    const salesInvoice = await this.prisma.salesInvoice.findUnique({
      where: { id_companyId: { id, companyId } },
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
    companyId: string,
    id: string,
    data: UpdateSalesInvoiceRequest,
    userId: string,
  ): Promise<SalesInvoiceResponse> {
    // Verify the invoice belongs to the company
    await this.findOne(companyId, id);
    try {
      const { allowInsufficientStock, ...persistableData } = data as any;
      // Validate base fields
      const incomingItems = data.items;
      if (incomingItems && incomingItems.length === 0) {
        throwHttp(422, ERROR_CODES.INV_ITEMS_REQUIRED, 'Items are required');
      }
      if (data.paymentMethod) {
        if (data.paymentMethod === 'cash') {
          // Validate split payment if enabled
          if (data.isSplitPayment) {
            if (!data.splitSafeId || !data.splitBankId) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Safe and bank are required for split payments',
              );
            }
            if (
              data.splitCashAmount === undefined ||
              data.splitBankAmount === undefined
            ) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Split amounts are required for split payments',
              );
            }
          } else {
            // Regular payment validation
            if (!data.paymentTargetType || !data.paymentTargetId) {
              throwHttp(
                422,
                ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                'Safe or bank is required for cash payments',
              );
            }
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

      if (!existingInvoice) {
        throw new NotFoundException('Sales invoice not found');
      }

      // Check if date is in a closed period (use new date if provided, otherwise existing date)
      const invoiceDate = data.date ? new Date(data.date) : existingInvoice.date;
      
      // If date is being changed, validate it's in an open period
      if (data.date) {
        const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, invoiceDate);
        if (!hasOpenPeriod) {
          throw new ForbiddenException('لا يمكن تعديل الفاتورة: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
        }
      }
      
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoiceDate);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن تعديل الفاتورة: الفترة المحاسبية مغلقة');
      }

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
          companyId,
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

      // Get company VAT settings - use findFirstCompany for transaction context
      const company = await this.prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
      });
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
              where: { code_companyId: { code: oldItem.id, companyId } },
            });
            if (oldItemRecord && (oldItemRecord as any).type === 'STOCKED') {
              await tx.item.update({
                where: { code_companyId: { code: oldItem.id, companyId } },
                data: { stock: { increment: oldItem.qty } },
              });
            }
          }
        }

        // Get store for stock validation (same as create method)
        let storeForUpdate: any = null;
        const branchIdForInvoice = existingInvoice?.branchId ?? null;
        if (branchIdForInvoice) {
          try {
            storeForUpdate = await tx.store.findUnique({
              where: { branchId: branchIdForInvoice },
            });
          } catch (error) {
            // Store not found, skip store-specific validation
          }
        }

        // Validate stock for new items (only for STOCKED items, skip SERVICE items)
        // Skip validation if allowInsufficientStock is true
        if (!allowInsufficientStock) {
          for (const item of itemsWithTotals) {
            const itemRecord = await tx.item.findUnique({
              where: { code_companyId: { code: item.id, companyId } },
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
              if (storeForUpdate) {
                // Use store-specific balance calculation (exclude the invoice being updated)
                const balance = await this.stockService.getStoreItemBalance(
                  storeForUpdate.id,
                  itemRecord.id,
                  tx,
                  id, // Exclude this invoice from balance calculation
                );
                const availableBalance = Math.max(0, balance);
                if (availableBalance < item.qty) {
                  throwHttp(
                    409,
                    ERROR_CODES.INV_STOCK_INSUFFICIENT,
                    `Insufficient stock for item ${itemRecord.name}. Available: ${availableBalance}, Requested: ${item.qty}`,
                  );
                }
              } else {
                // Fallback to global stock for backward compatibility
                if (itemRecord.stock < item.qty) {
                  throwHttp(
                    409,
                    ERROR_CODES.INV_STOCK_INSUFFICIENT,
                    `Insufficient stock for item ${itemRecord.name}`,
                  );
                }
              }
            }
          }
        }

        const nextPaymentMethod =
          data.paymentMethod ?? existingInvoice?.paymentMethod;
        const nextPaymentTargetType =
          data.paymentTargetType !== undefined
            ? data.paymentTargetType
            : (existingInvoice?.paymentTargetType ?? null);
        const nextPaymentTargetId =
          data.paymentTargetId !== undefined
            ? data.paymentTargetId
            : (existingInvoice?.paymentTargetId ?? null);

        // Only persist safe/bank links for CASH invoices
        const nextIsSplitPayment =
          data.isSplitPayment !== undefined
            ? data.isSplitPayment
            : (existingInvoice as any)?.isSplitPayment || false;

        let safeId: string | null = null;
        let bankId: string | null = null;

        if (nextPaymentMethod === 'cash') {
          if (nextIsSplitPayment) {
            // For split payments, use splitSafeId and splitBankId
            safeId = data.splitSafeId || (existingInvoice as any)?.splitSafeId || null;
            bankId = data.splitBankId || (existingInvoice as any)?.splitBankId || null;
          } else {
            // Regular payment logic
            safeId =
              nextPaymentTargetType === 'safe' && branchIdForInvoice
                ? await this.findSafeId(branchIdForInvoice, tx)
                : null;
            bankId =
              nextPaymentTargetType === 'bank'
                ? (nextPaymentTargetId ?? null)
                : null;
          }
        }

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
              nextPaymentMethod === 'cash' && !nextIsSplitPayment
                ? nextPaymentTargetType
                : null,
            paymentTargetId:
              nextPaymentMethod === 'cash' && !nextIsSplitPayment && nextPaymentTargetType
                ? nextPaymentTargetId
                : null,
            safeId,
            bankId,
            bankTransactionType:
              nextPaymentMethod === 'cash'
                ? (data.bankTransactionType !== undefined
                    ? data.bankTransactionType
                    : (existingInvoice as any)?.bankTransactionType || undefined)
                : undefined,
            isSplitPayment:
              nextPaymentMethod === 'cash' ? nextIsSplitPayment : false,
            splitCashAmount:
              nextPaymentMethod === 'cash' && nextIsSplitPayment
                ? (data.splitCashAmount !== undefined
                    ? data.splitCashAmount
                    : (existingInvoice as any)?.splitCashAmount || null)
                : null,
            splitBankAmount:
              nextPaymentMethod === 'cash' && nextIsSplitPayment
                ? (data.splitBankAmount !== undefined
                    ? data.splitBankAmount
                    : (existingInvoice as any)?.splitBankAmount || null)
                : null,
            splitSafeId:
              nextPaymentMethod === 'cash' && nextIsSplitPayment
                ? (data.splitSafeId || (existingInvoice as any)?.splitSafeId || null)
                : null,
            splitBankId:
              nextPaymentMethod === 'cash' && nextIsSplitPayment
                ? (data.splitBankId || (existingInvoice as any)?.splitBankId || null)
                : null,
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
            where: { code_companyId: { code: item.id, companyId } },
          });
          if (itemRecord && (itemRecord as any).type === 'STOCKED') {
              await tx.item.update({
                where: { code_companyId: { code: item.id, companyId } },
              data: { stock: { decrement: item.qty } },
            });
          }
        }

        // Reverse previous cash impact if needed
        if (existingInvoice?.paymentMethod === 'cash') {
          if ((existingInvoice as any).isSplitPayment) {
            // Reverse split payment impacts
            if (
              (existingInvoice as any).splitCashAmount &&
              (existingInvoice as any).splitCashAmount > 0 &&
              (existingInvoice as any).splitSafeId
            ) {
              await AccountingService.reverseImpact({
                kind: 'sales-invoice',
                amount: (existingInvoice as any).splitCashAmount,
                paymentTargetType: 'safe' as any,
                branchId: (existingInvoice as any).branchId,
                safeId: (existingInvoice as any).splitSafeId,
                bankId: null,
                tx,
              });
            }
            if (
              (existingInvoice as any).splitBankAmount &&
              (existingInvoice as any).splitBankAmount > 0 &&
              (existingInvoice as any).splitBankId
            ) {
              await AccountingService.reverseImpact({
                kind: 'sales-invoice',
                amount: (existingInvoice as any).splitBankAmount,
                paymentTargetType: 'bank' as any,
                branchId: (existingInvoice as any).branchId,
                safeId: null,
                bankId: (existingInvoice as any).splitBankId,
                tx,
              });
            }
          } else if (existingInvoice.paymentTargetType) {
            // Reverse regular payment impact
            await AccountingService.reverseImpact({
              kind: 'sales-invoice',
              amount: (existingInvoice as any).net,
              paymentTargetType: existingInvoice.paymentTargetType as any,
              branchId: (existingInvoice as any).branchId,
              safeId: (existingInvoice as any).safeId || null,
              bankId:
                existingInvoice.paymentTargetType === 'bank'
                  ? (existingInvoice as any).bankId || (existingInvoice as any).paymentTargetId
                  : null,
              tx,
            });
          }
        }
        // Reverse previous customer balance update if needed
        if (
          existingInvoice?.paymentMethod === 'credit' &&
          existingInvoice.customerId
        ) {
          await tx.customer.update({
            where: { id: existingInvoice.customerId },
            data: {
              currentBalance: { decrement: (existingInvoice as any).net },
            },
          });
        }
        // Apply new cash impact if applicable
        if ((inv as any).paymentMethod === 'cash') {
          if ((inv as any).isSplitPayment) {
            // Apply split payment impacts
            if (
              (inv as any).splitCashAmount &&
              (inv as any).splitCashAmount > 0 &&
              (inv as any).splitSafeId
            ) {
              await AccountingService.applyImpact({
                kind: 'sales-invoice',
                amount: (inv as any).splitCashAmount,
                paymentTargetType: 'safe' as any,
                branchId: (inv as any).branchId,
                safeId: (inv as any).splitSafeId,
                bankId: null,
                tx,
              });
            }
            if (
              (inv as any).splitBankAmount &&
              (inv as any).splitBankAmount > 0 &&
              (inv as any).splitBankId
            ) {
              await AccountingService.applyImpact({
                kind: 'sales-invoice',
                amount: (inv as any).splitBankAmount,
                paymentTargetType: 'bank' as any,
                branchId: (inv as any).branchId,
                safeId: null,
                bankId: (inv as any).splitBankId,
                tx,
              });
            }
          } else if ((inv as any).paymentTargetType) {
            // Apply regular payment impact
            const targetType = (inv as any).paymentTargetType;
            if (targetType === 'safe') {
              await AccountingService.applyImpact({
                kind: 'sales-invoice',
                amount: (inv as any).net,
                paymentTargetType: 'safe' as any,
                branchId: (inv as any).branchId,
                safeId: (inv as any).safeId || null,
                bankId: null,
                tx,
              });
            } else if (targetType === 'bank') {
              if (!(inv as any).bankId) {
                throwHttp(
                  422,
                  ERROR_CODES.INV_PAYMENT_ACCOUNT_REQUIRED,
                  'Bank ID is required for bank payments',
                );
              }
              await AccountingService.applyImpact({
                kind: 'sales-invoice',
                amount: (inv as any).net,
                paymentTargetType: 'bank' as any,
                branchId: (inv as any).branchId,
                safeId: null,
                bankId: (inv as any).bankId,
                tx,
              });
            }
          }
        }
        // Apply new customer balance update if applicable
        if (
          (inv as any).paymentMethod === 'credit' &&
          (inv as any).customerId
        ) {
          await tx.customer.update({
            where: { id: (inv as any).customerId },
            data: { currentBalance: { increment: (inv as any).net } },
          });
        }

        return inv;
      });

      const response = this.mapToResponse(updated);

      // Create audit log
      await this.auditLogService.createAuditLog({
        companyId,
        userId: updated.userId,
        branchId: updated.branchId || undefined,
        action: 'update',
        targetType: 'sales_invoice',
        targetId: updated.code,
        details: `تعديل فاتورة مبيعات رقم ${updated.code}`,
      });

      return response;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Sales invoice not found');
      }
      throw error;
    }
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the invoice belongs to the company
    await this.findOne(companyId, id);
    try {
      // Get invoice to restore stock
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        throw new NotFoundException('Sales invoice not found');
      }

      // Check if invoice date is in a closed period
      const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, invoice.date);
      if (isInClosedPeriod) {
        throw new ForbiddenException('لا يمكن حذف الفاتورة: الفترة المحاسبية مغلقة');
      }

      if (invoice) {
        // Restore stock
        await this.updateStockForItems(companyId, invoice.items as any[], 'increase');

        // Reverse cash impact if applicable
        if ((invoice as any).paymentMethod === 'cash') {
          await this.prisma.$transaction(async (tx) => {
            if ((invoice as any).isSplitPayment) {
              // Reverse split payment impacts
              if (
                (invoice as any).splitCashAmount &&
                (invoice as any).splitCashAmount > 0 &&
                (invoice as any).splitSafeId
              ) {
                await AccountingService.reverseImpact({
                  kind: 'sales-invoice',
                  amount: (invoice as any).splitCashAmount,
                  paymentTargetType: 'safe' as any,
                  branchId: (invoice as any).branchId,
                  safeId: (invoice as any).splitSafeId,
                  bankId: null,
                  tx,
                });
              }
              if (
                (invoice as any).splitBankAmount &&
                (invoice as any).splitBankAmount > 0 &&
                (invoice as any).splitBankId
              ) {
                await AccountingService.reverseImpact({
                  kind: 'sales-invoice',
                  amount: (invoice as any).splitBankAmount,
                  paymentTargetType: 'bank' as any,
                  branchId: (invoice as any).branchId,
                  safeId: null,
                  bankId: (invoice as any).splitBankId,
                  tx,
                });
              }
            } else if ((invoice as any).paymentTargetType) {
              // Reverse regular payment impact
              await AccountingService.reverseImpact({
                kind: 'sales-invoice',
                amount: (invoice as any).net,
                paymentTargetType: (invoice as any).paymentTargetType,
                branchId: (invoice as any).branchId,
                safeId: (invoice as any).safeId || null,
                bankId:
                  (invoice as any).paymentTargetType === 'bank'
                    ? (invoice as any).bankId || (invoice as any).paymentTargetId
                    : null,
                tx,
              });
            }
          });
        }
        // Reverse customer balance update if applicable
        if (
          (invoice as any).paymentMethod === 'credit' &&
          (invoice as any).customerId
        ) {
          await this.prisma.customer.update({
            where: { id: (invoice as any).customerId },
            data: { currentBalance: { decrement: (invoice as any).net } },
          });
        }
      }

      const deleted = await this.prisma.salesInvoice.delete({
        where: { id },
      });

      // Create audit log
      if (invoice) {
        await this.auditLogService.createAuditLog({
          companyId,
          userId: invoice.userId,
          branchId: invoice.branchId || undefined,
          action: 'delete',
          targetType: 'sales_invoice',
          targetId: invoice.code,
          details: `حذف فاتورة مبيعات رقم ${invoice.code}`,
        });
      }
    } catch (error) {
      throw new NotFoundException('Sales invoice not found');
    }
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastInvoice = await this.prisma.salesInvoice.findFirst({
      where: { companyId },
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
    companyId: string,
    items: any[],
    operation: 'increase' | 'decrease',
  ): Promise<void> {
    for (const item of items) {
      const itemRecord = await this.prisma.item.findUnique({
        where: { code_companyId: { code: item.id, companyId } },
      });
      // Only update stock for STOCKED items, SERVICE items don't have stock
      if (itemRecord && (itemRecord as any).type === 'STOCKED') {
        await this.prisma.item.update({
          where: { code_companyId: { code: item.id, companyId } },
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
    const safe = await tx.safe.findUnique({
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
      bankTransactionType: salesInvoice.bankTransactionType,
      isSplitPayment: salesInvoice.isSplitPayment,
      splitCashAmount: salesInvoice.splitCashAmount,
      splitBankAmount: salesInvoice.splitBankAmount,
      splitSafeId: salesInvoice.splitSafeId,
      splitBankId: salesInvoice.splitBankId,
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
