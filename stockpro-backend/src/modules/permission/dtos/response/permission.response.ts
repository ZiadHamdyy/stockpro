import { Expose } from 'class-transformer';

export class PermissionResponse {
  @Expose()
  id: string;

  @Expose()
  resource: string;

  @Expose()
  action: string;

  @Expose()
  description?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
