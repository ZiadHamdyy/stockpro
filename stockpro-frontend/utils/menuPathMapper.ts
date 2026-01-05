/**
 * Maps menu item keys to their corresponding React Router paths
 */
export const getPathFromMenuKey = (key: string): string => {
  const pathMap: Record<string, string> = {
    // Dashboard
    dashboard: "/dashboard",

    // Subscription
    subscription: "/subscription",
    subscription_renewal: "/subscription/renewal",
    subscription_management: "/subscription/management",

    // Settings
    company_data: "/settings/company-data",
    fiscal_years: "/settings/fiscal-years",
    branches_data: "/settings/branches-data",
    stores_data: "/settings/stores-data",
    users_data: "/settings/users-data",
    permissions: "/settings/permissions",
    subscription_data: "/settings/subscription-data",
    audit_log: "/settings/audit-log",
    print_settings: "/settings/print-settings",
    financial_system: "/settings/financial-system",
    database_backup: "/dashboard", // Special handling - trigger backup

    // ZATCA
    zatca_upload: "/zatca/upload",

    // Items
    add_item: "/items/add",
    items_list: "/items/list",
    item_groups: "/items/groups",
    units: "/items/units",

    // Warehouse Operations
    store_receipt_voucher: "/warehouse/receipt-voucher",
    store_issue_voucher: "/warehouse/issue-voucher",
    store_transfer: "/warehouse/transfer",
    inventory_count: "/warehouse/inventory-count",

    // Sales
    price_quotation: "/sales/price-quotation",
    sales_invoice: "/sales/invoice",
    sales_return: "/sales/return",
    daily_sales: "/sales/daily",
    daily_sales_returns: "/sales/daily-returns",
    pos: "/sales/pos",
    help_center: "/support/help-center",

    // Purchases
    purchase_invoice: "/purchases/invoice",
    purchase_return: "/purchases/return",
    daily_purchases: "/purchases/daily",
    daily_purchase_returns: "/purchases/daily-returns",

    // Customers
    add_customer: "/customers/add",
    customers_list: "/customers/list",

    // Suppliers
    add_supplier: "/suppliers/add",
    suppliers_list: "/suppliers/list",

    // Financials - Expenses
    expenses_list: "/financials/expenses/list",
    expense_codes: "/financials/expenses/codes",
    expense_types: "/financials/expenses/types",

    // Financials - Revenues
    revenue_codes: "/financials/revenue-codes",

    // Financials - Current Accounts
    add_current_account: "/financials/current-accounts/add",
    current_accounts_list: "/financials/current-accounts/list",

    // Financials - Financial Balances (Receivable Accounts)
    add_receivable_account: "/financials/receivable-accounts/add",
    receivable_accounts_list: "/financials/receivable-accounts/list",

    // Financials - Financial Balances (Payable Accounts)
    add_payable_account: "/financials/payable-accounts/add",
    payable_accounts_list: "/financials/payable-accounts/list",

    // Financials - Safes & Banks
    safes: "/financials/safes",
    banks: "/financials/banks",

    // Financials - Vouchers
    receipt_voucher: "/financials/receipt-voucher",
    payment_voucher: "/financials/payment-voucher",
    internal_transfers: "/financials/internal-transfers",

    // Reports - Items
    financial_analysis: "/reports/financial-analysis",
    liquidity_report: "/reports/financial-analysis/liquidity",
    financial_performance_report:
      "/reports/financial-analysis/performance",
    item_profitability_report:
      "/reports/financial-analysis/item-profitability",
    debt_aging_report: "/reports/financial-analysis/debt-aging",
    stagnant_items_report: "/reports/financial-analysis/stagnant-items",
    vip_customers_report: "/reports/financial-analysis/vip-customers",
    annual_sales_report: "/reports/financial-analysis/annual-sales",
    item_movement_report: "/reports/items/movement",
    item_balance_report: "/reports/items/balance",
    inventory_valuation_report: "/reports/items/valuation",

    // Reports - Customers
    customer_statement_report: "/reports/customers/statement",
    customer_balance_report: "/reports/customers/balance",

    // Reports - Suppliers
    supplier_statement_report: "/reports/suppliers/statement",
    supplier_balance_report: "/reports/suppliers/balance",

    // Reports - Financials
    daily_collections_report: "/reports/financials/daily-collections",
    daily_payments_report: "/reports/financials/daily-payments",
    daily_transfers_report: "/reports/financials/daily-transfers",
    expense_statement_report: "/reports/financials/expense-statement",
    total_expenses_report: "/reports/financials/total-expenses",
    revenue_statement_report: "/reports/financials/revenue-statement",
    total_revenues_report: "/reports/financials/total-revenues",
    current_account_statement_report:
      "/reports/financials/current-account-statement",
    total_current_accounts_report: "/reports/financials/total-current-accounts",
    receivable_account_statement_report:
      "/reports/financials/receivable-account-statement",
    total_receivable_accounts_report:
      "/reports/financials/total-receivable-accounts",
    payable_account_statement_report:
      "/reports/financials/payable-account-statement",
    total_payable_accounts_report:
      "/reports/financials/total-payable-accounts",
    safe_statement_report: "/reports/financials/safe-statement",
    bank_statement_report: "/reports/financials/bank-statement",
    total_cash_report: "/reports/financials/total-cash",
    vat_statement_report: "/reports/financials/vat-statement",
    tax_declaration_report: "/reports/financials/tax-declaration",

    // Final Accounts
    income_statement: "/final-accounts/income-statement",
    balance_sheet: "/final-accounts/balance-sheet",
    audit_trail: "/final-accounts/audit-trial",
  };

  return pathMap[key] || "/dashboard";
};

