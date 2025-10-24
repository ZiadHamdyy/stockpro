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
  avatar?: string | null;
  fullName?: string;
  username?: string;
  password?: string;
  branch?: string;
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
  items: StoreVoucherItem[];
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  commercialReg: string;
  taxNumber: string;
  nationalAddress: string;
  phone: string;
  openingBalance: number;
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
  type: string;
  openingBalance: number;
}

export interface Safe {
  id: number;
  code: string;
  name: string;
  branch: string;
  openingBalance: number;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  accountNumber: string;
  iban: string;
  openingBalance: number;
}

export interface VoucherEntity {
  type: "customer" | "supplier" | "current_account" | "expense";
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
