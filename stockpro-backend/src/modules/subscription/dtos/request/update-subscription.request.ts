import { IsEnum, IsDateString, IsOptional } from 'class-validator';
import { SubscriptionPlanType } from '@prisma/client';

export class UpdateSubscriptionRequest {
  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

