import {
  HomeIcon,
  SettingsIcon,
  BoxIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  UsersIcon,
  TruckIcon,
  LandmarkIcon,
  BarChartIcon,
  BookOpenCheckIcon,
  DatabaseIcon,
  DatabaseBackupIcon,
  DollarSignIcon,
} from "./components/icons";
import type { MenuItem } from "./types";

export const MENU_ITEMS: MenuItem[] = [
  { key: "dashboard", label: "الرئيسية", icon: HomeIcon },
  {
    key: "settings",
    label: "الإعدادات",
    icon: SettingsIcon,
    children: [
      { key: "company_data", label: "بيانات الشركة", icon: DatabaseIcon },
      { key: "branches_data", label: "بيانات الفروع", icon: DatabaseIcon },
      { key: "stores_data", label: "بيانات المخازن", icon: DatabaseIcon },
      { key: "users_data", label: "بيانات المستخدمين", icon: DatabaseIcon },
      { key: "permissions", label: "الصلاحيات", icon: DatabaseIcon },
      {
        key: "database",
        label: "قاعدة البيانات",
        icon: DatabaseIcon,
        children: [
          {
            key: "database_backup",
            label: "نسخة احتياطية",
            icon: DatabaseBackupIcon,
          },
        ],
      },
    ],
  },
  {
    key: "items",
    label: "الأصناف",
    icon: BoxIcon,
    children: [
      { key: "add_item", label: "إضافة صنف", icon: BoxIcon },
      { key: "items_list", label: "قائمة الأصناف", icon: BoxIcon },
      { key: "item_groups", label: "مجموعات الأصناف", icon: BoxIcon },
      { key: "units", label: "الوحدات", icon: BoxIcon },
    ],
  },
  {
    key: "warehouse_operations",
    label: "عمليات المخازن",
    icon: ReceiptIcon,
    children: [
      {
        key: "store_receipt_voucher",
        label: "إذن إضافة مخزن",
        icon: ReceiptIcon,
      },
      { key: "store_issue_voucher", label: "إذن صرف مخزن", icon: ReceiptIcon },
      { key: "store_transfer", label: "تحويل بين المخازن", icon: ReceiptIcon },
    ],
  },
  {
    key: "sales",
    label: "المبيعات",
    icon: ShoppingCartIcon,
    children: [
      { key: "sales_invoice", label: "فاتورة مبيعات", icon: ShoppingCartIcon },
      { key: "sales_return", label: "مرتجع مبيعات", icon: ShoppingCartIcon },
      { key: "daily_sales", label: "يومية المبيعات", icon: ShoppingCartIcon },
      {
        key: "daily_sales_returns",
        label: "يومية مرتجع المبيعات",
        icon: ShoppingCartIcon,
      },
    ],
  },
  {
    key: "purchases",
    label: "المشتريات",
    icon: ReceiptIcon,
    children: [
      { key: "purchase_invoice", label: "فاتورة مشتريات", icon: ReceiptIcon },
      { key: "purchase_return", label: "مرتجع مشتريات", icon: ReceiptIcon },
      { key: "daily_purchases", label: "يومية المشتريات", icon: ReceiptIcon },
      {
        key: "daily_purchase_returns",
        label: "يومية مرتجع المشتريات",
        icon: ReceiptIcon,
      },
    ],
  },
  {
    key: "customers",
    label: "العملاء",
    icon: UsersIcon,
    children: [
      { key: "add_customer", label: "إضافة عميل", icon: UsersIcon },
      { key: "customers_list", label: "قائمة العملاء", icon: UsersIcon },
    ],
  },
  {
    key: "suppliers",
    label: "الموردين",
    icon: TruckIcon,
    children: [
      { key: "add_supplier", label: "إضافة مورد", icon: TruckIcon },
      { key: "suppliers_list", label: "قائمة الموردين", icon: TruckIcon },
    ],
  },
  {
    key: "general_accounts",
    label: "الحسابات العامة",
    icon: LandmarkIcon,
    children: [
      {
        key: "expenses_management",
        label: "المصروفات",
        icon: LandmarkIcon,
        children: [
          {
            key: "expenses_list",
            label: "قائمة المصروفات",
            icon: LandmarkIcon,
          },
          {
            key: "expense_codes",
            label: "أكواد المصروفات",
            icon: LandmarkIcon,
          },
          {
            key: "expense_types",
            label: "أنواع المصروفات",
            icon: LandmarkIcon,
          },
        ],
      },
      {
        key: "current_accounts",
        label: "الحسابات الجارية",
        icon: LandmarkIcon,
        children: [
          {
            key: "add_current_account",
            label: "إضافة حساب جاري",
            icon: LandmarkIcon,
          },
          {
            key: "current_accounts_list",
            label: "قائمة الحسابات الجارية",
            icon: LandmarkIcon,
          },
        ],
      },
      { key: "safes", label: "الخزنات", icon: LandmarkIcon },
      { key: "banks", label: "البنوك", icon: LandmarkIcon },
    ],
  },
  {
    key: "financials",
    label: "الحركة المالية",
    icon: DollarSignIcon,
    children: [
      { key: "receipt_voucher", label: "سند قبض", icon: DollarSignIcon },
      { key: "payment_voucher", label: "سند صرف", icon: DollarSignIcon },
    ],
  },
  {
    key: "reports",
    label: "التقارير",
    icon: BarChartIcon,
    children: [
      {
        key: "item_reports",
        label: "تقارير الأصناف",
        icon: BarChartIcon,
        children: [
          {
            key: "item_movement_report",
            label: "حركة صنف",
            icon: BarChartIcon,
          },
          {
            key: "item_balance_report",
            label: "أرصدة الأصناف",
            icon: BarChartIcon,
          },
          {
            key: "inventory_valuation_report",
            label: "تقييم المخزون",
            icon: BarChartIcon,
          },
        ],
      },
      {
        key: "customer_reports",
        label: "تقارير العملاء",
        icon: BarChartIcon,
        children: [
          {
            key: "customer_statement_report",
            label: "كشف حساب عميل",
            icon: BarChartIcon,
          },
          {
            key: "customer_balance_report",
            label: "أرصدة العملاء",
            icon: BarChartIcon,
          },
        ],
      },
      {
        key: "supplier_reports",
        label: "تقارير الموردين",
        icon: BarChartIcon,
        children: [
          {
            key: "supplier_statement_report",
            label: "كشف حساب مورد",
            icon: BarChartIcon,
          },
          {
            key: "supplier_balance_report",
            label: "أرصدة الموردين",
            icon: BarChartIcon,
          },
        ],
      },
      {
        key: "financial_reports",
        label: "تقارير مالية",
        icon: BarChartIcon,
        children: [
          {
            key: "daily_collections_report",
            label: "يومية التحصيلات",
            icon: BarChartIcon,
          },
          {
            key: "daily_payments_report",
            label: "يومية الصرف",
            icon: BarChartIcon,
          },
          {
            key: "expense_statement_report",
            label: "كشف حساب مصروفات",
            icon: BarChartIcon,
          },
          {
            key: "total_expenses_report",
            label: "إجمالي المصروفات",
            icon: BarChartIcon,
          },
          {
            key: "current_account_statement_report",
            label: "كشف حساب جاري",
            icon: BarChartIcon,
          },
          {
            key: "total_current_accounts_report",
            label: "إجمالي الحسابات الجارية",
            icon: BarChartIcon,
          },
          {
            key: "safe_statement_report",
            label: "كشف حساب خزينة",
            icon: BarChartIcon,
          },
          {
            key: "bank_statement_report",
            label: "كشف حساب بنك",
            icon: BarChartIcon,
          },
          {
            key: "tax_declaration_report",
            label: "الإقرار الضريبي",
            icon: BarChartIcon,
          },
        ],
      },
    ],
  },
  {
    key: "final_accounts",
    label: "الحسابات الختامية",
    icon: BookOpenCheckIcon,
    children: [
      {
        key: "income_statement",
        label: "قائمة الدخل",
        icon: BookOpenCheckIcon,
      },
      {
        key: "balance_sheet",
        label: "قائمة المركز المالي",
        icon: BookOpenCheckIcon,
      },
    ],
  },
];

// Permission mappings between Arabic frontend and English backend
export const ARABIC_TO_ENGLISH_ACTIONS = {
  قراءة: "read",
  جديد: "create",
  تعديل: "update",
  حذف: "delete",
  بحث: "search",
  طباعة: "print",
} as const;

export const ARABIC_TO_ENGLISH_ROLES = {
  مدير: "manager",
  محاسب: "accountant",
  بائع: "salesperson",
  "مدخل بيانات": "data_entry",
} as const;

export const ENGLISH_TO_ARABIC_ROLES = {
  manager: "مدير",
  accountant: "محاسب",
  salesperson: "بائع",
  data_entry: "مدخل بيانات",
} as const;

export const PERMISSION_ACTIONS = [
  "قراءة",
  "جديد",
  "تعديل",
  "حذف",
  "بحث",
  "طباعة",
];
