import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePriceQuotationRequest } from './dtos/request/create-price-quotation.request';
import { UpdatePriceQuotationRequest } from './dtos/request/update-price-quotation.request';
import { PriceQuotationResponse } from './dtos/response/price-quotation.response';
import { throwHttp } from '../../common/utils/http-error';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class PriceQuotationService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(
    companyId: string,
    data: CreatePriceQuotationRequest,
    userId: string,
    branchId?: string,
  ): Promise<PriceQuotationResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'priceQuotationsPerMonth');

    if (!data.items || data.items.length === 0) {
      throwHttp(
        422,
        ERROR_CODES.QUOTATION_ITEMS_REQUIRED,
        'Quotation must contain at least one item',
      );
    }

    if (!data.totals) {
      throwHttp(
        422,
        ERROR_CODES.QUOTATION_TOTALS_REQUIRED,
        'Totals are required for quotations',
      );
    }

    // Check financial period status
    const quotationDate = data.date ? new Date(data.date) : new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, quotationDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء عرض سعر: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, quotationDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إنشاء عرض سعر: الفترة المحاسبية مغلقة');
    }

    const code = await this.generateNextCode(companyId);

    const created = await this.prisma.priceQuotation.create({
      data: {
        code,
        date: data.date ? new Date(data.date) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        customerId: data.customerId,
        customerName: data.customerName,
        notes: data.notes,
        status: data.status || 'sent',
        // Cast DTOs to JSON to satisfy Prisma's InputJsonValue type
        items: data.items as unknown as any,
        totals: data.totals as unknown as any,
        userId,
        branchId,
        companyId,
      },
      include: this.defaultInclude,
    });

    return this.mapToResponse(created);
  }

  async findAll(companyId: string, search?: string): Promise<PriceQuotationResponse[]> {
    const where: any = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' as const } },
        { status: { contains: search, mode: 'insensitive' as const } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' as const },
            companyId, // Ensure customer belongs to the same company
          },
        },
      ];
    }

    const quotations = await this.prisma.priceQuotation.findMany({
      where,
      orderBy: { date: 'asc' },
      include: this.defaultInclude,
    });

    return quotations.map((quotation) => this.mapToResponse(quotation));
  }

  async findOne(companyId: string, id: string): Promise<PriceQuotationResponse> {
    const quotation = await this.prisma.priceQuotation.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!quotation || quotation.companyId !== companyId) {
      throw new NotFoundException('Price quotation not found');
    }

    return this.mapToResponse(quotation);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdatePriceQuotationRequest,
  ): Promise<PriceQuotationResponse> {
    if (data.items && data.items.length === 0) {
      throwHttp(
        422,
        ERROR_CODES.QUOTATION_ITEMS_REQUIRED,
        'Quotation must contain at least one item',
      );
    }

    const payload: any = {};

    if (typeof data.customerId !== 'undefined') {
      payload.customerId = data.customerId || null;
    }

    if (typeof data.customerName !== 'undefined') {
      payload.customerName = data.customerName || null;
    }

    if (typeof data.date !== 'undefined') {
      payload.date = data.date ? new Date(data.date) : new Date();
    }

    if (typeof data.expiryDate !== 'undefined') {
      payload.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }

    if (typeof data.notes !== 'undefined') {
      payload.notes = data.notes;
    }

    if (typeof data.status !== 'undefined') {
      payload.status = data.status;
    }

    if (data.items) {
      payload.items = data.items;
    }

    if (data.totals) {
      payload.totals = data.totals;
    }

    try {
      const existing = await this.prisma.priceQuotation.findUnique({
        where: { id },
      });
      if (!existing || existing.companyId !== companyId) {
        throw new NotFoundException('Price quotation not found');
      }
      const updated = await this.prisma.priceQuotation.update({
        where: { id },
        data: payload,
        include: this.defaultInclude,
      });

      return this.mapToResponse(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Price quotation not found');
    }
  }

  async remove(companyId: string, id: string): Promise<void> {
    try {
      const quotation = await this.prisma.priceQuotation.findUnique({
        where: { id },
      });
      if (!quotation || quotation.companyId !== companyId) {
        throw new NotFoundException('Price quotation not found');
      }
      await this.prisma.priceQuotation.delete({ where: { id } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('Price quotation not found');
    }
  }

  private get defaultInclude() {
    return {
      customer: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    };
  }

  private mapToResponse(quotation: any): PriceQuotationResponse {
    return {
      id: quotation.id,
      code: quotation.code,
      date: quotation.date,
      expiryDate: quotation.expiryDate,
      status: quotation.status,
      notes: quotation.notes,
      items: quotation.items || [],
      totals: quotation.totals || {},
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customer: quotation.customer || null,
      userId: quotation.userId,
      user: quotation.user || null,
      branchId: quotation.branchId,
      branch: quotation.branch || null,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
    };
  }

  private async generateNextCode(companyId: string): Promise<string> {
    const lastQuotation = await this.prisma.priceQuotation.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    if (!lastQuotation) {
      return 'QUO-00001';
    }

    const match = lastQuotation.code.match(/QUO-(\d+)/);
    if (!match) {
      return 'QUO-00001';
    }

    const nextNumber = parseInt(match[1], 10) + 1;
    return `QUO-${String(nextNumber).padStart(5, '0')}`;
  }
}
