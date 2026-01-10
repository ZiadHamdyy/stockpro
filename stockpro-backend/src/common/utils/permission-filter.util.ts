import { isResourceAllowedForPlan } from '../constants/plan-permissions.constants';

/**
 * Permission interface matching Prisma Permission model structure
 */
export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  companyId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Filter permissions based on subscription plan
 * @param permissions - Array of permissions to filter
 * @param planType - Current subscription plan type (BASIC, GROWTH, BUSINESS)
 * @returns Filtered array of permissions allowed for the plan
 */
export function filterPermissionsByPlan(
  permissions: Permission[],
  planType: 'BASIC' | 'GROWTH' | 'BUSINESS',
): Permission[] {
  return permissions.filter((permission) =>
    isResourceAllowedForPlan(permission.resource, planType),
  );
}
