import { Expose } from 'class-transformer';

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
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
