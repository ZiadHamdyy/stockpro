import { SubscriptionRequestStatus, SubscriptionRequestType } from '@prisma/client';

export class SubscriptionRequestResponseDto {
  id: string;
  type: SubscriptionRequestType;
  plan: string | null;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  status: SubscriptionRequestStatus;
  trialDurationDays: number | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

