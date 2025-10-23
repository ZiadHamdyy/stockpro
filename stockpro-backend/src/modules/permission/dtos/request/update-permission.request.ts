import { PartialType } from '@nestjs/mapped-types';
import { CreatePermissionRequest } from './create-permission.request';

export class UpdatePermissionRequest extends PartialType(
  CreatePermissionRequest,
) {}
