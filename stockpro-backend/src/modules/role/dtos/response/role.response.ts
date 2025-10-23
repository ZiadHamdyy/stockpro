import { Expose, Type } from 'class-transformer';
import { PermissionResponse } from '../../../permission/dtos/response/permission.response';

export class RoleResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string | null;

  @Expose()
  isSystem: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => PermissionResponse)
  permissions?: PermissionResponse[];
}
