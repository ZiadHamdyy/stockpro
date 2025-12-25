import { SubscriptionRequestStatus } from '@prisma/client';

export class SubscriptionRequestResponseDto {
  id: string;
  plan: string;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  status: SubscriptionRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

