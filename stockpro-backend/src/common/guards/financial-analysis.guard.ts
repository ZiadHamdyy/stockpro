import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';

/**
 * Guard to check if financial analysis features are enabled for the company's subscription plan
 */
@Injectable()
export class FinancialAnalysisGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const companyId = request.companyId;

    if (!companyId) {
      throw new ForbiddenException('Company ID not found in request');
    }

    const isEnabled = await this.subscriptionService.isFinancialAnalysisEnabled(companyId);

    if (!isEnabled) {
      throw new ForbiddenException({
        message: 'Financial analysis features are not available in your current subscription plan. Please upgrade to access these features.',
        error: 'FINANCIAL_ANALYSIS_NOT_AVAILABLE',
        feature: 'financial_analysis',
      });
    }

    return true;
  }
}

