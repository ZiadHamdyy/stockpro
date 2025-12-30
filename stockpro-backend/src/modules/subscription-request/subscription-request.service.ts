import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { CreateSubscriptionRequestDto } from './dtos/request/create-subscription-request.request';
import { UpdateSubscriptionRequestStatusDto } from './dtos/request/update-subscription-request-status.request';
import { SubscriptionRequestResponseDto } from './dtos/response/subscription-request.response';
import { SubscriptionRequestStatus, SubscriptionRequestType } from '@prisma/client';

@Injectable()
export class SubscriptionRequestService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    data: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    const requestType = data.type || SubscriptionRequestType.SUBSCRIPTION;
    const isTrial = requestType === SubscriptionRequestType.TRIAL;
    
    const request = await this.prisma.subscriptionRequest.create({
      data: {
        type: requestType,
        plan: isTrial ? null : data.plan || null,
        name: data.name,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName || null,
        status: SubscriptionRequestStatus.PENDING,
        trialDurationDays: isTrial ? 14 : null,
      },
    });

    return this.mapToResponse(request);
  }

  async findAll(
    status?: SubscriptionRequestStatus,
    type?: SubscriptionRequestType,
  ): Promise<SubscriptionRequestResponseDto[]> {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const requests = await this.prisma.subscriptionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) => this.mapToResponse(request));
  }

  async findOne(id: string): Promise<SubscriptionRequestResponseDto> {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    return this.mapToResponse(request);
  }

  async updateStatus(
    id: string,
    data: UpdateSubscriptionRequestStatusDto,
  ): Promise<SubscriptionRequestResponseDto> {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    const updated = await this.prisma.subscriptionRequest.update({
      where: { id },
      data: { status: data.status },
    });

    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    await this.prisma.subscriptionRequest.delete({
      where: { id },
    });
  }

  private mapToResponse(
    request: any,
  ): SubscriptionRequestResponseDto {
    return {
      id: request.id,
      type: request.type,
      plan: request.plan,
      name: request.name,
      email: request.email,
      phone: request.phone,
      companyName: request.companyName,
      status: request.status,
      trialDurationDays: request.trialDurationDays,
      trialStartDate: request.trialStartDate,
      trialEndDate: request.trialEndDate,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}

