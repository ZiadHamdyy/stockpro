import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateFiscalYearRequest } from './dtos/request/create-fiscal-year.request';
import { UpdateFiscalYearRequest } from './dtos/request/update-fiscal-year.request';
import { FiscalYearResponse } from './dtos/response/fiscal-year.response';
import { IncomeStatementService } from '../income-statement/income-statement.service';

@Injectable()
export class FiscalYearService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly incomeStatementService: IncomeStatementService,
  ) {}

  async create(
    companyId: string,
    data: CreateFiscalYearRequest,
  ): Promise<FiscalYearResponse> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Validate date range
    if (startDate >= endDate) {
      throw new BadRequestException(
        'يجب أن يكون تاريخ البداية قبل تاريخ النهاية',
      );
    }

    // Validate that the fiscal year is not for a future year
    this.validateYearNotInFuture(startDate);

    // Check for overlapping periods
    await this.validateNoOverlap(companyId, startDate, endDate);

    const fiscalYear = await this.prisma.fiscalYear.create({
      data: {
        name: data.name,
        startDate,
        endDate,
        status: 'OPEN',
        companyId,
      },
    });

    return this.mapToResponse(fiscalYear);
  }

  async findAll(companyId: string): Promise<FiscalYearResponse[]> {
    const fiscalYears = await this.prisma.fiscalYear.findMany({
      where: { companyId },
      orderBy: { startDate: 'desc' },
    });

    return fiscalYears.map((fy) => this.mapToResponse(fy));
  }

  async findOne(companyId: string, id: string): Promise<FiscalYearResponse> {
    const fiscalYear = await this.prisma.fiscalYear.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year with ID ${id} not found`);
    }

    return this.mapToResponse(fiscalYear);
  }

  async update(
    companyId: string,
    id: string,
    data: UpdateFiscalYearRequest,
  ): Promise<FiscalYearResponse> {
    // Verify the fiscal year belongs to the company
    const fiscalYear = await this.findOne(companyId, id);

    // Can only update open periods
    if (fiscalYear.status === 'CLOSED') {
      throw new ForbiddenException('لا يمكن تعديل سنة مالية مغلقة');
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.startDate !== undefined || data.endDate !== undefined) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : fiscalYear.startDate;
      const endDate = data.endDate
        ? new Date(data.endDate)
        : fiscalYear.endDate;

      // Validate date range
      if (startDate >= endDate) {
        throw new BadRequestException(
          'يجب أن يكون تاريخ البداية قبل تاريخ النهاية',
        );
      }

      // Check for overlapping periods (excluding current period)
      await this.validateNoOverlap(companyId, startDate, endDate, id);

      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    const updated = await this.prisma.fiscalYear.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(updated);
  }

  async close(
    companyId: string,
    id: string,
    userId: string,
  ): Promise<FiscalYearResponse> {
    // Verify the fiscal year belongs to the company
    const fiscalYear = await this.findOne(companyId, id);

    if (fiscalYear.status === 'CLOSED') {
      throw new BadRequestException('السنة المالية مغلقة بالفعل');
    }

    // Calculate retained earnings from income statement
    const startDateStr = fiscalYear.startDate.toISOString().split('T')[0];
    const endDateStr = fiscalYear.endDate.toISOString().split('T')[0];
    const incomeStatement =
      await this.incomeStatementService.getIncomeStatement(
        companyId,
        startDateStr,
        endDateStr,
      );

    const retainedEarnings = incomeStatement.netProfit || 0;

    // Update fiscal year to closed status with retained earnings
    const updated = await this.prisma.fiscalYear.update({
      where: { id },
      data: {
        status: 'CLOSED',
        retainedEarnings,
      },
    });

    return this.mapToResponse(updated);
  }

  async reopen(
    companyId: string,
    id: string,
    userId: string,
  ): Promise<FiscalYearResponse> {
    // Verify the fiscal year belongs to the company
    const fiscalYear = await this.findOne(companyId, id);

    if (fiscalYear.status === 'OPEN') {
      throw new BadRequestException('السنة المالية مفتوحة بالفعل');
    }

    // Validate that the fiscal year is not for a future year
    this.validateYearNotInFuture(fiscalYear.startDate);

    // Reopen fiscal year (clear retained earnings)
    const updated = await this.prisma.fiscalYear.update({
      where: { id },
      data: {
        status: 'OPEN',
        retainedEarnings: null,
      },
    });

    return this.mapToResponse(updated);
  }

  /**
   * Check if a date falls within any closed period
   */
  async isDateInClosedPeriod(companyId: string, date: Date): Promise<boolean> {
    const closedPeriods = await this.prisma.fiscalYear.findMany({
      where: {
        companyId,
        status: 'CLOSED',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return closedPeriods.length > 0;
  }

  /**
   * Check if there is an open period for a given date
   */
  async hasOpenPeriodForDate(companyId: string, date: Date): Promise<boolean> {
    const openPeriods = await this.prisma.fiscalYear.findMany({
      where: {
        companyId,
        status: 'OPEN',
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    return openPeriods.length > 0;
  }

  /**
   * Get the fiscal period (and its status) for a given date
   */
  async getPeriodForDate(companyId: string, date: Date): Promise<any | null> {
    const period = await this.prisma.fiscalYear.findFirst({
      where: {
        companyId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { startDate: 'desc' },
    });

    return period;
  }

  /**
   * Get effective period for a date (handles close-open-open scenario)
   * Returns the last closed period before the date, or null if date is after all closed periods
   */
  async getEffectivePeriodForDate(companyId: string, date: Date): Promise<{
    isEditable: boolean;
    lastClosedPeriodEnd: Date | null;
  }> {
    // Find the last closed period that ends before or on this date
    const lastClosedPeriod = await this.prisma.fiscalYear.findFirst({
      where: {
        companyId,
        status: 'CLOSED',
        endDate: { lte: date },
      },
      orderBy: { endDate: 'desc' },
    });

    // If date falls within a closed period, it's not editable
    const isInClosedPeriod = await this.isDateInClosedPeriod(companyId, date);

    if (isInClosedPeriod) {
      return {
        isEditable: false,
        lastClosedPeriodEnd: null,
      };
    }

    // If there's a closed period before this date, check if date is after it
    if (lastClosedPeriod) {
      // Date is after the last closed period, so it's editable
      // (all subsequent open periods are treated as one)
      return {
        isEditable: true,
        lastClosedPeriodEnd: lastClosedPeriod.endDate,
      };
    }

    // No closed periods exist, so date is editable
    return {
      isEditable: true,
      lastClosedPeriodEnd: null,
    };
  }

  /**
   * Validate that the fiscal year start date is not in a future year
   */
  private validateYearNotInFuture(startDate: Date): void {
    const currentYear = new Date().getFullYear();
    const fiscalYear = startDate.getFullYear();

    if (fiscalYear > currentYear) {
      throw new BadRequestException(
        `لا يمكن إنشاء أو إعادة فتح فترة محاسبية لسنة مستقبلية. السنة الحالية: ${currentYear}، السنة المحاولة: ${fiscalYear}`,
      );
    }
  }

  /**
   * Validate that a date range doesn't overlap with existing periods
   */
  private async validateNoOverlap(
    companyId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<void> {
    const where: any = {
      companyId,
      OR: [
        // New period starts within an existing period
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate },
        },
        // New period ends within an existing period
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate },
        },
        // New period completely contains an existing period
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlapping = await this.prisma.fiscalYear.findFirst({
      where,
    });

    if (overlapping) {
      const startDateStr = overlapping.startDate.toISOString().split('T')[0];
      const endDateStr = overlapping.endDate.toISOString().split('T')[0];
      throw new BadRequestException(
        `تتداخل الفترة مع السنة المالية الموجودة: ${overlapping.name} (${startDateStr} - ${endDateStr})`,
      );
    }
  }

  private mapToResponse(fiscalYear: any): FiscalYearResponse {
    return {
      id: fiscalYear.id,
      name: fiscalYear.name,
      startDate: fiscalYear.startDate,
      endDate: fiscalYear.endDate,
      status: fiscalYear.status,
      retainedEarnings: fiscalYear.retainedEarnings,
      createdAt: fiscalYear.createdAt,
      updatedAt: fiscalYear.updatedAt,
    };
  }
}

