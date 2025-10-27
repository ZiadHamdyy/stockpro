import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { BalanceSheetResponse } from './dtos/response/balance-sheet.response';

@Injectable()
export class BalanceSheetService {
  constructor(private readonly prisma: DatabaseService) {}

  async getBalanceSheet(endDate: string): Promise<BalanceSheetResponse> {
    const targetDate = new Date(endDate);
    targetDate.setHours(23, 59, 59, 999);

    const cashInSafes = await this.calculateCashInSafes(targetDate);
    const cashInBanks = await this.calculateCashInBanks(targetDate);
    const receivables = await this.calculateReceivables(targetDate);
    const inventory = await this.calculateInventoryValue(endDate);
    const totalAssets = cashInSafes + cashInBanks + receivables + inventory;

    const payables = await this.calculatePayables(targetDate);
    const vatPayable = await this.calculateVatPayable(targetDate);
    const totalLiabilities = payables + vatPayable;

    const capital = await this.getCapital();
    const partnersBalance = await this.calculatePartnersBalance(targetDate);
    const retainedEarnings = await this.calculateNetProfit(endDate);
    const totalEquity = capital + partnersBalance + retainedEarnings;

    return {
      cashInSafes,
      cashInBanks,
      receivables,
      inventory,
      totalAssets,
      payables,
      vatPayable,
      totalLiabilities,
      capital,
      partnersBalance,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  private async calculateCashInSafes(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculateCashInBanks(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculateReceivables(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculateInventoryValue(targetDate: string): Promise<number> {
    return 0;
  }

  private async calculatePayables(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculateVatPayable(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculatePartnersBalance(endDate: Date): Promise<number> {
    return 0;
  }

  private async calculateNetProfit(endDate: string): Promise<number> {
    return 0;
  }

  private async getCapital(): Promise<number> {
    const company = await this.prisma.company.findFirst();
    return company?.capital || 0;
  }
}
