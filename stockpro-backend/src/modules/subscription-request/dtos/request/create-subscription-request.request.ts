import { IsString, IsEmail, IsOptional, IsIn, IsEnum } from 'class-validator';
import { SubscriptionRequestType } from '@prisma/client';

export class CreateSubscriptionRequestDto {
  @IsEnum(SubscriptionRequestType)
  @IsOptional()
  type?: SubscriptionRequestType;

  @IsString()
  @IsIn(['basic', 'pro', 'enterprise'])
  @IsOptional()
  plan?: string;

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

