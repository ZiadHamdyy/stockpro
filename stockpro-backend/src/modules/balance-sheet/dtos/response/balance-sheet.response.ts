import { Expose } from 'class-transformer';

export class BalanceSheetResponse {
  // Assets
  @Expose()
  cashInSafes: number;

  @Expose()
  cashInBanks: number;

  @Expose()
  receivables: number;

  @Expose()
  otherReceivables: number;

  @Expose()
  inventory: number;

  @Expose()
  totalAssets: number;

  // Liabilities
  @Expose()
  payables: number;

  @Expose()
  otherPayables: number;

  @Expose()
  vatPayable: number;

  @Expose()
  totalLiabilities: number;

  // Equity
  @Expose()
  capital: number;

  @Expose()
  partnersBalance: number;

  @Expose()
  retainedEarnings: number;

  @Expose()
  totalEquity: number;

  // Total
  @Expose()
  totalLiabilitiesAndEquity: number;
}
