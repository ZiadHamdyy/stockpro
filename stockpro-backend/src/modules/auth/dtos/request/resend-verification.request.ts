import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
