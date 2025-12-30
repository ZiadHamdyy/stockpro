import type { MenuItem } from '../types';

/**
 * Define which menu keys require GROWTH or BUSINESS plan
 * Format: { menuKey: ['PLAN1', 'PLAN2', ...] }
 * If a menu key is not listed, it's available for all plans (including BASIC)
 */
const RESTRICTED_MENU_KEYS: Record<string, string[]> = {
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
 * Check if a menu item is allowed for the current subscription plan
 * @param menuKey - The key of the menu item
 * @param planType - Current subscription plan type (BASIC, GROWTH, BUSINESS) or null/undefined
 * @returns true if the menu item should be shown, false otherwise
 */
export function isMenuAllowedForPlan(menuKey: string, planType: string | null | undefined): boolean {
  // If planType is not provided, allow all items
  // This prevents hiding items during loading or errors
  if (!planType) {
    return true;
  }
  
  // Normalize to uppercase for case-insensitive comparison
  const normalizedPlanType = planType.toUpperCase();
  
  // If the menu key is not restricted, allow it
  if (!RESTRICTED_MENU_KEYS[menuKey]) {
    return true;
  }

  // Check if the current plan is in the allowed plans list
  const allowedPlans = RESTRICTED_MENU_KEYS[menuKey].map(p => p.toUpperCase());
  return allowedPlans.includes(normalizedPlanType);
}

/**
 * Recursively filter menu items based on subscription plan
 * @param items - Array of menu items to filter
 * @param planType - Current subscription plan type or null/undefined
 * @returns Filtered array of menu items
 */
export function filterMenuBySubscription(items: MenuItem[], planType: string | null | undefined): MenuItem[] {
  // If planType is not provided, return all items (don't filter)
  // This prevents hiding items during loading or errors
  if (!planType) {
    return items;
  }
  
  return items
    .map((item) => {
      // Check if this menu item is allowed for the current plan
      if (!isMenuAllowedForPlan(item.key, planType)) {
        return null;
      }

      // If item has children, recursively filter them
      if (item.children) {
        const filteredChildren = filterMenuBySubscription(item.children, planType);
        
        // If all children are filtered out, remove the parent too
        if (filteredChildren.length === 0) {
          return null;
        }

        // Return item with filtered children
        return { ...item, children: filteredChildren };
      }

      // Return the item as-is if it has no children
      return item;
    })
    .filter((item): item is MenuItem => item !== null);
}
