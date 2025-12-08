import { Permission, MenuItem } from "../types";
import { Resources, Actions, buildPermission } from "../enums/permissions.enum";

// Re-export enums and helper for convenience
export { Resources, Actions, buildPermission };

/**
 * Check if user has a specific permission
 * @param userPermissions - Array of user permissions from backend
 * @param requiredPermission - Permission in format "resource-action" (e.g., "dashboard-read")
 *                             Can also use buildPermission(Resources.DASHBOARD, Actions.READ)
 * @returns boolean indicating if user has the permission
 */
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: string,
): boolean => {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  const [resource, action] = requiredPermission.split("-");

  return userPermissions.some(
    (permission) =>
      permission.resource === resource && permission.action === action,
  );
};

/**
 * Check if user has any of the required permissions
 * @param userPermissions - Array of user permissions from backend
 * @param requiredPermissions - Array of permissions in format "resource-action"
 * @returns boolean indicating if user has at least one of the permissions
 */
export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: string[],
): boolean => {
  return requiredPermissions.some((permission) =>
    hasPermission(userPermissions, permission),
  );
};

/**
 * Check if user has all of the required permissions
 * @param userPermissions - Array of user permissions from backend
 * @param requiredPermissions - Array of permissions in format "resource-action"
 * @returns boolean indicating if user has all of the permissions
 */
export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: string[],
): boolean => {
  return requiredPermissions.every((permission) =>
    hasPermission(userPermissions, permission),
  );
};

/**
 * Get Set of permission strings in "resource-action" format
 * @param userPermissions - Array of user permissions from backend
 * @returns Set of permission strings
 */
export const getPermissionSet = (
  userPermissions: Permission[],
): Set<string> => {
  if (!userPermissions || userPermissions.length === 0) {
    return new Set();
  }

  return new Set(
    userPermissions.map(
      (permission) => `${permission.resource}-${permission.action}`,
    ),
  );
};

/**
 * Check if a menu item should be visible based on user permissions
 * @param menuKey - Key of the menu item
 * @param userPermissions - Set of user permissions in "resource-action" format
 * @returns boolean indicating if menu item should be visible
 */
export const isMenuItemVisible = (
  menuKey: string,
  userPermissions: Set<string>,
): boolean => {
  // Check if user has read permission for this resource
  const readPermission = `${menuKey}-read`;
  return userPermissions.has(readPermission);
};

/**
 * Convenience helper to check read-only access to a menu key
 */
export const hasReadPermissionForKey = (
  menuKey: string,
  permissionSet: Set<string>,
): boolean => {
  if (!permissionSet || permissionSet.size === 0) {
    return false;
  }
  
  // Special case: print_settings requires both read and update permissions
  if (menuKey === 'print_settings') {
    return permissionSet.has('print_settings-read') && permissionSet.has('print_settings-update');
  }
  
  return permissionSet.has(`${menuKey}-read`);
};

/**
 * Filter menu items recursively, keeping entries that either have their own read
 * permission or at least one child that does. Empty parents are removed.
 */
export const filterMenuByReadPermissions = (
  items: MenuItem[],
  permissionSet: Set<string>,
): MenuItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const filterRecursively = (menuItems: MenuItem[]): MenuItem[] => {
    return menuItems
      .map((item) => {
        const filteredChildren = item.children
          ? filterRecursively(item.children)
          : undefined;
        const canSeeItem =
          hasReadPermissionForKey(item.key, permissionSet) ||
          (filteredChildren && filteredChildren.length > 0);

        if (!canSeeItem) {
          return null;
        }

        return filteredChildren
          ? { ...item, children: filteredChildren }
          : item;
      })
      .filter((item): item is MenuItem => item !== null);
  };

  return filterRecursively(items);
};
