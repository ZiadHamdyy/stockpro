/**
 * Resources enum contains all resource keys used for permissions
 * These map to the MENU_ITEMS keys in constants.ts
 */
export enum Resources {
  // Dashboard
  DASHBOARD = "dashboard",

  // Settings
  SETTINGS = "settings",
  COMPANY_DATA = "company_data",
  FISCAL_YEARS = "fiscal_years",
  BRANCHES_DATA = "branches_data",
  STORES_DATA = "stores_data",
  USERS_DATA = "users_data",
  PERMISSIONS = "permissions",
  AUDIT_LOG = "audit_log",
  PRINT_SETTINGS = "print_settings",
  FINANCIAL_SYSTEM = "financial_system",
  DATABASE = "database",
  DATABASE_BACKUP = "database_backup",

  // ZATCA
  ZATCA = "zatca",
  ZATCA_UPLOAD = "zatca_upload",

  // Items
  ITEMS = "items",
  ADD_ITEM = "add_item",
  ITEMS_LIST = "items_list",
  ITEM_GROUPS = "item_groups",
  UNITS = "units",

  // Warehouse Operations
  WAREHOUSE_OPERATIONS = "warehouse_operations",
  STORE_RECEIPT_VOUCHER = "store_receipt_voucher",
  STORE_ISSUE_VOUCHER = "store_issue_voucher",
  STORE_TRANSFER = "store_transfer",
  INVENTORY_COUNT = "inventory_count",

  // Sales
  SALES = "sales",
  PRICE_QUOTATION = "price_quotation",
  SALES_INVOICE = "sales_invoice",
  SALES_RETURN = "sales_return",
  DAILY_SALES = "daily_sales",
  DAILY_SALES_RETURNS = "daily_sales_returns",

  // Purchases
  PURCHASES = "purchases",
  PURCHASE_INVOICE = "purchase_invoice",
  PURCHASE_RETURN = "purchase_return",
  DAILY_PURCHASES = "daily_purchases",
  DAILY_PURCHASE_RETURNS = "daily_purchase_returns",

  // Customers
  CUSTOMERS = "customers",
  ADD_CUSTOMER = "add_customer",
  CUSTOMERS_LIST = "customers_list",

  // Suppliers
  SUPPLIERS = "suppliers",
  ADD_SUPPLIER = "add_supplier",
  SUPPLIERS_LIST = "suppliers_list",

  // General Accounts
  GENERAL_ACCOUNTS = "general_accounts",
  EXPENSES_MANAGEMENT = "expenses_management",
  EXPENSES_LIST = "expenses_list",
  EXPENSE_CODES = "expense_codes",
  EXPENSE_TYPES = "expense_types",
  REVENUES_MANAGEMENT = "revenues_management",
  REVENUE_CODES = "revenue_codes",
  CURRENT_ACCOUNTS = "current_accounts",
  ADD_CURRENT_ACCOUNT = "add_current_account",
  CURRENT_ACCOUNTS_LIST = "current_accounts_list",
  FINANCIAL_BALANCES = "financial_balances",
  RECEIVABLE_ACCOUNTS = "receivable_accounts",
  ADD_RECEIVABLE_ACCOUNT = "add_receivable_account",
  RECEIVABLE_ACCOUNTS_LIST = "receivable_accounts_list",
  PAYABLE_ACCOUNTS = "payable_accounts",
  ADD_PAYABLE_ACCOUNT = "add_payable_account",
  PAYABLE_ACCOUNTS_LIST = "payable_accounts_list",
  SAFES = "safes",
  BANKS = "banks",

  // Financials
  FINANCIALS = "financials",
  RECEIPT_VOUCHER = "receipt_voucher",
  PAYMENT_VOUCHER = "payment_voucher",
  INTERNAL_TRANSFER = "internal_transfers",

