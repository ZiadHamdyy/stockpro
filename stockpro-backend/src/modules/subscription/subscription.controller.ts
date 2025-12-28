import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';
import { UpdateSubscriptionRequest } from './dtos/request/update-subscription.request';
import { RenewSubscriptionRequest } from './dtos/request/renew-subscription.request';
import { SubscriptionResponse } from './dtos/response/subscription.response';
import { PlanLimitsResponse } from './dtos/response/plan-limits.response';
import { UsageStatsResponse } from './dtos/response/usage-stats.response';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Get current subscription for company
   */
  @Get('current')
  @Auth()
  async getCurrentSubscription(
    @currentCompany('id') companyId: string,
  ): Promise<SubscriptionResponse> {
    return this.subscriptionService.getCompanySubscription(companyId);
  }

  /**
   * Get plan limits for current subscription
   */
  @Get('limits')
  @Auth()
  async getPlanLimits(
    @currentCompany('id') companyId: string,
  ): Promise<PlanLimitsResponse> {
    return this.subscriptionService.getPlanLimits(companyId);
  }

  /**
   * Get current usage statistics
   */
  @Get('usage')
  @Auth()
  async getUsageStats(
    @currentCompany('id') companyId: string,
  ): Promise<UsageStatsResponse> {
    return this.subscriptionService.getUsageStats(companyId);
  }

  /**
   * Update subscription plan (superadmin only)
   */
  @Post('upgrade')
  @Auth({ permissions: ['subscription:update'] })
  async upgradeSubscription(
    @currentCompany('id') companyId: string,
    @Body() data: UpdateSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    const startDate = data.startDate ? new Date(data.startDate) : undefined;
    const endDate = data.endDate ? new Date(data.endDate) : undefined;
    return this.subscriptionService.updateSubscription(
      companyId,
      data.planType,
      startDate,
      endDate,
    );
  }

  /**
   * Get subscription by company code (superadmin only)
   */
  @Get('by-code')
  @Auth({ permissions: ['subscription:read'] })
  async getSubscriptionByCode(
    @Query('code') code: string,
  ): Promise<SubscriptionResponse> {
    return this.subscriptionService.getSubscriptionByCode(code);
  }

  /**
   * Renew subscription by company code (superadmin only)
   */
  @Post('renew')
  @Auth({ permissions: ['subscription:update'] })
  async renewSubscription(
    @Body() data: RenewSubscriptionRequest,
  ): Promise<SubscriptionResponse> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return this.subscriptionService.renewSubscriptionByCode(
      data.code,
      data.planType,
      startDate,
      endDate,
    );
  }
}

