import { Expose, Type } from 'class-transformer';

export class RoleResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  isSystem: boolean;
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
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
