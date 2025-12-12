import { Expose, Type } from 'class-transformer';

class ExpenseCode {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  name: string;
}

class RevenueCode {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  name: string;
}

class Safe {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

class Bank {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

class Branch {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class PaymentVoucherResponse {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  date: Date;

  @Expose()
  entityType: string;

  @Expose()
  entityName: string;

  @Expose()
  amount: number;

  @Expose()
  priceBeforeTax?: number | null;

  @Expose()
  taxPrice?: number | null;

  @Expose()
  description?: string | null;

  @Expose()
  paymentMethod: string;

  @Expose()
  safeId?: string | null;

  @Expose()
  bankId?: string | null;

  @Expose()
  customerId?: string | null;

  @Expose()
  supplierId?: string | null;

  @Expose()
  currentAccountId?: string | null;

  @Expose()
  expenseCodeId?: string | null;

  @Expose()
  revenueCodeId?: string | null;

  @Expose()
  receivableAccountId?: string | null;

  @Expose()
  payableAccountId?: string | null;

  @Expose()
  userId: string;

  @Expose()
  branchId?: string | null;

  @Expose()
  @Type(() => Branch)
  branch?: Branch | null;

  @Expose()
  @Type(() => ExpenseCode)
  expenseCode?: ExpenseCode;

  @Expose()
  @Type(() => RevenueCode)
  revenueCode?: RevenueCode;

  @Expose()
  @Type(() => Safe)
  safe?: Safe;

  @Expose()
  @Type(() => Bank)
  bank?: Bank;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
