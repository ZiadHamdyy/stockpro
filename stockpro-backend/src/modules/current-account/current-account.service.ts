import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateCurrentAccountRequest } from './dtos/request/create-current-account.request';
import { UpdateCurrentAccountRequest } from './dtos/request/update-current-account.request';
import { CurrentAccountResponse } from './dtos/response/current-account.response';
import { FiscalYearService } from '../fiscal-year/fiscal-year.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class CurrentAccountService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly fiscalYearService: FiscalYearService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async create(
    companyId: string,
    createCurrentAccountDto: CreateCurrentAccountRequest,
  ): Promise<CurrentAccountResponse> {
    // Check subscription limit
    await this.subscriptionService.enforceLimitOrThrow(companyId, 'currentAccounts');

    // Check financial period status (use current date for accounts without date field)
    const accountDate = new Date();
    
    // Check if there is an open period for this date
    const hasOpenPeriod = await this.fiscalYearService.hasOpenPeriodForDate(companyId, accountDate);
    if (!hasOpenPeriod) {
      throw new ForbiddenException('لا يمكن إضافة حساب جاري: لا توجد فترة محاسبية مفتوحة لهذا التاريخ');
    }

    // Check if date is in a closed period
    const isInClosedPeriod = await this.fiscalYearService.isDateInClosedPeriod(companyId, accountDate);
    if (isInClosedPeriod) {
      throw new ForbiddenException('لا يمكن إضافة حساب جاري: الفترة المحاسبية مغلقة');
    }

    // Generate the next code (company-scoped)
    const lastAccount = await this.prisma.currentAccount.findFirst({
      where: { companyId },
      orderBy: { code: 'desc' },
    });

    let nextCodeNumber = 1;
    if (lastAccount) {
      const lastCodeNumber =
        parseInt(lastAccount.code.replace('CA-', ''), 10) || 0;
      nextCodeNumber = lastCodeNumber + 1;
    }

    const code = `CA-${String(nextCodeNumber).padStart(3, '0')}`;

    const currentAccount = await this.prisma.currentAccount.create({
      data: {
        name: createCurrentAccountDto.name,
        type: createCurrentAccountDto.type || '',
        openingBalance: createCurrentAccountDto.openingBalance,
        currentBalance: createCurrentAccountDto.openingBalance,
        companyId,
        code,
      },
    });

    return this.mapToResponse(currentAccount);
  }

  async findAll(companyId: string): Promise<CurrentAccountResponse[]> {
    const currentAccounts = await this.prisma.currentAccount.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });

    return currentAccounts.map((account) => this.mapToResponse(account));
  }

  async findOne(companyId: string, id: string): Promise<CurrentAccountResponse> {
    const currentAccount = await this.prisma.currentAccount.findUnique({
      where: { id_companyId: { id, companyId } },
    });

    if (!currentAccount) {
      throw new NotFoundException('Current account not found');
    }

    return this.mapToResponse(currentAccount);
  }

  async findByCode(companyId: string, code: string): Promise<CurrentAccountResponse> {
    const currentAccount = await this.prisma.currentAccount.findUnique({
      where: { code_companyId: { code, companyId } },
    });

    if (!currentAccount) {
      throw new NotFoundException('Current account not found');
    }

    return this.mapToResponse(currentAccount);
  }

  async update(
    companyId: string,
    id: string,
    updateCurrentAccountDto: UpdateCurrentAccountRequest,
  ): Promise<CurrentAccountResponse> {
    // Verify the account belongs to the company
    await this.findOne(companyId, id);

    const currentAccount = await this.prisma.currentAccount.update({
      where: { id },
      data: updateCurrentAccountDto,
    });

    return this.mapToResponse(currentAccount);
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify the account belongs to the company
    await this.findOne(companyId, id);

    await this.prisma.currentAccount.delete({
      where: { id },
    });
  }

  private mapToResponse(currentAccount: any): CurrentAccountResponse {
    return {
      id: currentAccount.id,
      code: currentAccount.code,
      name: currentAccount.name,
      type: currentAccount.type,
      openingBalance: currentAccount.openingBalance,
      currentBalance: currentAccount.currentBalance,
      createdAt: currentAccount.createdAt,
      updatedAt: currentAccount.updatedAt,
    };
  }
}
