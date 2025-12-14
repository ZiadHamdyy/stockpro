import { UsageStats } from '../../subscription.service';

export class UsageStatsResponse implements UsageStats {
  users: number;
  branches: number;
  stores: number;
  safes: number;
  banks: number;
  invoicesThisMonth: number;
  customers: number;
  suppliers: number;
  items: number;
  priceQuotationsThisMonth: number;
  financialVouchersThisMonth: number;
  currentAccounts: number;
  expenseRevenueThisMonth: number;
  receivableAccounts: number;
  payableAccounts: number;
}

