import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateSubscriptionRequestDto {
  @IsString()
  @IsIn(['basic', 'pro', 'enterprise'])
  plan: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  companyName?: string;
}

