import { useState, useEffect, useMemo } from "react";
import {
  useGetRolesQuery,
  useAssignPermissionsMutation,
} from "../store/slices/role/roleApi";
import { useGetPermissionsQuery } from "../store/slices/permission/permissionApi";
import { useToast } from "../common/ToastProvider";
import {
  ARABIC_TO_ENGLISH_ACTIONS,
  ARABIC_TO_ENGLISH_ROLES,
  ENGLISH_TO_ARABIC_ROLES,
  PERMISSION_ACTIONS,
} from "../../constants";
import type { PermissionNode, Permission } from "../../types";
import { MENU_ITEMS } from "../../constants";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../store/slices/auth/auth";
import { getPermissionSet } from "../../utils/permissions";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../enums/permissions.enum";
import { useSubscription } from "./useSubscription";
import { filterMenuBySubscription } from "../../utils/subscriptionFilter";

// Helper function to convert MenuItem to PermissionNode
const menuItemToPermissionNode = (item: any): PermissionNode => ({
  key: item.key,
  label: item.label,
  children: item.children?.map((child: any) => menuItemToPermissionNode(child)),
});

const getAllKeys = (nodes: PermissionNode[]): string[] => {
  return nodes.flatMap((node) => [
    node.key,
    ...(node.children ? getAllKeys(node.children) : []),
  ]);
};

/**
 * Hook to get current user's permissions
 * Returns permissions as a Set of strings in "resource-action" format
 *
 * @example With string permissions:
 * ```tsx
 * const { hasPermission } = useUserPermissions();
 * const canRead = hasPermission('dashboard-read');
 * ```
 *
 * @example With enum permissions:
 * ```tsx
 * import { Resources, Actions, buildPermission } from '../../enums/permissions.enum';
 *
 * const { hasPermission } = useUserPermissions();
 * const canRead = hasPermission(buildPermission(Resources.DASHBOARD, Actions.READ));
 * ```
 */
export const useUserPermissions = () => {
  const currentUser = useSelector(selectCurrentUser);

  // Normalize permissions from backend shape: role.rolePermissions[].permission
  const userPermissions: Permission[] = useMemo(() => {
    const role: any = currentUser?.role;
    if (!role) return [] as Permission[];
    if (Array.isArray((role as any).permissions)) {
      return (role as any).permissions as Permission[];
    }
    if (Array.isArray(role.rolePermissions)) {
      return role.rolePermissions
        .map((rp: any) => rp?.permission)
        .filter(Boolean) as Permission[];
    }
    return [] as Permission[];
  }, [currentUser]);
  const permissionSet = useMemo(
    () => getPermissionSet(userPermissions),
    [userPermissions],
  );

  return {
    permissions: userPermissions,
    permissionSet,
    hasPermission: (requiredPermission: string) => {
      return permissionSet.has(requiredPermission);
    },
  };
};

// Re-export enums and helper functions for convenience
export { Resources, Actions, buildPermission };

