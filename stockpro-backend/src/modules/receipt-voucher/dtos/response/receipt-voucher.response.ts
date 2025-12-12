import { Expose, Type } from 'class-transformer';

class Branch {
  @Expose()
  id: string;

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

export class ReceiptVoucherResponse {
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
  receivableAccountId?: string | null;

  @Expose()
  payableAccountId?: string | null;

  @Expose()
  revenueCodeId?: string | null;

  @Expose()
  userId: string;

  @Expose()
  branchId?: string | null;

  @Expose()
  @Type(() => Branch)
  branch?: Branch | null;

  @Expose()
  @Type(() => RevenueCode)
  revenueCode?: RevenueCode | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
