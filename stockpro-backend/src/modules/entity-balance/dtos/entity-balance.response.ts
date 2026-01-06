import { Expose } from 'class-transformer';

export class EntityLastTransactionInfo {
  @Expose()
  amount!: number;

  @Expose()
  date!: Date;
}

export class EntityBalanceResponse {
  @Expose()
  entityType!: string;

  @Expose()
  entityId!: string;

  @Expose()
  balance!: number;

  @Expose()
  lastInvoice?: EntityLastTransactionInfo | null;

  @Expose()
  lastReceipt?: EntityLastTransactionInfo | null;
}


