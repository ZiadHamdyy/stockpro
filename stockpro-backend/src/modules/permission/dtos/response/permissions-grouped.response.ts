import { Expose, Type } from 'class-transformer';
import { PermissionResponse } from './permission.response';

export class PermissionsGroupedResponse {
  @Expose()
  resource: string;

  @Expose()
  @Type(() => PermissionResponse)
  permissions: PermissionResponse[];
}