/**
 * Maps URL path back to menu item key (for highlighting active menu)
 */
export const getMenuKeyFromPath = (path: string): string => {
  const pathToKeyMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/subscription": "subscription",
    "/subscription/renewal": "subscription_renewal",
    "/subscription/management": "subscription_management",
    "/settings/company-data": "company_data",
    "/settings/fiscal-years": "fiscal_years",
    "/settings/branches-data": "branches_data",
    "/settings/stores-data": "stores_data",
    "/settings/users-data": "users_data",
    "/settings/permissions": "permissions",
    "/settings/subscription-data": "subscription_data",
    "/settings/audit-log": "audit_log",
    "/settings/print-settings": "print_settings",
    "/items/add": "add_item",
    "/items/list": "items_list",
    "/items/groups": "item_groups",
    "/items/units": "units",
    "/warehouse/receipt-voucher": "store_receipt_voucher",
    "/warehouse/issue-voucher": "store_issue_voucher",
    "/warehouse/transfer": "store_transfer",
    "/warehouse/inventory-count": "inventory_count",
    "/sales/price-quotation": "price_quotation",
    "/sales/invoice": "sales_invoice",
    "/sales/return": "sales_return",
    "/sales/daily": "daily_sales",
    "/sales/daily-returns": "daily_sales_returns",
    "/sales/pos": "pos",
    "/support/help-center": "help_center",
    "/zatca/upload": "zatca_upload",
    "/purchases/invoice": "purchase_invoice",
    "/purchases/return": "purchase_return",
    "/purchases/daily": "daily_purchases",
    "/purchases/daily-returns": "daily_purchase_returns",
    "/customers/add": "add_customer",
    "/customers/list": "customers_list",
    "/suppliers/add": "add_supplier",
    "/suppliers/list": "suppliers_list",
    "/financials/expenses/list": "expenses_list",
    "/financials/expenses/codes": "expense_codes",
    "/financials/expenses/types": "expense_types",
    "/financials/revenue-codes": "revenue_codes",
    "/financials/current-accounts/add": "add_current_account",
    "/financials/current-accounts/list": "current_accounts_list",
    "/financials/receivable-accounts/add": "add_receivable_account",
    "/financials/receivable-accounts/list": "receivable_accounts_list",
    "/financials/payable-accounts/add": "add_payable_account",
    "/financials/payable-accounts/list": "payable_accounts_list",
    "/financials/safes": "safes",
    "/financials/banks": "banks",
    "/financials/receipt-voucher": "receipt_voucher",
    "/financials/payment-voucher": "payment_voucher",
    "/financials/internal-transfers": "internal_transfers",
    "/reports/financial-analysis": "financial_analysis",
    "/reports/financial-analysis/liquidity": "liquidity_report",
    "/reports/financial-analysis/performance":
      "financial_performance_report",
    "/reports/financial-analysis/item-profitability":
      "item_profitability_report",
    "/reports/financial-analysis/debt-aging": "debt_aging_report",
    "/reports/financial-analysis/stagnant-items": "stagnant_items_report",
    "/reports/financial-analysis/vip-customers": "vip_customers_report",
    "/reports/financial-analysis/annual-sales": "annual_sales_report",
    "/reports/items/movement": "item_movement_report",
    "/reports/items/balance": "item_balance_report",
    "/reports/items/valuation": "inventory_valuation_report",
    "/reports/customers/statement": "customer_statement_report",
    "/reports/customers/balance": "customer_balance_report",
    "/reports/suppliers/statement": "supplier_statement_report",
    "/reports/suppliers/balance": "supplier_balance_report",
    "/reports/financials/daily-collections": "daily_collections_report",
    "/reports/financials/daily-payments": "daily_payments_report",
    "/reports/financials/daily-transfers": "daily_transfers_report",
    "/reports/financials/expense-statement": "expense_statement_report",
    "/reports/financials/total-expenses": "total_expenses_report",
    "/reports/financials/revenue-statement": "revenue_statement_report",
    "/reports/financials/total-revenues": "total_revenues_report",
    "/reports/financials/current-account-statement":
      "current_account_statement_report",
    "/reports/financials/total-current-accounts":
      "total_current_accounts_report",
    "/reports/financials/receivable-account-statement":
      "receivable_account_statement_report",
    "/reports/financials/total-receivable-accounts":
      "total_receivable_accounts_report",
    "/reports/financials/payable-account-statement":
      "payable_account_statement_report",
    "/reports/financials/total-payable-accounts":
      "total_payable_accounts_report",
    "/reports/financials/safe-statement": "safe_statement_report",
    "/reports/financials/bank-statement": "bank_statement_report",
    "/reports/financials/total-cash": "total_cash_report",
    "/reports/financials/vat-statement": "vat_statement_report",
    "/reports/financials/tax-declaration": "tax_declaration_report",
    "/final-accounts/income-statement": "income_statement",
    "/final-accounts/balance-sheet": "balance_sheet",
    "/final-accounts/audit-trial": "audit_trail",
  };

  return pathToKeyMap[path] || "";
};
