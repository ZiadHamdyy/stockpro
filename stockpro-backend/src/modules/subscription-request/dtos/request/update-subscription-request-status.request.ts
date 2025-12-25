import { IsEnum } from 'class-validator';
import { SubscriptionRequestStatus } from '@prisma/client';

export class UpdateSubscriptionRequestStatusDto {
  @IsEnum(SubscriptionRequestStatus)
  status: SubscriptionRequestStatus;
}

