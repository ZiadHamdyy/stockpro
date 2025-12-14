import { IsEnum } from 'class-validator';
import { SubscriptionPlanType } from '@prisma/client';

export class UpdateSubscriptionRequest {
  @IsEnum(SubscriptionPlanType)
  planType: SubscriptionPlanType;
}

