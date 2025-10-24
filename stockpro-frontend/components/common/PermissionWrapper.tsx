import React from "react";
import { useUserPermissions } from "../hook/usePermissions";

interface PermissionWrapperProps {
  /**
   * Required permission(s) to check
   * Can be a single permission string or an array of permissions
   * If array is provided, user needs ANY of the permissions (OR logic)
   */
  requiredPermission: string | string[];

  /**
   * Children to render if permission is granted
   */
  children: React.ReactNode;

  /**
   * Optional fallback to render if permission is denied
   * If not provided, returns null (hides the content)
   * User can pass null explicitly to hide content
   * User can pass a component/element to show alternative content
   */
  fallback?: React.ReactNode | null;
}

/**
 * PermissionWrapper - A reusable component to conditionally render content based on user permissions
 *
 * @example Basic usage with enum:
 * ```tsx
 * import { Resources, Actions, buildPermission } from '../../enums/permissions.enum';
 *
 * <PermissionWrapper requiredPermission={buildPermission(Resources.DASHBOARD, Actions.READ)}>
 *   <Dashboard />
 * </PermissionWrapper>
 * ```
 *
 * @example With custom fallback (disabled state):
 * ```tsx
 * <PermissionWrapper
 *   requiredPermission="items-delete"
 *   fallback={<button disabled>Delete Item</button>}
 * >
 *   <button onClick={handleDelete}>Delete Item</button>
 * </PermissionWrapper>
 * ```
 *
 * @example With null fallback (hide completely):
 * ```tsx
 * <PermissionWrapper
 *   requiredPermission="settings-update"
 *   fallback={null}
 * >
 *   <SettingsPanel />
 * </PermissionWrapper>
 * ```
 *
 * @example Multiple permissions (user needs ANY of them):
 * ```tsx
 * <PermissionWrapper
 *   requiredPermission={[
 *     buildPermission(Resources.SALES, Actions.CREATE),
 *     buildPermission(Resources.SALES, Actions.UPDATE)
 *   ]}
 * >
 *   <SalesForm />
 * </PermissionWrapper>
 * ```
 */
const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  requiredPermission,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useUserPermissions();

  // Check if user has any of the required permissions
  const hasAccess = Array.isArray(requiredPermission)
    ? requiredPermission.some((permission) => hasPermission(permission))
    : hasPermission(requiredPermission);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Render fallback if provided, otherwise return null
  return fallback !== undefined ? <>{fallback}</> : null;
};

export default PermissionWrapper;
