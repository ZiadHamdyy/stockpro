import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/auth/auth';
import { hasPermission } from '../../utils/permissions';
import type { Permission } from '../../types';
import AccessDenied from '../pages/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
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

  // Get user permissions from role
  const userPermissions: Permission[] = currentUser.role?.permissions || [];

  // Check if user has the required permission
  const hasAccess = hasPermission(userPermissions, requiredPermission);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

