import { Expose } from 'class-transformer';

export class FiscalYearResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  status: 'OPEN' | 'CLOSED';

  @Expose()
  retainedEarnings: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

