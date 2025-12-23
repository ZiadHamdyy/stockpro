import { BankTransactionType } from '@prisma/client';

export class SalesInvoiceResponse {
  id: string;
  code: string;
  date: Date;
  customerId?: string;
  customerName?: string | null;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  paymentMethod: string;
  paymentTargetType?: string;
  paymentTargetId?: string;
  safeId?: string;
  safe?: {
    id: string;
    name: string;
  } | null;
  bankId?: string;
  bank?: {
    id: string;
    name: string;
  } | null;
  bankTransactionType?: BankTransactionType;
  isSplitPayment?: boolean;
  splitCashAmount?: number;
  splitBankAmount?: number;
  splitSafeId?: string;
  splitBankId?: string;
  notes?: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
