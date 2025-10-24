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

const permissionTreeData: PermissionNode[] = MENU_ITEMS.map((item) => ({
  key: item.key,
  label: item.label,
  children: item.children?.map((child) => ({
    key: child.key,
    label: child.label,
    children: child.children?.map((subChild) => ({
      key: subChild.key,
      label: subChild.label,
      children: subChild.children?.map((grandChild) => ({
        key: grandChild.key,
        label: grandChild.label,
      })),
    })),
  })),
}));

const getAllKeys = (nodes: PermissionNode[]): string[] => {
  return nodes.flatMap((node) => [
    node.key,
    ...(node.children ? getAllKeys(node.children) : []),
  ]);
};

const allItemKeys = getAllKeys(permissionTreeData);

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

  const userPermissions: Permission[] = currentUser?.role?.permissions || [];
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
  const {
    data: roles = [],
    isLoading: rolesLoading,
    error: rolesError,
  } = useGetRolesQuery();
  const {
    data: allPermissions = [],
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useGetPermissionsQuery();
  const [assignPermissions, { isLoading: saving }] =
    useAssignPermissionsMutation();
  const { showToast } = useToast();

  // Debug: Log permissions fetch status
  useEffect(() => {
    console.log("Permissions fetch status:", {
      allPermissionsCount: allPermissions.length,
      permissionsLoading,
      permissionsError,
      firstFewPermissions: allPermissions.slice(0, 5),
    });
  }, [allPermissions, permissionsLoading, permissionsError]);

  // Check if user is authenticated
  const isAuthenticated = !!currentUser;

  // Map roles to Arabic names for display
  const arabicRoles = useMemo(() => {
    if (!Array.isArray(roles)) {
      console.warn("Roles is not an array:", roles);
      return [];
    }
    return roles.map((role) => ({
      ...role,
      arabicName:
        ENGLISH_TO_ARABIC_ROLES[
          role.name as keyof typeof ENGLISH_TO_ARABIC_ROLES
        ] || role.name,
    }));
  }, [roles]);

  // Initialize selected role when roles are loaded
  useEffect(() => {
    if (arabicRoles.length > 0 && !selectedRole) {
      setSelectedRole(arabicRoles[0].arabicName);
    }
  }, [arabicRoles, selectedRole]);

  // Load role permissions when selected role changes
  useEffect(() => {
    if (selectedRole && roles.length > 0) {
      const englishRoleName =
        ARABIC_TO_ENGLISH_ROLES[
          selectedRole as keyof typeof ARABIC_TO_ENGLISH_ROLES
        ];
      const role = roles.find((r) => r.name === englishRoleName);

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
            console.log("Skipping permission update - manual changes detected");
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
    console.log("handlePermissionChange called:", {
      itemKey,
      action,
      isChecked,
      selectedRole,
    });
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      const rolePermissions = new Set(newPermissions[selectedRole] || []);
      const permissionKey = `${itemKey}-${
        ARABIC_TO_ENGLISH_ACTIONS[
          action as keyof typeof ARABIC_TO_ENGLISH_ACTIONS
        ]
      }`;

      console.log("Before update:", {
        permissionKey,
        rolePermissions: Array.from(rolePermissions),
      });

      if (isChecked) {
        rolePermissions.add(permissionKey);
      } else {
        rolePermissions.delete(permissionKey);
      }

      console.log("After update:", {
        rolePermissions: Array.from(rolePermissions),
      });

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

      const englishRoleName =
        ARABIC_TO_ENGLISH_ROLES[
          selectedRole as keyof typeof ARABIC_TO_ENGLISH_ROLES
        ];
      const role = roles.find((r) => r.name === englishRoleName);

      if (!role) {
        throw new Error("Role not found");
      }

      // Get all permissions from the backend to map resource-action to permission IDs
      const rolePermissions = permissions[selectedRole] || new Set();

      // Convert frontend permission keys to backend permission IDs
      const permissionIds: string[] = [];
      rolePermissions.forEach((permissionKey) => {
        const [resource, action] = permissionKey.split("-");
        const permission = allPermissions.find(
          (p) => p.resource === resource && p.action === action,
        );
        if (permission) {
          permissionIds.push(permission.id);
        }
      });

      // Ensure permissions resource is always included for manager role (can't be removed from admin)
      if (role.name === "manager") {
        const permissionsResourcePermissions = allPermissions.filter(
          (p) => p.resource === "permissions",
        );
        permissionsResourcePermissions.forEach((p) => {
          if (!permissionIds.includes(p.id)) {
            permissionIds.push(p.id);
          }
        });
      }

      const result = await assignPermissions({
        roleId: role.id,
        permissions: { permissionIds },
      }).unwrap();

      showToast("تم حفظ الصلاحيات بنجاح");
    } catch (err) {
      console.error("Error saving permissions:", err);
      const errorMessage =
        err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الصلاحيات";
      setError(errorMessage);
      showToast(`خطأ: ${errorMessage}`);
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
