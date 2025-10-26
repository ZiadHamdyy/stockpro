import { Expose, Type } from 'class-transformer';

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

export class RoleResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  isSystem: boolean;

  @Expose()
  @Type(() => PermissionResponse)
  permissions?: PermissionResponse[];
}

export class UserIdResponse {
  @Expose()
  id: string;
}

export class UpdateUserResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  image: string;

  @Expose()
  active: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class BranchResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address?: string;

  @Expose()
  phone?: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class UserResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  image: string;

  @Expose()
  active: boolean;

  @Expose()
  emailVerified: boolean;

  @Expose()
  @Type(() => RoleResponse)
  role?: RoleResponse;

  @Expose()
  @Type(() => BranchResponse)
  branch: BranchResponse;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
