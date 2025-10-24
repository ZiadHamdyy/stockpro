import Dashboard from '../components/pages/Dashboard';
import Placeholder from '../components/pages/Placeholder';
import CompanyData from '../components/pages/settings/CompanyData';
import BranchesData from '../components/pages/settings/BranchesData';
import StoresData from '../components/pages/settings/StoresData';
import UsersData from '../components/pages/settings/UsersData';
import Permissions from '../components/pages/settings/Permissions';
import AddItem from '../components/pages/items/AddItem';
import ItemsList from '../components/pages/items/ItemsList';
import ItemGroups from '../components/pages/items/ItemGroups';
import Units from '../components/pages/items/Units';
import StoreReceiptVoucher from '../components/pages/warehouse/StoreReceiptVoucher';
import StoreIssueVoucher from '../components/pages/warehouse/StoreIssueVoucher';
import StoreTransfer from '../components/pages/warehouse/StoreTransfer';
import SalesInvoice from '../components/pages/sales/SalesInvoice';
import SalesReturn from '../components/pages/sales/SalesReturn';
import DailySales from '../components/pages/sales/DailySales';
import DailySalesReturns from '../components/pages/sales/DailySalesReturns';
import PurchaseInvoice from '../components/pages/purchases/PurchaseInvoice';
import PurchaseReturn from '../components/pages/purchases/PurchaseReturn';
import DailyPurchases from '../components/pages/purchases/DailyPurchases';
import DailyPurchaseReturns from '../components/pages/purchases/DailyPurchaseReturns';
import AddCustomer from '../components/pages/customers/AddCustomer';
import CustomersList from '../components/pages/customers/CustomersList';
import AddSupplier from '../components/pages/suppliers/AddSupplier';
import SuppliersList from '../components/pages/suppliers/SuppliersList';
import ReceiptVoucher from '../components/pages/financials/ReceiptVoucher';
import PaymentVoucher from '../components/pages/financials/PaymentVoucher';
import ExpensesList from '../components/pages/financials/ExpensesList';
import ExpenseCodes from '../components/pages/financials/ExpenseCodes';
import ExpenseTypes from '../components/pages/financials/ExpenseTypes';
import AddCurrentAccount from '../components/pages/financials/AddCurrentAccount';
import CurrentAccountsList from '../components/pages/financials/CurrentAccountsList';
import Safes from '../components/pages/financials/Safes';
import Banks from '../components/pages/financials/Banks';
import ItemMovementReport from '../components/pages/reports/items/ItemMovementReport';
import ItemBalanceReport from '../components/pages/reports/items/ItemBalanceReport';
import InventoryValuationReport from '../components/pages/reports/items/InventoryValuationReport';
import CustomerStatementReport from '../components/pages/reports/customers/CustomerStatementReport';
import CustomerBalanceReport from '../components/pages/reports/customers/CustomerBalanceReport';
import SupplierStatementReport from '../components/pages/reports/suppliers/SupplierStatementReport';
import SupplierBalanceReport from '../components/pages/reports/suppliers/SupplierBalanceReport';
import DailyCollectionsReport from '../components/pages/reports/financials/DailyCollectionsReport';
import DailyPaymentsReport from '../components/pages/reports/financials/DailyPaymentsReport';
import ExpenseStatementReport from '../components/pages/reports/financials/ExpenseStatementReport';
import TotalExpensesReport from '../components/pages/reports/financials/TotalExpensesReport';
import CurrentAccountStatementReport from '../components/pages/reports/financials/CurrentAccountStatementReport';
import TotalCurrentAccountsReport from '../components/pages/reports/financials/TotalCurrentAccountsReport';
import SafeStatementReport from '../components/pages/reports/financials/SafeStatementReport';
import BankStatementReport from '../components/pages/reports/financials/BankStatementReport';
import TaxDeclarationReport from '../components/pages/reports/financials/TaxDeclarationReport';
import IncomeStatement from '../components/pages/final_accounts/IncomeStatement';
import BalanceSheet from '../components/pages/final_accounts/BalanceSheet';
// Note: You can also use enums: import { Resources, Actions, buildPermission } from '../enums/permissions.enum';

/**
 * Route configuration mapping paths to components and required permissions
 * Each route requires a permission in "resource-action" format (e.g., "dashboard-read")
 * 
 * Example with enums:
 * ```typescript
 * requiredPermission: buildPermission(Resources.DASHBOARD, Actions.READ)
 * ```
 */
