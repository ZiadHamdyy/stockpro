import Dashboard from "../components/pages/Dashboard";
import Placeholder from "../components/pages/Placeholder";
import CompanyData from "../components/pages/settings/CompanyData";
import FiscalYears from "../components/pages/settings/FiscalYears";
import BranchesData from "../components/pages/settings/BranchesData";
import StoresData from "../components/pages/settings/StoresData";
import UsersData from "../components/pages/settings/UsersData";
import Permissions from "../components/pages/settings/Permissions";
import SubscriptionData from "../components/pages/settings/SubscriptionData";
import AuditLog from "../components/pages/settings/AuditLog";
import PrintSettings from "../components/pages/settings/PrintSettings";
import FinancialSystem from "../components/pages/settings/financial-system/FinancialSystem";
import AddItem from "../components/pages/items/AddItem";
import ItemsList from "../components/pages/items/ItemsList";
import ItemGroups from "../components/pages/items/ItemGroups";
import Units from "../components/pages/items/Units";
import StoreReceiptVoucher from "../components/pages/warehouse/StoreReceiptVoucher";
import StoreIssueVoucher from "../components/pages/warehouse/StoreIssueVoucher";
import StoreTransfer from "../components/pages/warehouse/StoreTransfer";
import InventoryCount from "../components/pages/warehouse/InventoryCount";
import POS from "../components/pages/sales/POS/POS";
import HelpCenter from "../components/pages/support/HelpCenter";
import SalesInvoice from "../components/pages/sales/SalesInvoice";
import PriceQuotation from "../components/pages/sales/PriceQuotation";
import SalesReturn from "../components/pages/sales/SalesReturn";
import DailySales from "../components/pages/sales/DailySales";
import DailySalesReturns from "../components/pages/sales/DailySalesReturns";
import PurchaseInvoice from "../components/pages/purchases/PurchaseInvoice";
import PurchaseReturn from "../components/pages/purchases/PurchaseReturn";
import DailyPurchases from "../components/pages/purchases/DailyPurchases";
import DailyPurchaseReturns from "../components/pages/purchases/DailyPurchaseReturns";
import AddCustomer from "../components/pages/customers/AddCustomer";
import CustomersList from "../components/pages/customers/CustomersList";
import AddSupplier from "../components/pages/suppliers/AddSupplier";
import SuppliersList from "../components/pages/suppliers/SuppliersList";
import ReceiptVoucher from "../components/pages/financials/ReceiptVoucher";
import PaymentVoucher from "../components/pages/financials/PaymentVoucher";
import InternalTransfers from "../components/pages/financials/InternalTransfers";
import ExpensesList from "../components/pages/financials/ExpensesList";
import ExpenseCodes from "../components/pages/financials/ExpenseCodes";
import ExpenseTypes from "../components/pages/financials/ExpenseTypes";
import RevenueCodes from "../components/pages/financials/RevenueCodes";
import AddCurrentAccount from "../components/pages/financials/AddCurrentAccount";
import CurrentAccountsList from "../components/pages/financials/CurrentAccountsList";
import AddReceivableAccount from "../components/pages/financials/AddReceivableAccount";
import ReceivableAccountsList from "../components/pages/financials/ReceivableAccountsList";
import AddPayableAccount from "../components/pages/financials/AddPayableAccount";
import PayableAccountsList from "../components/pages/financials/PayableAccountsList";
import Safes from "../components/pages/financials/Safes";
import Banks from "../components/pages/financials/Banks";
import ItemMovementReport from "../components/pages/reports/items/ItemMovementReport";
import ItemBalanceReport from "../components/pages/reports/items/ItemBalanceReport";
import InventoryValuationReport from "../components/pages/reports/items/InventoryValuationReport";
import LiquidityReport from "../components/pages/reports/financial_analysis/LiquidityReport";
import FinancialPerformanceReport from "../components/pages/reports/financial_analysis/FinancialPerformanceReport";
import ItemProfitabilityReport from "../components/pages/reports/financial_analysis/ItemProfitabilityReport";
import DebtAgingReport from "../components/pages/reports/financial_analysis/DebtAgingReport";
import StagnantItemsReport from "../components/pages/reports/financial_analysis/StagnantItemsReport";
import VipCustomersReport from "../components/pages/reports/financial_analysis/VipCustomersReport";
import AnnualSales from "../components/pages/reports/financial_analysis/annual_sales/AnnualSales";
import CustomerStatementReport from "../components/pages/reports/customers/CustomerStatementReport";
import CustomerBalanceReport from "../components/pages/reports/customers/CustomerBalanceReport";
import SupplierStatementReport from "../components/pages/reports/suppliers/SupplierStatementReport";
import SupplierBalanceReport from "../components/pages/reports/suppliers/SupplierBalanceReport";
import DailyCollectionsReport from "../components/pages/reports/financials/DailyCollectionsReport";
import DailyPaymentsReport from "../components/pages/reports/financials/DailyPaymentsReport";
import DailyTransfersReport from "../components/pages/reports/financials/DailyTransfersReport";
import ExpenseStatementReport from "../components/pages/reports/financials/ExpenseStatementReport";
import TotalExpensesReport from "../components/pages/reports/financials/TotalExpensesReport";
import CurrentAccountStatementReport from "../components/pages/reports/financials/CurrentAccountStatementReport";
import TotalCurrentAccountsReport from "../components/pages/reports/financials/TotalCurrentAccountsReport";
import ReceivableAccountStatementReport from "../components/pages/reports/financials/ReceivableAccountStatementReport";
import TotalReceivableAccountsReport from "../components/pages/reports/financials/TotalReceivableAccountsReport";
import PayableAccountStatementReport from "../components/pages/reports/financials/PayableAccountStatementReport";
import TotalPayableAccountsReport from "../components/pages/reports/financials/TotalPayableAccountsReport";
import SafeStatementReport from "../components/pages/reports/financials/SafeStatementReport";
import BankStatementReport from "../components/pages/reports/financials/BankStatementReport";
import TaxDeclarationReport from "../components/pages/reports/financials/TaxDeclarationReport";
import VATStatementReport from "../components/pages/reports/financials/VATStatementReport";
import RevenueStatementReport from "../components/pages/reports/financials/RevenueStatementReport";
import TotalRevenuesReport from "../components/pages/reports/financials/TotalRevenueReport";
import TotalCashReport from "../components/pages/reports/financials/TotalCashReport";
import IncomeStatement from "../components/pages/final_accounts/IncomeStatement";
import BalanceSheet from "../components/pages/final_accounts/BalanceSheet";
import AuditTrial from "../components/pages/final_accounts/AuditTrial";
import ZatcaInvoiceUpload from "../components/pages/zatca/ZatcaInvoiceUpload";
import Subscription from "../components/pages/subscription/Subscription";
import SubscriptionRenewal from "../components/pages/subscription/SubscriptionRenewal";
import SubscriptionManagement from "../components/pages/subscription/SubscriptionManagement";
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
    path: "/dashboard",
    component: Dashboard,
    requiredPermission: "dashboard-read", // or: buildPermission(Resources.DASHBOARD, Actions.READ)
    label: "الرئيسية",
  },
  {
    path: "/support/help-center",
    component: HelpCenter,
    requiredPermission: "help_center-read",
    label: "مركز المساعدة",
  },
  {
    path: "/subscription",
    component: Subscription,
    requiredPermission: "", // Handled by SubscriptionRoute wrapper
    label: "الاشتراك والتراخيص",
  },
  {
    path: "/subscription/renewal",
    component: SubscriptionRenewal,
    requiredPermission: "", // Handled by SubscriptionRenewalRoute wrapper
    label: "تجديد الاشتراكات",
  },
  {
    path: "/subscription/management",
    component: SubscriptionManagement,
    requiredPermission: "", // Handled by SubscriptionManagementRoute wrapper
    label: "إدارة الاشتراكات",
  },

  // Settings
  {
    path: "/settings/company-data",
    component: CompanyData,
    requiredPermission: "company_data-read",
    label: "بيانات الشركة",
  },
  {
    path: "/settings/fiscal-years",
    component: FiscalYears,
    requiredPermission: "fiscal_years-read",
    label: "الفترات المحاسبية",
  },
  {
    path: "/settings/branches-data",
    component: BranchesData,
    requiredPermission: "branches_data-read",
    label: "بيانات الفروع",
  },
  {
    path: "/settings/stores-data",
    component: StoresData,
    requiredPermission: "stores_data-read",
    label: "بيانات المخازن",
  },
  {
    path: "/settings/users-data",
    component: UsersData,
    requiredPermission: "users_data-read",
    label: "بيانات المستخدمين",
  },
  {
    path: "/settings/permissions",
    component: Permissions,
    requiredPermission: "permissions-read",
    label: "الصلاحيات",
  },
  {
    path: "/settings/subscription-data",
    component: SubscriptionData,
    requiredPermission: "subscription_data-read",
    label: "بيانات الاشتراك",
  },
  {
    path: "/settings/audit-log",
    component: AuditLog,
    requiredPermission: "audit_log-read",
    label: "سجل العمليات",
  },
  {
    path: "/settings/print-settings",
    component: PrintSettings,
    requiredPermission: "print_settings-read",
    label: "إعدادات الطباعة",
  },
  {
    path: "/settings/financial-system",
    component: FinancialSystem,
    requiredPermission: "financial_system-read",
    label: "إعدادات النظام المالي",
  },

  // ZATCA
  {
    path: "/zatca/upload",
    component: ZatcaInvoiceUpload,
    requiredPermission: "zatca_upload-read",
    label: "رفع الفواتير (ZATCA)",
  },

  // Items
  {
    path: "/items/add",
    component: AddItem,
    requiredPermission: "add_item-read",
    label: "إضافة صنف",
  },
  {
    path: "/items/add/:id",
    component: AddItem,
    requiredPermission: "add_item-read",
    label: "تعديل صنف",
  },
  {
    path: "/items/edit/:id",
    component: AddItem,
    requiredPermission: "add_item-read",
    label: "تعديل صنف",
  },
  {
    path: "/items/list",
    component: ItemsList,
    requiredPermission: "items_list-read",
    label: "قائمة الأصناف",
  },
  {
    path: "/items/groups",
    component: ItemGroups,
    requiredPermission: "item_groups-read",
    label: "مجموعات الأصناف",
  },
  {
    path: "/items/units",
    component: Units,
    requiredPermission: "units-read",
    label: "الوحدات",
  },

  // Warehouse Operations
  {
    path: "/warehouse/receipt-voucher",
    component: StoreReceiptVoucher,
    requiredPermission: "store_receipt_voucher-read",
    label: "إذن إضافة مخزن",
  },
  {
    path: "/warehouse/issue-voucher",
    component: StoreIssueVoucher,
    requiredPermission: "store_issue_voucher-read",
    label: "إذن صرف مخزن",
  },
  {
    path: "/warehouse/transfer",
    component: StoreTransfer,
    requiredPermission: "store_transfer-read",
    label: "تحويل بين المخازن",
  },
  {
    path: "/warehouse/inventory-count",
    component: InventoryCount,
    requiredPermission: "inventory_count-read",
    label: "جرد المخزون والتسوية",
  },

  // Sales
  {
    path: "/sales/pos",
    component: POS,
    requiredPermission: "pos-read",
    label: "نقطة بيع (POS)",
  },
  {
    path: "/sales/invoice",
    component: SalesInvoice,
    requiredPermission: "sales_invoice-read",
    label: "فاتورة مبيعات",
  },
  {
    path: "/sales/price-quotation",
    component: PriceQuotation,
    requiredPermission: "price_quotation-read",
    label: "عرض أسعار",
  },
  {
    path: "/sales/return",
    component: SalesReturn,
    requiredPermission: "sales_return-read",
    label: "مرتجع مبيعات",
  },
  {
    path: "/sales/daily",
    component: DailySales,
    requiredPermission: "daily_sales-read",
    label: "يومية المبيعات",
  },
  {
    path: "/sales/daily-returns",
    component: DailySalesReturns,
    requiredPermission: "daily_sales_returns-read",
    label: "يومية مرتجع المبيعات",
  },

  // Purchases
  {
    path: "/purchases/invoice",
    component: PurchaseInvoice,
    requiredPermission: "purchase_invoice-read",
    label: "فاتورة مشتريات",
  },
  {
    path: "/purchases/return",
    component: PurchaseReturn,
    requiredPermission: "purchase_return-read",
    label: "مرتجع مشتريات",
  },
  {
    path: "/purchases/daily",
    component: DailyPurchases,
    requiredPermission: "daily_purchases-read",
    label: "يومية المشتريات",
  },
  {
    path: "/purchases/daily-returns",
    component: DailyPurchaseReturns,
    requiredPermission: "daily_purchase_returns-read",
    label: "يومية مرتجع المشتريات",
  },

  // Customers
  {
    path: "/customers/add",
    component: AddCustomer,
    requiredPermission: "add_customer-read",
    label: "إضافة عميل",
  },
  {
    path: "/customers/add/:id",
    component: AddCustomer,
    requiredPermission: "add_customer-read",
    label: "تعديل عميل",
  },
  {
    path: "/customers/edit/:id",
    component: AddCustomer,
    requiredPermission: "add_customer-read",
    label: "تعديل عميل",
  },
  {
    path: "/customers/list",
    component: CustomersList,
    requiredPermission: "customers_list-read",
    label: "قائمة العملاء",
  },

  // Suppliers
  {
    path: "/suppliers/add",
    component: AddSupplier,
    requiredPermission: "add_supplier-read",
    label: "إضافة مورد",
  },
  {
    path: "/suppliers/add/:id",
    component: AddSupplier,
    requiredPermission: "add_supplier-read",
    label: "تعديل مورد",
  },
  {
    path: "/suppliers/edit/:id",
    component: AddSupplier,
    requiredPermission: "add_supplier-read",
    label: "تعديل مورد",
  },
  {
    path: "/suppliers/list",
    component: SuppliersList,
    requiredPermission: "suppliers_list-read",
    label: "قائمة الموردين",
  },

  // Financials - Expenses
  {
    path: "/financials/expenses/list",
    component: ExpensesList,
    requiredPermission: "expenses_list-read",
    label: "قائمة المصروفات",
  },
  {
    path: "/financials/expenses-list",
    component: ExpensesList,
    requiredPermission: "expenses_list-read",
    label: "قائمة المصروفات",
  },
  {
    path: "/financials/expenses/codes",
    component: ExpenseCodes,
    requiredPermission: "expense_codes-read",
    label: "أكواد المصروفات",
  },
  {
    path: "/financials/expense-codes",
    component: ExpenseCodes,
    requiredPermission: "expense_codes-read",
    label: "أكواد المصروفات",
  },
  {
    path: "/financials/expenses/types",
    component: ExpenseTypes,
    requiredPermission: "expense_types-read",
    label: "أنواع المصروفات",
  },
  {
    path: "/financials/expense-types",
    component: ExpenseTypes,
    requiredPermission: "expense_types-read",
    label: "أنواع المصروفات",
  },
  {
    path: "/financials/revenue-codes",
    component: RevenueCodes,
    requiredPermission: "revenue_codes-read",
    label: "أنواع الإيرادات",
  },

  // Financials - Current Accounts
  {
    path: "/financials/current-accounts/add",
    component: AddCurrentAccount,
    requiredPermission: "add_current_account-read",
    label: "إضافة حساب جاري",
  },
  {
    path: "/financials/add-current-account",
    component: AddCurrentAccount,
    requiredPermission: "add_current_account-read",
    label: "إضافة حساب جاري",
  },
  // Financials - Receivable Accounts
  {
    path: "/financials/receivable-accounts/add",
    component: AddReceivableAccount,
    requiredPermission: "add_receivable_account-read",
    label: "إضافة رصيد مدين"
  },
  {
    path: "/financials/receivable-accounts/add/:id",
    component: AddReceivableAccount,
    requiredPermission: "add_receivable_account-read",
    label: "تعديل رصيد مدين"
  },
  {
    path: "/financials/receivable-accounts/list",
    component: ReceivableAccountsList,
    requiredPermission: "receivable_accounts_list-read",
    label: "قائمة الأرصدة المدينة"
  },

  // Financials - Payable Accounts
  {
    path: "/financials/payable-accounts/add",
    component: AddPayableAccount,
    requiredPermission: "add_payable_account-read",
    label: "إضافة رصيد دائن"
  },
  {
    path: "/financials/payable-accounts/add/:id",
    component: AddPayableAccount,
    requiredPermission: "add_payable_account-read",
    label: "تعديل رصيد دائن"
  },
  {
    path: "/financials/payable-accounts/list",
    component: PayableAccountsList,
    requiredPermission: "payable_accounts_list-read",
    label: "قائمة الأرصدة الدائنة"
  },
  {
    path: "/financials/current-accounts/edit/:id",
    component: AddCurrentAccount,
    requiredPermission: "add_current_account-read",
    label: "تعديل حساب جاري",
  },
  {
    path: "/financials/current-accounts/list",
    component: CurrentAccountsList,
    requiredPermission: "current_accounts_list-read",
    label: "قائمة الحسابات الجارية",
  },

  // Financials - Safes & Banks
  {
    path: "/financials/safes",
    component: Safes,
    requiredPermission: "safes-read",
    label: "الخزنات",
  },
  {
    path: "/financials/banks",
    component: Banks,
    requiredPermission: "banks-read",
    label: "البنوك",
  },

  // Financials - Vouchers
  {
    path: "/financials/receipt-voucher",
    component: ReceiptVoucher,
    requiredPermission: "receipt_voucher-read",
    label: "سند قبض",
  },
  {
    path: "/financials/payment-voucher",
    component: PaymentVoucher,
    requiredPermission: "payment_voucher-read",
    label: "سند صرف",
  },
  {
    path: "/financials/internal-transfers",
    component: InternalTransfers,
    requiredPermission: "internal_transfers-read",
    label: "تحويلات بينية",
  },

  // Reports - Items
  {
    path: "/reports/items/movement",
    component: ItemMovementReport,
    requiredPermission: "item_movement_report-read",
    label: "حركة صنف",
  },
  {
    path: "/reports/items/balance",
    component: ItemBalanceReport,
    requiredPermission: "item_balance_report-read",
    label: "أرصدة الأصناف",
  },
  {
    path: "/reports/items/valuation",
    component: InventoryValuationReport,
    requiredPermission: "inventory_valuation_report-read",
    label: "تقييم المخزون",
  },
  {
    path: "/reports/items/inventory-valuation",
    component: InventoryValuationReport,
    requiredPermission: "inventory_valuation_report-read",
    label: "تقييم المخزون",
  },
  {
    path: "/reports/financial-analysis/liquidity",
    component: LiquidityReport,
    requiredPermission: "liquidity_report-read",
    label: "مؤشر السيولة والأمان",
  },
  {
    path: "/reports/financial-analysis/performance",
    component: FinancialPerformanceReport,
    requiredPermission: "financial_performance_report-read",
    label: "التحليل المالي المقارن",
  },
  {
    path: "/reports/financial-analysis/item-profitability",
    component: ItemProfitabilityReport,
    requiredPermission: "item_profitability_report-read",
    label: "تحليل ربحية الأصناف",
  },
  {
    path: "/reports/financial-analysis/debt-aging",
    component: DebtAgingReport,
    requiredPermission: "debt_aging_report-read",
    label: "تحليل أعمار الديون",
  },
  {
    path: "/reports/financial-analysis/stagnant-items",
    component: StagnantItemsReport,
    requiredPermission: "stagnant_items_report-read",
    label: "تحليل المخزون الراكد",
  },
  {
    path: "/reports/financial-analysis/vip-customers",
    component: VipCustomersReport,
    requiredPermission: "vip_customers_report-read",
    label: "كبار العملاء (VIP)",
  },
  {
    path: "/reports/financial-analysis/annual-sales",
    component: AnnualSales,
    requiredPermission: "annual_sales_report-read",
    label: "تقرير المبيعات السنوي",
  },

  // Reports - Customers
  {
    path: "/reports/customers/statement",
    component: CustomerStatementReport,
    requiredPermission: "customer_statement_report-read",
    label: "كشف حساب عميل",
  },
  {
    path: "/reports/customers/balance",
    component: CustomerBalanceReport,
    requiredPermission: "customer_balance_report-read",
    label: "أرصدة العملاء",
  },

  // Reports - Suppliers
  {
    path: "/reports/suppliers/statement",
    component: SupplierStatementReport,
    requiredPermission: "supplier_statement_report-read",
    label: "كشف حساب مورد",
  },
  {
    path: "/reports/suppliers/balance",
    component: SupplierBalanceReport,
    requiredPermission: "supplier_balance_report-read",
    label: "أرصدة الموردين",
  },

  // Reports - Financials
  {
    path: "/reports/financials/daily-collections",
    component: DailyCollectionsReport,
    requiredPermission: "daily_collections_report-read",
    label: "يومية التحصيلات",
  },
  {
    path: "/reports/financials/daily-payments",
    component: DailyPaymentsReport,
    requiredPermission: "daily_payments_report-read",
    label: "يومية الصرف",
  },
  {
    path: "/reports/financials/daily-transfers",
    component: DailyTransfersReport,
    requiredPermission: "daily_transfers_report-read",
    label: "يومية التحويلات",
  },
  {
    path: "/reports/financials/expense-statement",
    component: ExpenseStatementReport,
    requiredPermission: "expense_statement_report-read",
    label: "كشف حساب مصروفات",
  },
  {
    path: "/reports/financials/total-expenses",
    component: TotalExpensesReport,
    requiredPermission: "total_expenses_report-read",
    label: "إجمالي المصروفات",
  },
  {
    path: "/reports/financials/revenue-statement",
    component: RevenueStatementReport,
    requiredPermission: "revenue_statement_report-read",
    label: "كشف حساب إيرادات",
  },
  {
    path: "/reports/financials/total-revenues",
    component: TotalRevenuesReport,
    requiredPermission: "total_revenues_report-read",
    label: "إجمالي الإيرادات",
  },
  {
    path: "/reports/financials/current-account-statement",
    component: CurrentAccountStatementReport,
    requiredPermission: "current_account_statement_report-read",
    label: "كشف حساب جاري",
  },
  {
    path: "/reports/financials/total-current-accounts",
    component: TotalCurrentAccountsReport,
    requiredPermission: "total_current_accounts_report-read",
    label: "إجمالي الحسابات الجارية",
  },
  {
    path: "/reports/financials/receivable-account-statement",
    component: ReceivableAccountStatementReport,
    requiredPermission: "receivable_account_statement_report-read",
    label: "كشف حساب مدينة",
  },
  {
    path: "/reports/financials/total-receivable-accounts",
    component: TotalReceivableAccountsReport,
    requiredPermission: "total_receivable_accounts_report-read",
    label: "إجمالي الأرصدة المدينة",
  },
  {
    path: "/reports/financials/payable-account-statement",
    component: PayableAccountStatementReport,
    requiredPermission: "payable_account_statement_report-read",
    label: "كشف حساب دائنة",
  },
  {
    path: "/reports/financials/total-payable-accounts",
    component: TotalPayableAccountsReport,
    requiredPermission: "total_payable_accounts_report-read",
    label: "إجمالي الأرصدة الدائنة",
  },
  {
    path: "/reports/financials/safe-statement",
    component: SafeStatementReport,
    requiredPermission: "safe_statement_report-read",
    label: "كشف حساب خزينة",
  },
  {
    path: "/reports/financials/bank-statement",
    component: BankStatementReport,
    requiredPermission: "bank_statement_report-read",
    label: "كشف حساب بنك",
  },
  {
    path: "/reports/financials/tax-declaration",
    component: TaxDeclarationReport,
    requiredPermission: "tax_declaration_report-read",
    label: "الإقرار الضريبي",
  },
  {
    path: "/reports/financials/vat-statement",
    component: VATStatementReport,
    requiredPermission: "vat_statement_report-read",
    label: "كشف حساب الضريبة",
  },
  {
    path: "/reports/financials/total-cash",
    component: TotalCashReport,
    requiredPermission: "total_cash_report-read",
    label: "إجمالي النقدية",
  },

  // Final Accounts
  {
    path: "/final-accounts/income-statement",
    component: IncomeStatement,
    requiredPermission: "income_statement-read",
    label: "قائمة الدخل",
  },
  {
    path: "/final-accounts/balance-sheet",
    component: BalanceSheet,
    requiredPermission: "balance_sheet-read",
    label: "قائمة المركز المالي",
  },
  {
    path: "/final-accounts/audit-trial",
    component: AuditTrial,
    requiredPermission: "audit_trail-read",
    label: "ميزان المراجعة",
  },
];

