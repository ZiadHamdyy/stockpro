import type React from "react";

export interface MenuItem {
  key: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  children?: MenuItem[];
}

export interface Notification {
  id: string;
  type: "stock" | "invoice";
  message: string;
  date: string;
  relatedId?: string | number;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
}

export interface Store {
  id: number;
  name: string;
  branch: string;
  manager: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  image?: string | null;
  avatar?: string | null;
  fullName?: string;
  username?: string;
  password?: string;
  branch?: string;
  branchId?: string;
  permissionGroup?: string;
}

export interface PermissionNode {
  key: string;
  label: string;
  children?: PermissionNode[];
}

export interface ItemGroup {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  code: string;
  barcode?: string;
  name: string;
  group: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  reorderLimit: number;
  stock_date_placeholder?: string;
}

export interface CompanyInfo {
  name: string;
  activity: string;
  address: string;
  phone: string;
  taxNumber: string;
  commercialReg: string;
  currency: string;
  logo: string | null;
  capital: number;
  vatRate: number;
  isVatEnabled: boolean;
}

export interface InvoiceItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string; // The invoice number
  date: string;
  customerOrSupplier: { id: string; name: string } | null;
  items: InvoiceItem[];
  totals: { subtotal: number; discount: number; tax: number; net: number };
  paymentMethod: "cash" | "credit";
  paymentTerms?: number; // Days until due for credit invoices
  userName: string;
  branchName: string;
  paymentTargetType?: "safe" | "bank";
  paymentTargetId?: number | null;
}

export interface StoreVoucherItem {
  id: string; // item id
  name: string;
  unit: string;
  qty: number;
  code: string; // item code
  price?: number;
}

export interface StoreReceiptVoucher {
  id: string; // The voucher number
  date: string;
  branch: string;
  items: StoreVoucherItem[];
}

export type StoreIssueVoucher = StoreReceiptVoucher;

export interface StoreTransferVoucher {
  id: string; // The voucher number
  date: string;
  fromStore: string;
  toStore: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  items: StoreVoucherItem[];
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
  currentBalance: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
  currentBalance: number;
}

export interface ExpenseCode {
  id: number;
  code: string;
  name: string;
  type: string;
}

export interface Expense {
  id: number;
  code: string;
  date: string;
  expenseCodeId: number;
  expenseCode: string;
  expenseCodeName: string;
  expenseCodeType: string;
  amount: number;
  description: string;
}

export interface ExpenseType {
  id: number;
  name: string;
}

export interface CurrentAccount {
  id: number;
  code: string;
  name: string;
  type?: string;
  openingBalance: number;
}

export interface Safe {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchName: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  code: string;
  name: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
}

export interface VoucherEntity {
  type:
    | "customer"
    | "supplier"
    | "current_account"
    | "receivable_account"
    | "payable_account"
    | "expense"
    | "expense-Type"
    | "vat";
  id: string | number | null;
  name: string;
}

export interface Voucher {
  id: string; // voucher number
  type: "receipt" | "payment";
  date: string;
  entity: VoucherEntity;
  amount: number;
  description: string;
  paymentMethod: "safe" | "bank";
  safeOrBankId: number | null;
  userName: string;
  branchName: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

export interface AssignPermissionsRequest {
  permissionIds: string[];
}

export interface FiscalYear {
  id: string;
  name: string; 
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED'; 
  retainedEarnings?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: number;
  userName: string;
  branchName?: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'other';
  targetType: string;
  targetId?: string | number;
  details: string;
}

export interface InventoryCountItem {
  id: string; 
  name: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  cost: number; 
}

export interface InventoryCount {
  id: string;
  date: string;
  storeName: string;
  branchName: string;
  items: InventoryCountItem[];
  totalVarianceValue: number; 
  status: 'pending' | 'posted'; 
  notes: string;
}
export interface Quotation {
  id: string;
  date: string;
  expiryDate: string;
  customer: { id: string; name: string } | null;
  items: InvoiceItem[];
  totals: { subtotal: number; discount: number; tax: number; net: number };
  notes: string;
  status: 'draft' | 'sent' | 'converted' | 'expired';
  userName: string;
  branchName: string;
}

export interface EpsonSettings {
  pageWidth: number;        // mm, default 80
  pageHeight?: number;       // mm, auto if undefined
  fonts: {
    header: number;          // px, default 14
    body: number;           // px, default 12
    items: number;          // px, default 11
    totals: number;         // px, default 13
    footer: number;         // px, default 10
  };
  spacing: {
    marginTop: number;      // mm
    marginBottom: number;   // mm
    marginLeft: number;     // mm
    marginRight: number;    // mm
    sectionGap: number;     // mm
  };
  alignment: {
    header: 'left' | 'center' | 'right';
    items: 'left' | 'center' | 'right';
    totals: 'left' | 'center' | 'right';
    footer: 'left' | 'center' | 'right';
  };
  positioning: {
    branchName: number;     // px offset
    date: number;
    customerType: number;
    itemName: number;
    itemQty: number;
    itemPrice: number;
    itemTaxable: number;
    itemDiscount: number;
    itemTaxRate: number;
    itemTax: number;
    itemTotal: number;
    totalsSubtotal: number;
    totalsTax: number;
    totalsNet: number;
    qrCode: number;
    footerText: number;
  };
  visibility?: {
    branchName?: boolean;
    date?: boolean;
    customerType?: boolean;
    customerName?: boolean;
    employeeName?: boolean;
    itemName?: boolean;
    itemQty?: boolean;
    itemPrice?: boolean;
    itemTaxable?: boolean;
    itemDiscount?: boolean;
    itemTaxRate?: boolean;
    itemTax?: boolean;
    itemTotal?: boolean;
    totalsSubtotal?: boolean;
    totalsDiscount?: boolean;
    totalsTax?: boolean;
    totalsNet?: boolean;
    qrCode?: boolean;
    footerText?: boolean;
    tafqeet?: boolean;
  };
}

export interface PrintSettings {
  template: 'default' | 'classic' | 'modern' | 'minimal' | 'thermal' | 'epson';
  showLogo: boolean;
  showTaxNumber: boolean;
  showAddress: boolean;
  headerText: string;
  footerText: string;
  termsText: string;
  epsonSettings?: EpsonSettings;
}