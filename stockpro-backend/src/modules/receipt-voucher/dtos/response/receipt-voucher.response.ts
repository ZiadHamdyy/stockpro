import { Expose } from 'class-transformer';

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
  userId: string;

  @Expose()
  branchId?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
