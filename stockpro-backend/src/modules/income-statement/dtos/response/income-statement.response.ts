import { Expose } from 'class-transformer';

export class IncomeStatementResponse {
  @Expose()
  totalSales: number;

  @Expose()
  totalSalesReturns: number;

  @Expose()
  netSales: number;

  @Expose()
  beginningInventory: number;

  @Expose()
  totalPurchases: number;

  @Expose()
  totalPurchaseReturns: number;

  @Expose()
  netPurchases: number;

  @Expose()
  endingInventory: number;

  @Expose()
  cogs: number;

  @Expose()
  grossProfit: number;

  @Expose()
  operatingExpenses: number;

  @Expose()
  marketingExpenses: number;

  @Expose()
  adminAndGeneralExpenses: number;

  @Expose()
  totalExpenses: number;

  @Expose()
  netProfit: number;
}
