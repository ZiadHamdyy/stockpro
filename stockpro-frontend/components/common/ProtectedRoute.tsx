import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/auth/auth";
import { hasPermission, hasAllPermissions } from "../../utils/permissions";
import type { Permission } from "../../types";
import AccessDenied from "../pages/AccessDenied";
import { useSubscription } from "../hook/useSubscription";
// Note: You can also use enums: import { Resources, Actions, buildPermission } from '../../enums/permissions.enum';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string | string[]; // Can also use buildPermission(Resources.DASHBOARD, Actions.READ) or array for multiple permissions (requires ALL)
  requiresSubscription?: 'GROWTH' | 'BUSINESS'; // Minimum required subscription plan
}

/**
 * ProtectedRoute component that checks user permissions and subscription before rendering children
 * If user lacks the required permission, renders AccessDenied page
 * If user lacks the required subscription, redirects to dashboard
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiresSubscription,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Get user permissions from role - handle both structures (permissions array or rolePermissions)
  const userPermissions: Permission[] = useMemo(() => {
    const role: any = currentUser?.role;
    if (!role) return [];
    // Check if permissions are directly in role.permissions
    if (Array.isArray(role.permissions)) {
      return role.permissions as Permission[];
    }
    // Check if permissions are in role.rolePermissions[].permission
    if (Array.isArray(role.rolePermissions)) {
      return role.rolePermissions
        .map((rp: any) => rp?.permission)
        .filter(Boolean) as Permission[];
    }
    return [];
  }, [currentUser?.role]);

  // Check if user has the required permission(s)
  // All users (including managers) must have explicit permissions
  // Default to denying access (secure by default)
  let hasAccess = false;

  if (userPermissions.length > 0) {
    // Check if user has the required permission(s)
    // If array is provided, user must have ALL permissions
    // Only allow access if permission(s) are explicitly found
    if (Array.isArray(requiredPermission)) {
      hasAccess = hasAllPermissions(userPermissions, requiredPermission);
    } else {
      hasAccess = hasPermission(userPermissions, requiredPermission);
    }
  }
  // If userPermissions.length is 0, hasAccess remains false (deny access)

  // If no access, show AccessDenied page
  // This ensures users cannot access pages by typing URLs directly
  if (!hasAccess) {
    // Identify which specific permissions are missing
    const requiredPermissionsArray = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];
    
    const missingPermissions = requiredPermissionsArray.filter(
      (perm) => !hasPermission(userPermissions, perm)
    );
    
    return <AccessDenied missingPermissions={missingPermissions} />;
  }

  // Check subscription requirements (after permission check)
  if (requiresSubscription) {
    // Wait for subscription data to load before making redirect decision
    // This prevents redirecting to dashboard on page refresh while data is loading
    if (subscriptionLoading) {
      // Show loading state while subscription is being fetched
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      );
    }
    
    // Determine allowed plans based on requirement
    const allowedPlans = requiresSubscription === 'GROWTH' 
      ? ['GROWTH', 'BUSINESS'] 
      : ['BUSINESS'];
    
    // Check if user's plan is in the allowed list
    // If not, redirect to dashboard instead of showing upgrade page
    if (!subscription || !allowedPlans.includes(subscription.planType)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
