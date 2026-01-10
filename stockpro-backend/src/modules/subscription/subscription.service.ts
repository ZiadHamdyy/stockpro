import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import {
  PLAN_LIMITS,
  PlanLimits,
  LimitableResource,
  isUnlimited,
  getResourceLimit,
} from '../../common/constants/plan-limits.constants';
import { filterPermissionsByPlan } from '../../common/utils/permission-filter.util';
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
      include: { company: { select: { id: true, name: true, code: true } } },
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
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    // Validate dates if provided
    if (startDate && endDate) {
      if (endDate <= startDate) {
        throw new BadRequestException(
          'End date must be after start date',
        );
      }
    }

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
          startDate: startDate || new Date(),
          endDate: endDate || null,
        },
      });
    }

    // Update existing subscription
    const updateData: any = { planType };
    if (startDate !== undefined) {
      updateData.startDate = startDate;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate;
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { companyId },
      data: updateData,
    });

    // Sync permissions with the new plan
    await this.syncPermissionsWithPlan(companyId, planType);

    return updatedSubscription;
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
   * Sync permissions with subscription plan
   * Removes permissions not allowed for the plan from all roles
   * @param companyId - Company ID
   * @param planType - Current subscription plan type
   */
  async syncPermissionsWithPlan(
    companyId: string,
    planType: SubscriptionPlanType,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Get all permissions for the company
      const allPermissions = await tx.permission.findMany({
        where: { companyId },
      });

      // Filter permissions based on plan
      const allowedPermissions = filterPermissionsByPlan(
        allPermissions,
        planType,
      );
      const allowedPermissionIds = new Set(
        allowedPermissions.map((p) => p.id),
      );

      // Get all roles for the company
      const roles = await tx.role.findMany({
        where: { companyId },
      });

      // For each role, remove permissions not allowed for the plan
      for (const role of roles) {
        // Get all current permissions for this role
        const currentRolePermissions = await tx.rolePermission.findMany({
          where: { roleId: role.id },
          include: { permission: true },
        });

        // Find permissions that should be removed (not in allowed list)
        const permissionsToRemove = currentRolePermissions.filter(
          (rp) => !allowedPermissionIds.has(rp.permissionId),
        );

        // Remove disallowed permissions
        if (permissionsToRemove.length > 0) {
          await tx.rolePermission.deleteMany({
            where: {
              roleId: role.id,
              permissionId: {
                in: permissionsToRemove.map((rp) => rp.permissionId),
              },
            },
          });
        }
      }
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

  /**
   * Get subscription by company code
   */
  async getSubscriptionByCode(code: string): Promise<any> {
    // Validate code format (6-8 digits)
    if (!/^\d{6,8}$/.test(code)) {
      throw new BadRequestException('Company code must be 6-8 digits');
    }

    // Find company by code
    const company = await this.prisma.company.findUnique({
      where: { code },
    });

    if (!company) {
      throw new NotFoundException(`Company not found for code: ${code}`);
    }

    // Get subscription for this company
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId: company.id },
      include: { 
        company: { 
          select: { 
            id: true, 
            name: true, 
            code: true,
            phone: true,
            address: true,
            activity: true,
            taxNumber: true,
            commercialReg: true,
          } 
        } 
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for company code: ${code}`);
    }

    // Get all admin users (users with role name "مدير")
    console.log('🔍 getSubscriptionByCode - Looking for admin role for company:', company.id);
    const adminRole = await this.prisma.role.findUnique({
      where: {
        name_companyId: {
          name: 'مدير',
          companyId: company.id,
        },
      },
    });

    console.log('🔍 getSubscriptionByCode - Admin role found:', adminRole ? `YES (id: ${adminRole.id})` : 'NO');

    type AdminUser = {
      id: string;
      name: string | null;
      email: string;
      code: number;
      createdAt: Date;
      role: {
        name: string;
      } | null;
    };

    let admins: AdminUser[] = [];
    if (adminRole) {
      console.log('🔍 getSubscriptionByCode - Fetching users with roleId:', adminRole.id);
      admins = await this.prisma.user.findMany({
        where: {
          companyId: company.id,
          roleId: adminRole.id,
          active: true, // Only get active admins
        },
        select: {
          id: true,
          name: true,
          email: true,
          code: true,
          createdAt: true,
          role: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' }, // Order by creation date
      });
      console.log('🔍 getSubscriptionByCode - Found', admins.length, 'admin users');
    } else {
      console.log('🔍 getSubscriptionByCode - No admin role found, checking all users...');
      // Fallback: if no admin role exists, get all users (in case role name is different)
      const allUsers = await this.prisma.user.findMany({
        where: {
          companyId: company.id,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          code: true,
          createdAt: true,
          role: {
            select: {
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
      });
      console.log('🔍 getSubscriptionByCode - Found', allUsers.length, 'total active users');
      admins = allUsers; // Return all users as fallback
    }

    // Construct the response with all company fields and admins array
    const result = {
      ...subscription,
      company: {
        id: subscription.company.id,
        name: subscription.company.name,
        code: subscription.company.code,
        phone: subscription.company.phone || null,
        address: subscription.company.address || null,
        activity: subscription.company.activity || null,
        taxNumber: subscription.company.taxNumber || null,
        commercialReg: subscription.company.commercialReg || null,
        admins: admins || []
      }
    };

    // Debug logging
    console.log('🔍 getSubscriptionByCode - Company from subscription:', JSON.stringify(subscription.company, null, 2));
    console.log('🔍 getSubscriptionByCode - Admin role found:', adminRole ? `YES (id: ${adminRole.id})` : 'NO');
    console.log('🔍 getSubscriptionByCode - Number of admins found:', admins.length);
    if (admins.length > 0) {
      console.log('🔍 getSubscriptionByCode - Admins data:', JSON.stringify(admins, null, 2));
    } else {
      console.log('⚠️ getSubscriptionByCode - No admins found!');
    }
    console.log('🔍 getSubscriptionByCode - Final result company keys:', Object.keys(result.company));
    console.log('🔍 getSubscriptionByCode - Final result company:', JSON.stringify(result.company, null, 2));
    console.log('🔍 getSubscriptionByCode - Final result (full):', JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * Renew subscription by company code
   */
  async renewSubscriptionByCode(
    code: string,
    planType: SubscriptionPlanType,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    // Validate code format (6-8 digits)
    if (!/^\d{6,8}$/.test(code)) {
      throw new BadRequestException('Company code must be 6-8 digits');
    }

    // Find company by code
    const company = await this.prisma.company.findUnique({
      where: { code },
    });

    if (!company) {
      throw new NotFoundException(`Company not found for code: ${code}`);
    }

    // Validate dates
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if subscription exists
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { companyId: company.id },
    });

    if (existingSubscription) {
      // Update existing subscription
      return this.prisma.subscription.update({
        where: { companyId: company.id },
        data: {
          planType,
          startDate,
          endDate,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    } else {
      // Create new subscription
      return this.prisma.subscription.create({
        data: {
          companyId: company.id,
          planType,
          startDate,
          endDate,
          status: SubscriptionStatus.ACTIVE,
        },
      });
    }
  }
}

