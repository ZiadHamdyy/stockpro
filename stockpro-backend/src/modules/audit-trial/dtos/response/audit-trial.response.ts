import { Expose } from 'class-transformer';

export class TrialBalanceEntry {
  @Expose()
  id: string;

  @Expose()
  accountCode: string;

  @Expose()
  accountName: string;

  @Expose()
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';

  @Expose()
  openingBalanceDebit: number;

  @Expose()
  openingBalanceCredit: number;

  @Expose()
  periodDebit: number;

  @Expose()
  periodCredit: number;

  @Expose()
  closingBalanceDebit: number;

  @Expose()
  closingBalanceCredit: number;
}

export class AuditTrialResponse {
  @Expose()
  entries: TrialBalanceEntry[];

  @Expose()
  currency: string;
}

