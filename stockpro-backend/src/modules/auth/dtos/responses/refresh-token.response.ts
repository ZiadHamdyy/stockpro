import { Expose } from 'class-transformer';

export class RefreshTokenResponse {
  @Expose()
  accessToken: string;
}
