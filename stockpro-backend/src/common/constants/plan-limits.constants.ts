/**
 * Subscription Plan Limits Constants
 * Defines resource limits for each subscription tier
 */

export interface PlanLimits {
  users: number;
  branches: number;
  stores: number;
  safes: number;
  banks: number;
  invoicesPerMonth: number; // sales + purchase + returns
  customers: number;
  suppliers: number;
  items: number;
  priceQuotationsPerMonth: number;
  financialVouchersPerMonth: number; // receipt + payment + internal transfers
  currentAccounts: number;
  expenseRevenuePerMonth: number;
  receivableAccounts: number;
  payableAccounts: number;
  financialAnalysisEnabled: boolean;
}

export const PLAN_LIMITS: Record<'BASIC' | 'GROWTH' | 'BUSINESS', PlanLimits> = {
  BASIC: {
    users: 1,
    branches: 1,
    stores: 1,
    safes: 1,
    banks: 2,
    invoicesPerMonth: -1, // unlimited
    customers: 50,
    suppliers: 50,
    items: 500,
    priceQuotationsPerMonth: 50,
    financialVouchersPerMonth: 100, // receipt + payment + internal transfers
    currentAccounts: 5,
    expenseRevenuePerMonth: 10,
    receivableAccounts: 0,
    payableAccounts: 0,
    financialAnalysisEnabled: false,
  },
  GROWTH: {
    users: 5,
    branches: 3,
    stores: 3,
    safes: 3,
    banks: 5,
    invoicesPerMonth: -1, // unlimited
    customers: 500,
    suppliers: 500,
    items: 5000,
    priceQuotationsPerMonth: 200,
    financialVouchersPerMonth: 500,
    currentAccounts: 20,
    expenseRevenuePerMonth: 50,
    receivableAccounts: 10,
    payableAccounts: 10,
    financialAnalysisEnabled: true,
  },
  BUSINESS: {
    users: -1, // -1 means unlimited
    branches: -1,
    stores: -1,
    safes: -1,
    banks: -1,
    invoicesPerMonth: -1,
    customers: -1,
    suppliers: -1,
    items: -1,
    priceQuotationsPerMonth: -1,
    financialVouchersPerMonth: -1,
    currentAccounts: -1,
    expenseRevenuePerMonth: -1,
    receivableAccounts: -1,
    payableAccounts: -1,
    financialAnalysisEnabled: true,
  },
};

// Resource types that can be limited
export enum LimitableResource {
  USERS = 'users',
  BRANCHES = 'branches',
  STORES = 'stores',
  SAFES = 'safes',
  BANKS = 'banks',
  INVOICES = 'invoicesPerMonth',
  CUSTOMERS = 'customers',
  SUPPLIERS = 'suppliers',
  ITEMS = 'items',
  PRICE_QUOTATIONS = 'priceQuotationsPerMonth',
  FINANCIAL_VOUCHERS = 'financialVouchersPerMonth',
  CURRENT_ACCOUNTS = 'currentAccounts',
  EXPENSE_REVENUE = 'expenseRevenuePerMonth',
  RECEIVABLE_ACCOUNTS = 'receivableAccounts',
  PAYABLE_ACCOUNTS = 'payableAccounts',
}

// Helper function to check if a limit is unlimited
export function isUnlimited(limit: number): boolean {
  return limit === -1;
}

// Helper function to get limit for a specific resource and plan
export function getResourceLimit(
  planType: 'BASIC' | 'GROWTH' | 'BUSINESS',
  resource: keyof PlanLimits,
): number {
  return PLAN_LIMITS[planType][resource] as number;
}

