import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailRequest {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

