import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreatePayableAccountRequest } from './dtos/request/create-payable-account.request';
import { UpdatePayableAccountRequest } from './dtos/request/update-payable-account.request';
import { PayableAccountResponse } from './dtos/response/payable-account.response';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';

@Injectable()
export class PayableAccountService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
  ) {}

  async create(
    companyId: string,
    dto: CreatePayableAccountRequest,
  ): Promise<PayableAccountResponse> {
    // Check financial period status (use current date for accounts without date field)
    const accountDate = new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, accountDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إضافة حساب دائن: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, accountDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إضافة حساب دائن: الفترة المحاسبية مغلقة');
    }

    const last = await this.prisma.payableAccount.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });
    const lastNum = last ? parseInt(last.code.replace('PA-', ''), 10) || 0 : 0;
    const code = `PA-${String(lastNum + 1).padStart(3, '0')}`;

    const entity = await this.prisma.payableAccount.create({
      data: {
        name: dto.name,
        openingBalance: dto.openingBalance ?? 0,
        currentBalance: dto.openingBalance ?? 0,
        companyId,
        code,
      },
    });
    return this.map(entity);
  }

  async findAll(companyId: string): Promise<PayableAccountResponse[]> {
    const rows = await this.prisma.payableAccount.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
    return rows.map(this.map);
  }

  async findOne(companyId: string, id: string): Promise<PayableAccountResponse> {
    const entity = await this.prisma.payableAccount.findUnique({
      where: { id_companyId: { id, companyId } },
    });
    if (!entity) throw new NotFoundException('Payable account not found');
    return this.map(entity);
  }

  async findByCode(companyId: string, code: string): Promise<PayableAccountResponse> {
    const entity = await this.prisma.payableAccount.findUnique({
      where: { code_companyId: { code, companyId } },
    });
    if (!entity) throw new NotFoundException('Payable account not found');
    return this.map(entity);
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdatePayableAccountRequest,
  ): Promise<PayableAccountResponse> {
    // Verify the account belongs to the company
    await this.findOne(companyId, id);
    const entity = await this.prisma.payableAccount.update({
      where: { id },
      data: dto,
    });
    return this.map(entity);
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the account belongs to the company
    await this.findOne(companyId, id);
    await this.prisma.payableAccount.delete({ where: { id } });
  }

  private map = (entity: any): PayableAccountResponse => ({
    id: entity.id,
    code: entity.code,
    name: entity.name,
    openingBalance: entity.openingBalance,
    currentBalance: entity.currentBalance,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}
