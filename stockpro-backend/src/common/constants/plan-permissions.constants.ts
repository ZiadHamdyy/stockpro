/**
 * Plan-Based Permission Restrictions Constants
 * Defines which resources require which subscription plans
 * This should match the frontend RESTRICTED_MENU_KEYS exactly
 * Format: { resource: ['PLAN1', 'PLAN2', ...] }
 * If a resource is not listed, it's available for all plans (including BASIC)
 */

export const PLAN_RESTRICTED_RESOURCES: Record<string, string[]> = {
  // BASIC Plan - Hide these items (require GROWTH or BUSINESS)
  permissions: ['GROWTH', 'BUSINESS'],
  zatca: ['GROWTH', 'BUSINESS'],
  store_transfer: ['GROWTH', 'BUSINESS'],
  inventory_count: ['BUSINESS'], // GROWTH Plan - Hide (requires BUSINESS)
  revenue_codes: ['BUSINESS'], // Financials page - only BUSINESS plan
  add_receivable_account: ['GROWTH', 'BUSINESS'],
  receivable_accounts_list: ['GROWTH', 'BUSINESS'],
  add_payable_account: ['GROWTH', 'BUSINESS'],
  payable_accounts_list: ['GROWTH', 'BUSINESS'],
  inventory_valuation_report: ['GROWTH', 'BUSINESS'],
  revenue_statement_report: ['BUSINESS'], // GROWTH Plan - Hide (requires BUSINESS)
  payable_account_statement_report: ['GROWTH', 'BUSINESS'],
  receivable_account_statement_report: ['GROWTH', 'BUSINESS'],
  total_payable_accounts_report: ['GROWTH', 'BUSINESS'],
  total_receivable_accounts_report: ['GROWTH', 'BUSINESS'],
  total_revenues_report: ['BUSINESS'], // GROWTH Plan - Hide (requires BUSINESS)
  final_accounts: ['GROWTH', 'BUSINESS'],
  income_statement: ['GROWTH', 'BUSINESS'],
  balance_sheet: ['GROWTH', 'BUSINESS'],
  audit_trail: ['GROWTH', 'BUSINESS'],
  audit_log: ['BUSINESS'], // Only BUSINESS plan

  // Financial Analysis section - GROWTH Plan - Hide (requires BUSINESS)
  financial_analysis: ['BUSINESS'],
  liquidity_report: ['BUSINESS'],
  financial_performance_report: ['BUSINESS'],
  item_profitability_report: ['BUSINESS'],
  stagnant_items_report: ['BUSINESS'],
  vip_customers_report: ['BUSINESS'],
  debt_aging_report: ['BUSINESS'],
  annual_sales_report: ['BUSINESS'],
};

/**
 * Check if a resource is allowed for the current subscription plan
 * @param resource - The resource name
 * @param planType - Current subscription plan type (BASIC, GROWTH, BUSINESS)
 * @returns true if the resource should be available, false otherwise
 */
export function isResourceAllowedForPlan(
  resource: string,
  planType: 'BASIC' | 'GROWTH' | 'BUSINESS',
): boolean {
  // Normalize to uppercase for case-insensitive comparison
  const normalizedPlanType = planType.toUpperCase();

  // If the resource is not restricted, allow it
  if (!PLAN_RESTRICTED_RESOURCES[resource]) {
    return true;
  }

  // Check if the current plan is in the allowed plans list
  const allowedPlans = PLAN_RESTRICTED_RESOURCES[resource].map((p) =>
    p.toUpperCase(),
  );
  return allowedPlans.includes(normalizedPlanType);
}
