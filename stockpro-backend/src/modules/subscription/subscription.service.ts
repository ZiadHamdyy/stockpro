import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import {
  PLAN_LIMITS,
  PlanLimits,
  LimitableResource,
  isUnlimited,
  getResourceLimit,
} from '../../common/constants/plan-limits.constants';
import { SubscriptionPlanType, SubscriptionStatus } from '@prisma/client';

export interface UsageStats {
  users: number;
  branches: number;
  stores: number;
  safes: number;
  banks: number;
  invoicesThisMonth: number;
  customers: number;
  suppliers: number;
  items: number;
  priceQuotationsThisMonth: number;
  financialVouchersThisMonth: number;
  currentAccounts: number;
  expenseRevenueThisMonth: number;
  receivableAccounts: number;
  payableAccounts: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  resourceName: string;
}

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Get company's current subscription
   */
  async getCompanySubscription(companyId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { company: { select: { id: true, name: true, host: true } } },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found for this company');
    }

    return subscription;
  }

  /**
   * Get plan limits for a company
   */
  async getPlanLimits(companyId: string): Promise<PlanLimits> {
    const subscription = await this.getCompanySubscription(companyId);
    return PLAN_LIMITS[subscription.planType];
  }

  /**
   * Get current usage statistics for a company
   */
  async getUsageStats(companyId: string): Promise<UsageStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      users,
      branches,
      stores,
      safes,
      banks,
      salesInvoices,
      salesReturns,
      purchaseInvoices,
      purchaseReturns,
      customers,
      suppliers,
      items,
      priceQuotations,
      receiptVouchers,
      paymentVouchers,
      internalTransfers,
      currentAccounts,
      expenses,
      receivableAccounts,
      payableAccounts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { companyId } }),
      this.prisma.branch.count({ where: { companyId } }),
      this.prisma.store.count({ where: { companyId } }),
      this.prisma.safe.count({ where: { companyId } }),
      this.prisma.bank.count({ where: { companyId } }),
      this.prisma.salesInvoice.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.salesReturn.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.purchaseInvoice.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.purchaseReturn.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.customer.count({ where: { companyId } }),
      this.prisma.supplier.count({ where: { companyId } }),
      this.prisma.item.count({ where: { companyId } }),
      this.prisma.priceQuotation.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.receiptVoucher.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.paymentVoucher.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.internalTransfer.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.currentAccount.count({ where: { companyId } }),
      this.prisma.expense.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.receivableAccount.count({ where: { companyId } }),
      this.prisma.payableAccount.count({ where: { companyId } }),
    ]);

    const invoicesThisMonth = salesInvoices + salesReturns + purchaseInvoices + purchaseReturns;
    const financialVouchersThisMonth = receiptVouchers + paymentVouchers + internalTransfers;

    return {
      users,
      branches,
      stores,
      safes,
      banks,
      invoicesThisMonth,
      customers,
      suppliers,
      items,
      priceQuotationsThisMonth: priceQuotations,
      financialVouchersThisMonth,
      currentAccounts,
      expenseRevenueThisMonth: expenses,
      receivableAccounts,
      payableAccounts,
    };
  }

  /**
   * Check if a resource limit has been reached
   */
  async checkLimit(
    companyId: string,
    resource: keyof PlanLimits,
  ): Promise<LimitCheckResult> {
    const subscription = await this.getCompanySubscription(companyId);
    const limits = PLAN_LIMITS[subscription.planType];
    const limit = limits[resource];

    // If unlimited, always allow
    if (typeof limit === 'number' && isUnlimited(limit)) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        percentage: 0,
        resourceName: resource,
      };
    }

    // If boolean (financialAnalysisEnabled), handle differently
    if (typeof limit === 'boolean') {
      return {
        allowed: limit,
        current: limit ? 1 : 0,
        limit: 1,
        percentage: limit ? 100 : 0,
        resourceName: resource,
      };
    }

    const current = await this.getResourceCount(companyId, resource);
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const allowed = current < limit;

    return {
      allowed,
      current,
      limit: limit as number,
      percentage,
      resourceName: resource,
    };
  }

  /**
   * Get current count of a resource
   */
  async getResourceCount(companyId: string, resource: keyof PlanLimits): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    switch (resource) {
      case 'users':
        return this.prisma.user.count({ where: { companyId } });
      case 'branches':
        return this.prisma.branch.count({ where: { companyId } });
      case 'stores':
        return this.prisma.store.count({ where: { companyId } });
      case 'safes':
        return this.prisma.safe.count({ where: { companyId } });
      case 'banks':
        return this.prisma.bank.count({ where: { companyId } });
      case 'customers':
        return this.prisma.customer.count({ where: { companyId } });
      case 'suppliers':
        return this.prisma.supplier.count({ where: { companyId } });
      case 'items':
        return this.prisma.item.count({ where: { companyId } });
      case 'currentAccounts':
        return this.prisma.currentAccount.count({ where: { companyId } });
      case 'receivableAccounts':
        return this.prisma.receivableAccount.count({ where: { companyId } });
      case 'payableAccounts':
        return this.prisma.payableAccount.count({ where: { companyId } });
      case 'invoicesPerMonth':
        return this.getRolling30DayInvoiceCount(companyId);
      case 'priceQuotationsPerMonth':
        return this.prisma.priceQuotation.count({
          where: { companyId, createdAt: { gte: thirtyDaysAgo } },
        });
      case 'financialVouchersPerMonth':
        return this.getRolling30DayFinancialVoucherCount(companyId);
      case 'expenseRevenuePerMonth':
        return this.prisma.expense.count({
          where: { companyId, createdAt: { gte: thirtyDaysAgo } },
        });
      default:
        return 0;
    }
  }

  /**
   * Get rolling 30-day count for invoices (sales + purchase + returns)
   */
  private async getRolling30DayInvoiceCount(companyId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [salesInvoices, salesReturns, purchaseInvoices, purchaseReturns] = await Promise.all([
      this.prisma.salesInvoice.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.salesReturn.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.purchaseInvoice.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.purchaseReturn.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return salesInvoices + salesReturns + purchaseInvoices + purchaseReturns;
  }

  /**
   * Get rolling 30-day count for financial vouchers
   */
  private async getRolling30DayFinancialVoucherCount(companyId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [receiptVouchers, paymentVouchers, internalTransfers] = await Promise.all([
      this.prisma.receiptVoucher.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.paymentVoucher.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.internalTransfer.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return receiptVouchers + paymentVouchers + internalTransfers;
  }

  /**
   * Enforce limit check - throws exception if limit reached
   */
  async enforceLimitOrThrow(companyId: string, resource: keyof PlanLimits): Promise<void> {
    const result = await this.checkLimit(companyId, resource);

    if (!result.allowed) {
      throw new ForbiddenException({
        message: `Subscription limit reached for ${resource}. Please upgrade your plan.`,
        error: 'SUBSCRIPTION_LIMIT_REACHED',
        resource,
        current: result.current,
        limit: result.limit,
      });
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    companyId: string,
    planType: SubscriptionPlanType,
  ): Promise<any> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      // Create new subscription if doesn't exist
      return this.prisma.subscription.create({
        data: {
          companyId,
          planType,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }

    // Update existing subscription
    return this.prisma.subscription.update({
      where: { companyId },
      data: { planType },
    });
  }

  /**
   * Create default subscription for new company
   */
  async createDefaultSubscription(companyId: string): Promise<any> {
    return this.prisma.subscription.create({
      data: {
        companyId,
        planType: SubscriptionPlanType.BASIC,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Check if financial analysis is enabled for company
   */
  async isFinancialAnalysisEnabled(companyId: string): Promise<boolean> {
    const subscription = await this.getCompanySubscription(companyId);
    const limits = PLAN_LIMITS[subscription.planType];
    return limits.financialAnalysisEnabled;
  }
}

