import { PlanLimits } from 'src/common/constants/plan-limits.constants';

export class PlanLimitsResponse implements PlanLimits {
  users: number;
  branches: number;
  stores: number;
  safes: number;
  banks: number;
  invoicesPerMonth: number;
  customers: number;
  suppliers: number;
  items: number;
  priceQuotationsPerMonth: number;
  financialVouchersPerMonth: number;
  currentAccounts: number;
  expenseRevenuePerMonth: number;
  receivableAccounts: number;
  payableAccounts: number;
  financialAnalysisEnabled: boolean;
}