/**
 * Helper function to get route config by path
 */
export const getRouteByPath = (path: string) => {
  // First try exact match
  let route = routeConfig.find((route) => route.path === path);

  // If no exact match, try pattern matching for dynamic routes
  if (!route) {
    route = routeConfig.find((route) => {
      if (route.path.includes(":")) {
        // Convert route pattern to regex
        const pattern = route.path.replace(/:\w+/g, "[^/]+");
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      }
      return false;
    });
  }

  return route;
};

/**
 * Helper function to get label by path
 */
export const getLabelByPath = (path: string): string => {
  // Handle dynamic routes with parameters
  if (path.startsWith("/items/edit/") || path.startsWith("/items/add/")) {
    const itemId = path.split("/").pop();

    // For now, show generic title - the component will override this with position
    return `تعديل صنف`;
  }

  if (path.startsWith("/customers/edit/") || (path.startsWith("/customers/add/") && path.split("/").length > 3)) {
    const customerId = path.split("/").pop();
    return `تعديل عميل #${customerId}`;
  }

  if (path.startsWith("/suppliers/edit/") || (path.startsWith("/suppliers/add/") && path.split("/").length > 3)) {
    const supplierId = path.split("/").pop();
    return `تعديل مورد #${supplierId}`;
  }

  if (path.startsWith("/financials/current-accounts/edit/")) {
    const accountId = path.split("/").pop();
    return `تعديل حساب جاري #${accountId}`;
  }

  const route = getRouteByPath(path);
  return route?.label || "صفحة غير معروفة";
};
