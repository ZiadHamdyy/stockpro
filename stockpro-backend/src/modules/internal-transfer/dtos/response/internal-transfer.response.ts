import { Expose, Type } from 'class-transformer';

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

export class InternalTransferResponse {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  date: Date;

  @Expose()
  amount: number;

  @Expose()
  description?: string | null;

  @Expose()
  fromType: string;

  @Expose()
  fromSafeId?: string | null;

  @Expose()
  fromBankId?: string | null;

  @Expose()
  toType: string;

  @Expose()
  toSafeId?: string | null;

  @Expose()
  toBankId?: string | null;

  @Expose()
  userId: string;

  @Expose()
  branchId?: string | null;

  @Expose()
  @Type(() => Safe)
  fromSafe?: Safe;

  @Expose()
  @Type(() => Bank)
  fromBank?: Bank;

  @Expose()
  @Type(() => Safe)
  toSafe?: Safe;

  @Expose()
  @Type(() => Bank)
  toBank?: Bank;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