export const routeConfig = [
  // Dashboard
  {
    path: '/dashboard',
    component: Dashboard,
    requiredPermission: 'dashboard-read', // or: buildPermission(Resources.DASHBOARD, Actions.READ)
    label: 'الرئيسية',
  },
  
  // Settings
  {
    path: '/settings/company-data',
    component: CompanyData,
    requiredPermission: 'company_data-read',
    label: 'بيانات الشركة',
  },
  {
    path: '/settings/branches-data',
    component: BranchesData,
    requiredPermission: 'branches_data-read',
    label: 'بيانات الفروع',
  },
  {
    path: '/settings/stores-data',
    component: StoresData,
    requiredPermission: 'stores_data-read',
    label: 'بيانات المخازن',
  },
  {
    path: '/settings/users-data',
    component: UsersData,
    requiredPermission: 'users_data-read',
    label: 'بيانات المستخدمين',
  },
  {
    path: '/settings/permissions',
    component: Permissions,
    requiredPermission: 'permissions-read',
    label: 'الصلاحيات',
  },
  
  // Items
  {
    path: '/items/add',
    component: AddItem,
    requiredPermission: 'add_item-read',
    label: 'إضافة صنف',
  },
  {
    path: '/items/edit/:id',
    component: AddItem,
    requiredPermission: 'add_item-read',
    label: 'تعديل صنف',
  },
  {
    path: '/items/list',
    component: ItemsList,
    requiredPermission: 'items_list-read',
    label: 'قائمة الأصناف',
  },
  {
    path: '/items/groups',
    component: ItemGroups,
    requiredPermission: 'item_groups-read',
    label: 'مجموعات الأصناف',
  },
  {
    path: '/items/units',
    component: Units,
    requiredPermission: 'units-read',
    label: 'الوحدات',
  },
  
  // Warehouse Operations
  {
    path: '/warehouse/receipt-voucher',
    component: StoreReceiptVoucher,
    requiredPermission: 'store_receipt_voucher-read',
    label: 'إذن إضافة مخزن',
  },
  {
    path: '/warehouse/issue-voucher',
    component: StoreIssueVoucher,
    requiredPermission: 'store_issue_voucher-read',
    label: 'إذن صرف مخزن',
  },
  {
    path: '/warehouse/transfer',
    component: StoreTransfer,
    requiredPermission: 'store_transfer-read',
    label: 'تحويل بين المخازن',
  },
  
  // Sales
  {
    path: '/sales/invoice',
    component: SalesInvoice,
    requiredPermission: 'sales_invoice-read',
    label: 'فاتورة مبيعات',
  },
  {
    path: '/sales/return',
    component: SalesReturn,
    requiredPermission: 'sales_return-read',
    label: 'مرتجع مبيعات',
  },
  {
    path: '/sales/daily',
    component: DailySales,
    requiredPermission: 'daily_sales-read',
    label: 'يومية المبيعات',
  },
  {
    path: '/sales/daily-returns',
    component: DailySalesReturns,
    requiredPermission: 'daily_sales_returns-read',
    label: 'يومية مرتجع المبيعات',
  },
  
  // Purchases
  {
    path: '/purchases/invoice',
    component: PurchaseInvoice,
    requiredPermission: 'purchase_invoice-read',
    label: 'فاتورة مشتريات',
  },
  {
    path: '/purchases/return',
    component: PurchaseReturn,
    requiredPermission: 'purchase_return-read',
    label: 'مرتجع مشتريات',
  },
  {
    path: '/purchases/daily',
    component: DailyPurchases,
    requiredPermission: 'daily_purchases-read',
    label: 'يومية المشتريات',
  },
  {
    path: '/purchases/daily-returns',
    component: DailyPurchaseReturns,
    requiredPermission: 'daily_purchase_returns-read',
    label: 'يومية مرتجع المشتريات',
  },
  
  // Customers
  {
    path: '/customers/add',
    component: AddCustomer,
    requiredPermission: 'add_customer-read',
    label: 'إضافة عميل',
  },
  {
    path: '/customers/edit/:id',
    component: AddCustomer,
    requiredPermission: 'add_customer-read',
    label: 'تعديل عميل',
  },
  {
    path: '/customers/list',
    component: CustomersList,
    requiredPermission: 'customers_list-read',
    label: 'قائمة العملاء',
  },
  
  // Suppliers
  {
    path: '/suppliers/add',
    component: AddSupplier,
    requiredPermission: 'add_supplier-read',
    label: 'إضافة مورد',
  },
  {
    path: '/suppliers/edit/:id',
    component: AddSupplier,
    requiredPermission: 'add_supplier-read',
    label: 'تعديل مورد',
  },
  {
    path: '/suppliers/list',
    component: SuppliersList,
    requiredPermission: 'suppliers_list-read',
    label: 'قائمة الموردين',
  },
  
  // Financials - Expenses
  {
    path: '/financials/expenses/list',
    component: ExpensesList,
    requiredPermission: 'expenses_list-read',
    label: 'قائمة المصروفات',
  },
  {
    path: '/financials/expenses/codes',
    component: ExpenseCodes,
    requiredPermission: 'expense_codes-read',
    label: 'أكواد المصروفات',
  },
  {
    path: '/financials/expenses/types',
    component: ExpenseTypes,
    requiredPermission: 'expense_types-read',
    label: 'أنواع المصروفات',
  },
  
  // Financials - Current Accounts
  {
    path: '/financials/current-accounts/add',
    component: AddCurrentAccount,
    requiredPermission: 'add_current_account-read',
    label: 'إضافة حساب جاري',
  },
  {
    path: '/financials/current-accounts/edit/:id',
    component: AddCurrentAccount,
    requiredPermission: 'add_current_account-read',
    label: 'تعديل حساب جاري',
  },
  {
    path: '/financials/current-accounts/list',
    component: CurrentAccountsList,
    requiredPermission: 'current_accounts_list-read',
    label: 'قائمة الحسابات الجارية',
  },
  
  // Financials - Safes & Banks
  {
    path: '/financials/safes',
    component: Safes,
    requiredPermission: 'safes-read',
    label: 'الخزنات',
  },
  {
    path: '/financials/banks',
    component: Banks,
    requiredPermission: 'banks-read',
    label: 'البنوك',
  },
  
  // Financials - Vouchers
  {
    path: '/financials/receipt-voucher',
    component: ReceiptVoucher,
    requiredPermission: 'receipt_voucher-read',
    label: 'سند قبض',
  },
  {
    path: '/financials/payment-voucher',
    component: PaymentVoucher,
    requiredPermission: 'payment_voucher-read',
    label: 'سند صرف',
  },
  
  // Reports - Items
  {
    path: '/reports/items/movement',
    component: ItemMovementReport,
    requiredPermission: 'item_movement_report-read',
    label: 'حركة صنف',
  },
  {
    path: '/reports/items/balance',
    component: ItemBalanceReport,
    requiredPermission: 'item_balance_report-read',
    label: 'أرصدة الأصناف',
  },
  {
    path: '/reports/items/valuation',
    component: InventoryValuationReport,
    requiredPermission: 'inventory_valuation_report-read',
    label: 'تقييم المخزون',
  },
  
  // Reports - Customers
  {
    path: '/reports/customers/statement',
    component: CustomerStatementReport,
    requiredPermission: 'customer_statement_report-read',
    label: 'كشف حساب عميل',
  },
  {
    path: '/reports/customers/balance',
    component: CustomerBalanceReport,
    requiredPermission: 'customer_balance_report-read',
    label: 'أرصدة العملاء',
  },
  
  // Reports - Suppliers
  {
    path: '/reports/suppliers/statement',
    component: SupplierStatementReport,
    requiredPermission: 'supplier_statement_report-read',
    label: 'كشف حساب مورد',
  },
  {
    path: '/reports/suppliers/balance',
    component: SupplierBalanceReport,
    requiredPermission: 'supplier_balance_report-read',
    label: 'أرصدة الموردين',
  },
  
  // Reports - Financials
  {
    path: '/reports/financials/daily-collections',
    component: DailyCollectionsReport,
    requiredPermission: 'daily_collections_report-read',
    label: 'يومية التحصيلات',
  },
  {
    path: '/reports/financials/daily-payments',
    component: DailyPaymentsReport,
    requiredPermission: 'daily_payments_report-read',
    label: 'يومية الصرف',
  },
  {
    path: '/reports/financials/expense-statement',
    component: ExpenseStatementReport,
    requiredPermission: 'expense_statement_report-read',
    label: 'كشف حساب مصروفات',
  },
  {
    path: '/reports/financials/total-expenses',
    component: TotalExpensesReport,
    requiredPermission: 'total_expenses_report-read',
    label: 'إجمالي المصروفات',
  },
  {
    path: '/reports/financials/current-account-statement',
    component: CurrentAccountStatementReport,
    requiredPermission: 'current_account_statement_report-read',
    label: 'كشف حساب جاري',
  },
  {
    path: '/reports/financials/total-current-accounts',
    component: TotalCurrentAccountsReport,
    requiredPermission: 'total_current_accounts_report-read',
    label: 'إجمالي الحسابات الجارية',
  },
  {
    path: '/reports/financials/safe-statement',
    component: SafeStatementReport,
    requiredPermission: 'safe_statement_report-read',
    label: 'كشف حساب خزينة',
  },
  {
    path: '/reports/financials/bank-statement',
    component: BankStatementReport,
    requiredPermission: 'bank_statement_report-read',
    label: 'كشف حساب بنك',
  },
  {
    path: '/reports/financials/tax-declaration',
    component: TaxDeclarationReport,
    requiredPermission: 'tax_declaration_report-read',
    label: 'الإقرار الضريبي',
  },
  
  // Final Accounts
  {
    path: '/final-accounts/income-statement',
    component: IncomeStatement,
    requiredPermission: 'income_statement-read',
    label: 'قائمة الدخل',
  },
  {
    path: '/final-accounts/balance-sheet',
    component: BalanceSheet,
    requiredPermission: 'balance_sheet-read',
    label: 'قائمة المركز المالي',
  },
];

/**
 * Helper function to get route config by path
 */
export const getRouteByPath = (path: string) => {
  return routeConfig.find((route) => route.path === path);
};

/**
 * Helper function to get label by path
 */
export const getLabelByPath = (path: string): string => {
  const route = getRouteByPath(path);
  return route?.label || 'صفحة غير معروفة';
};

