import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleRequest } from './create-role.request';

export class UpdateRoleRequest extends PartialType(CreateRoleRequest) {}
