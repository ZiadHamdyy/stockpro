import { Expose } from 'class-transformer';

export class SafeResponse {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  branchId: string;

  @Expose()
  branchName: string;

  @Expose()
  openingBalance: number;

  @Expose()
  currentBalance: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
