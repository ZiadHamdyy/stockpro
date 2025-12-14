import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';
import { PlanLimits } from '../constants/plan-limits.constants';

export const SUBSCRIPTION_RESOURCE_KEY = 'subscriptionResource';

/**
 * Decorator to specify which resource to check subscription limits for
 */
export const CheckSubscriptionLimit = (resource: keyof PlanLimits) =>
  Reflect.metadata(SUBSCRIPTION_RESOURCE_KEY, resource);

/**
 * Guard to check subscription limits before allowing resource creation
 */
@Injectable()
export class SubscriptionLimitGuard implements CanActivate {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.get<keyof PlanLimits>(
      SUBSCRIPTION_RESOURCE_KEY,
      context.getHandler(),
    );

    // If no resource is specified, allow access
    if (!resource) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyId = request.companyId;

    if (!companyId) {
      throw new ForbiddenException('Company ID not found in request');
    }

    // Check the limit
    const result = await this.subscriptionService.checkLimit(companyId, resource);

    if (!result.allowed) {
      throw new ForbiddenException({
        message: `Subscription limit reached for ${resource}. You are using ${result.current} of ${result.limit} allowed. Please upgrade your plan to continue.`,
        error: 'SUBSCRIPTION_LIMIT_REACHED',
        resource,
        current: result.current,
        limit: result.limit,
        percentage: result.percentage,
      });
    }

    return true;
  }
}

