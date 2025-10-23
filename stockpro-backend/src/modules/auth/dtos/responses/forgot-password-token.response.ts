import { Expose } from 'class-transformer';

export class ForgotPasswordTokenResponse {
  @Expose()
  message: string;

  @Expose()
  email: string;
}
