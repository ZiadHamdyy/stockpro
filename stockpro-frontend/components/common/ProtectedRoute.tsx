import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/auth/auth";
import { hasPermission, hasAllPermissions } from "../../utils/permissions";
import type { Permission } from "../../types";
import AccessDenied from "../pages/AccessDenied";
// Note: You can also use enums: import { Resources, Actions, buildPermission } from '../../enums/permissions.enum';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string | string[]; // Can also use buildPermission(Resources.DASHBOARD, Actions.READ) or array for multiple permissions (requires ALL)
}

/**
 * ProtectedRoute component that checks user permissions before rendering children
 * If user lacks the required permission, renders AccessDenied page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const currentUser = useSelector(selectCurrentUser);

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
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
