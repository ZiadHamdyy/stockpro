import { Expose, Type } from 'class-transformer';

class ExpenseCode {
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
  userId: string;

  @Expose()
  branchId?: string | null;

  @Expose()
  @Type(() => ExpenseCode)
  expenseCode?: ExpenseCode;

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