export const usePermissions = () => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useSelector(selectCurrentUser);
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useGetRolesQuery(undefined);
  const {
    data: allPermissions = [],
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useGetPermissionsQuery();
  const [assignPermissions, { isLoading: saving }] =
    useAssignPermissionsMutation();
  const { showToast } = useToast();

  // Filter menu items by subscription plan, then convert to permission tree
  const permissionTreeData: PermissionNode[] = useMemo(() => {
    // First filter out subscription and subscription_renewal pages (super admin only)
    const filteredMenuItems = MENU_ITEMS.filter(
      (item) => item.key !== 'subscription' && item.key !== 'subscription_renewal'
    );
    
    // Only filter when subscription is loaded
    if (subscriptionLoading || !subscription) {
      // Show all items while loading
      return filteredMenuItems.map((item) => menuItemToPermissionNode(item));
    }
    
    // Filter by subscription plan
    const subscriptionFiltered = filterMenuBySubscription(
      filteredMenuItems,
      subscription.planType
    );
    
    // Convert to PermissionNode structure
    return subscriptionFiltered.map((item) => menuItemToPermissionNode(item));
  }, [subscription?.planType, subscriptionLoading]);

  // Calculate allItemKeys from the filtered permission tree
  const allItemKeys = useMemo(() => {
    return getAllKeys(permissionTreeData);
  }, [permissionTreeData]);

  // Check if user is authenticated
  const isAuthenticated = !!currentUser;

  // Map roles to Arabic names for display
  const arabicRoles = useMemo(() => {
    if (!Array.isArray(roles)) {
      console.warn("Roles is not an array:", roles);
      return [];
    }
    // Since role names are now in Arabic directly, arabicName is just the name
    return roles.map((role) => ({
      ...role,
      arabicName: role.name,
    }));
  }, [roles]);

  // Initialize selected role when roles are loaded - default to current user's role
  useEffect(() => {
    if (arabicRoles.length > 0 && !selectedRole) {
      // Try to find current user's role first
      if (currentUser?.role) {
        const userRole = arabicRoles.find(
          (role) => role.id === currentUser.role?.id || role.name === currentUser.role?.name
        );
        if (userRole) {
          setSelectedRole(userRole.arabicName);
          return;
        }
      }
      // Fallback to first role if current user doesn't have a role
      setSelectedRole(arabicRoles[0].arabicName);
    }
  }, [arabicRoles, selectedRole, currentUser]);

  // Load role permissions when selected role changes
  useEffect(() => {
    if (selectedRole && roles.length > 0) {
      // Since role names are now in Arabic directly, find by Arabic name
      const role = roles.find((r) => r.name === selectedRole);

      if (role?.permissions) {
        const rolePermissions = new Set<string>();
        role.permissions.forEach((permission) => {
          const permissionKey = `${permission.resource}-${permission.action}`;
          rolePermissions.add(permissionKey);
        });

        // Only update if the permissions haven't been manually changed
        // Check if we already have permissions for this role that differ from what's in roles
        setPermissions((prev) => {
          const existingPermissions = prev[selectedRole];
          // If we already have permissions and they differ, don't overwrite
          if (
            existingPermissions &&
            existingPermissions.size !== rolePermissions.size
          ) {
            return prev;
          }
          return {
            ...prev,
            [selectedRole]: rolePermissions,
          };
        });
      }
    }
  }, [selectedRole, roles]);

  const handlePermissionChange = (
    itemKey: string,
    action: string,
    isChecked: boolean,
  ) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      const rolePermissions = new Set(newPermissions[selectedRole] || []);
      const permissionKey = `${itemKey}-${
        ARABIC_TO_ENGLISH_ACTIONS[
          action as keyof typeof ARABIC_TO_ENGLISH_ACTIONS
        ]
      }`;

      if (isChecked) {
        rolePermissions.add(permissionKey);
      } else {
        rolePermissions.delete(permissionKey);
      }

      newPermissions[selectedRole] = rolePermissions;
      return newPermissions;
    });
  };

  const handleSelectAllForAction = (action: string, isChecked: boolean) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      const rolePermissions = new Set(newPermissions[selectedRole] || []);
      const englishAction =
        ARABIC_TO_ENGLISH_ACTIONS[
          action as keyof typeof ARABIC_TO_ENGLISH_ACTIONS
        ];

      allItemKeys.forEach((itemKey) => {
        const permissionKey = `${itemKey}-${englishAction}`;
        if (isChecked) {
          rolePermissions.add(permissionKey);
        } else {
          rolePermissions.delete(permissionKey);
        }
      });
      newPermissions[selectedRole] = rolePermissions;
      return newPermissions;
    });
  };

  const isAllSelectedForAction = (action: string) => {
    const rolePermissions = permissions[selectedRole] || new Set();
    const englishAction =
      ARABIC_TO_ENGLISH_ACTIONS[
        action as keyof typeof ARABIC_TO_ENGLISH_ACTIONS
      ];
    return allItemKeys.every((itemKey) =>
      rolePermissions.has(`${itemKey}-${englishAction}`),
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setIsLoading(true);
      setError(null);

      // Since role names are now in Arabic directly, find by Arabic name
      const role = roles.find((r) => r.name === selectedRole);

      if (!role) {
        throw new Error("Role not found");
      }

      // Get all permissions from the backend to map resource-action to permission IDs
      const rolePermissions = permissions[selectedRole] || new Set();

      // Convert frontend permission keys to backend permission IDs
      const permissionIds: string[] = [];
      const missingPermissions: string[] = [];
      rolePermissions.forEach((permissionKey) => {
        const [resource, action] = permissionKey.split("-");
        const permission = allPermissions.find(
          (p) => p.resource === resource && p.action === action,
        );
        if (permission) {
          permissionIds.push(permission.id);
        } else {
          missingPermissions.push(permissionKey);
        }
      });

      // Warn about missing permissions
      if (missingPermissions.length > 0) {
        console.warn("Some permissions not found in database:", missingPermissions);
        console.warn("Available permissions count:", allPermissions.length);
        console.warn("Available resources:", [...new Set(allPermissions.map(p => p.resource))]);
      }

      // Ensure permissions resource is always included for manager role (can't be removed from admin)
      if (role.name === "مدير") {
        const permissionsResourcePermissions = allPermissions.filter(
          (p) => p.resource === "permissions",
        );
        permissionsResourcePermissions.forEach((p) => {
          if (!permissionIds.includes(p.id)) {
            permissionIds.push(p.id);
          }
        });
      }

      // Company data read permission must remain available for every role
      const companyDataReadPermission = allPermissions.find(
        (p) => p.resource === "company_data" && p.action === "read",
      );
      if (
        companyDataReadPermission &&
        !permissionIds.includes(companyDataReadPermission.id)
      ) {
        permissionIds.push(companyDataReadPermission.id);
      }

      const result = await assignPermissions({
        roleId: role.id,
        permissions: { permissionIds },
      }).unwrap();

      // Update permissions state with the saved data from backend
      if (result?.permissions) {
        const savedPermissions = new Set<string>();
        result.permissions.forEach((permission: any) => {
          const permissionKey = `${permission.resource}-${permission.action}`;
          savedPermissions.add(permissionKey);
        });
        setPermissions((prev) => ({
          ...prev,
          [selectedRole]: savedPermissions,
        }));
      }

      // Refetch roles to ensure we have the latest data
      await refetchRoles();

      showToast("تم حفظ الصلاحيات بنجاح");
    } catch (err) {
      console.error("Error saving permissions:", err);
      const errorMessage = "حدث خطأ أثناء حفظ الصلاحيات";
      setError(errorMessage);
      showToast(`خطأ: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPermissions = permissions[selectedRole] || new Set();

  return {
    // Data
    roles: arabicRoles,
    selectedRole,
    permissions: currentPermissions,
    permissionTreeData,
    allItemKeys,
    PERMISSION_ACTIONS,
    currentUser,
    isAuthenticated,

    // Loading states
    isLoading: rolesLoading || permissionsLoading || isLoading || saving,
    error: error || (rolesError ? "خطأ في تحميل الأدوار" : null),

    // Actions
    setSelectedRole,
    handlePermissionChange,
    handleSelectAllForAction,
    isAllSelectedForAction,
    handleSavePermissions,
  };
};
