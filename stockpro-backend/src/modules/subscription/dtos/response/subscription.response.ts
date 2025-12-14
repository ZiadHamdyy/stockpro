import { SubscriptionPlanType, SubscriptionStatus } from '@prisma/client';

export class SubscriptionResponse {
  id: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

