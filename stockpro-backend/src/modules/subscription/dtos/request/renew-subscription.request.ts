import { IsEnum, IsDateString, IsString, IsNotEmpty, Matches } from 'class-validator';
import { SubscriptionPlanType } from '@prisma/client';

export class RenewSubscriptionRequest {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6,8}$/, { message: 'Company code must be 6-8 digits' })
  code: string;

  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}

