import { Expose, Type } from 'class-transformer';

class UserInfo {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

export class CreateIfNotExistsResponse {
  @Expose()
  success: boolean;

  @Expose()
  userCreated: boolean;

  @Expose()
  @Type(() => UserInfo)
  user: UserInfo | null;

  @Expose()
  token: string | null;
}