  // Reports
  REPORTS = "reports",
  FINANCIAL_ANALYSIS = "financial_analysis",
  LIQUIDITY_REPORT = "liquidity_report",
  FINANCIAL_PERFORMANCE_REPORT = "financial_performance_report",
  ITEM_PROFITABILITY_REPORT = "item_profitability_report",
  DEBT_AGING_REPORT = "debt_aging_report",
  STAGNANT_ITEMS_REPORT = "stagnant_items_report",
  VIP_CUSTOMERS_REPORT = "vip_customers_report",
  ANNUAL_SALES_REPORT = "annual_sales_report",
  ITEM_REPORTS = "item_reports",
  ITEM_MOVEMENT_REPORT = "item_movement_report",
  ITEM_BALANCE_REPORT = "item_balance_report",
  INVENTORY_VALUATION_REPORT = "inventory_valuation_report",
  CUSTOMER_REPORTS = "customer_reports",
  CUSTOMER_STATEMENT_REPORT = "customer_statement_report",
  CUSTOMER_BALANCE_REPORT = "customer_balance_report",
  SUPPLIER_REPORTS = "supplier_reports",
  SUPPLIER_STATEMENT_REPORT = "supplier_statement_report",
  SUPPLIER_BALANCE_REPORT = "supplier_balance_report",
  FINANCIAL_REPORTS = "financial_reports",
  DAILY_COLLECTIONS_REPORT = "daily_collections_report",
  DAILY_PAYMENTS_REPORT = "daily_payments_report",
  DAILY_TRANSFERS_REPORT = "daily_transfers_report",
  EXPENSE_STATEMENT_REPORT = "expense_statement_report",
  TOTAL_EXPENSES_REPORT = "total_expenses_report",
  REVENUE_STATEMENT_REPORT = "revenue_statement_report",
  TOTAL_REVENUES_REPORT = "total_revenues_report",
  CURRENT_ACCOUNT_STATEMENT_REPORT = "current_account_statement_report",
  TOTAL_CURRENT_ACCOUNTS_REPORT = "total_current_accounts_report",
  RECEIVABLE_ACCOUNT_STATEMENT_REPORT = "receivable_account_statement_report",
  TOTAL_RECEIVABLE_ACCOUNTS_REPORT = "total_receivable_accounts_report",
  PAYABLE_ACCOUNT_STATEMENT_REPORT = "payable_account_statement_report",
  TOTAL_PAYABLE_ACCOUNTS_REPORT = "total_payable_accounts_report",
  SAFE_STATEMENT_REPORT = "safe_statement_report",
  BANK_STATEMENT_REPORT = "bank_statement_report",
  TOTAL_CASH_REPORT = "total_cash_report",
  VAT_STATEMENT_REPORT = "vat_statement_report",
  TAX_DECLARATION_REPORT = "tax_declaration_report",

  // Final Accounts
  FINAL_ACCOUNTS = "final_accounts",
  INCOME_STATEMENT = "income_statement",
  BALANCE_SHEET = "balance_sheet",
}

/**
 * Actions enum contains all permission actions
 */
export enum Actions {
  READ = "read",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  SEARCH = "search",
  PRINT = "print",
}

/**
 * Builds a permission string in the format "resource-action"
 * @param resource - The resource from Resources enum
 * @param action - The action from Actions enum
 * @returns Permission string (e.g., "dashboard-read")
 *
 * @example
 * ```typescript
 * buildPermission(Resources.DASHBOARD, Actions.READ)
 * // Returns: "dashboard-read"
 * ```
 */
export const buildPermission = (
  resource: Resources,
  action: Actions,
): string => {
  return `${resource}-${action}`;
};

/**
 * Type guard to check if a string is a valid Resource
 */
export const isResource = (value: string): value is Resources => {
  return Object.values(Resources).includes(value as Resources);
};

/**
 * Type guard to check if a string is a valid Action
 */
export const isAction = (value: string): value is Actions => {
  return Object.values(Actions).includes(value as Actions);
};
