import { Expose } from 'class-transformer';
import { UserResponse } from '../../../../modules/user/dtos/response/user.response';

export class AuthResponse {
  @Expose()
  user: UserResponse;

  @Expose()
  accessToken: string;
}
