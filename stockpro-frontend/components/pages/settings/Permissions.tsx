import React, { useState } from "react";
import type { PermissionNode } from "../../../types";
import { ChevronDownIcon, ChevronLeftIcon } from "../../icons";
import { usePermissions } from "../../hook/usePermissions";
import { ARABIC_TO_ENGLISH_ACTIONS } from "../../../constants";

// Helper to render the permission tree
const PermissionTree: React.FC<{
  node: PermissionNode;
  level?: number;
  permissions: Set<string>;
  onPermissionChange: (
    itemKey: string,
    action: string,
    isChecked: boolean,
  ) => void;
  PERMISSION_ACTIONS: string[];
  selectedRoleName: string;
}> = ({
  node,
  level = 0,
  permissions,
  onPermissionChange,
  PERMISSION_ACTIONS,
  selectedRoleName,
}) => {
  const isPermissionsResource = node.key === "permissions";
  const [isOpen, setIsOpen] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  const padding = level * 24;

  return (
    <div className="border-b last:border-b-0">
      <div
        className={`grid grid-cols-7 items-center p-2 rounded-md ${
          hasChildren ? "cursor-pointer" : ""
        } hover:bg-gray-200 transition-colors duration-150`}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div
          className="col-span-2 flex items-center"
          style={{ paddingRight: `${padding}px` }}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4 ml-2 text-gray-600 flex-shrink-0" />
            ))}
          <span className="text-sm font-medium text-brand-dark">
            {node.label}
          </span>
        </div>
        {PERMISSION_ACTIONS.map((action) => {
          const englishAction =
            ARABIC_TO_ENGLISH_ACTIONS[
              action as keyof typeof ARABIC_TO_ENGLISH_ACTIONS
            ];
          const permissionKey = `${node.key}-${englishAction}`;
          const isChecked = permissions.has(permissionKey);
          const isDisabled =
            isPermissionsResource && selectedRoleName === "manager";

          // Debug logging
          if (node.key === "dashboard" && action === "قراءة") {
            console.log("Checkbox state:", {
              nodeKey: node.key,
              action,
              permissionKey,
              isChecked,
              isDisabled,
              permissionsSize: permissions.size,
            });
          }

          return (
            <div
              key={action}
              className="text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                className={`form-checkbox h-5 w-5 text-brand-blue rounded focus:ring-brand-blue border-gray-300 ${
                  isDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => {
                  console.log("Checkbox onChange triggered:", {
                    nodeKey: node.key,
                    action,
                    checked: e.target.checked,
                  });
                  onPermissionChange(node.key, action, e.target.checked);
                }}
              />
            </div>
          );
        })}
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children?.map((child) => (
            <PermissionTree
              key={child.key}
              node={child}
              level={level + 1}
              permissions={permissions}
              onPermissionChange={onPermissionChange}
              PERMISSION_ACTIONS={PERMISSION_ACTIONS}
              selectedRoleName={selectedRoleName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Permissions: React.FC<{ title: string }> = ({ title }) => {
  const {
    roles,
    selectedRole,
    permissions: currentPermissions,
    permissionTreeData,
    allItemKeys,
    PERMISSION_ACTIONS,
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    setSelectedRole,
    handlePermissionChange,
    handleSelectAllForAction,
    isAllSelectedForAction,
    handleSavePermissions,
  } = usePermissions();

  // Find the selected role object to get its English name
  const selectedRoleObj = roles.find(
    (role) => role.arabicName === selectedRole,
  );
  const selectedRoleName = selectedRoleObj?.name || "";

  const selectStyle =
    "block w-full md:w-1/3 bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 text-brand-dark">
          {title}
        </h1>
        <div className="text-center py-8">
          <div className="text-orange-600 mb-4 text-lg">
            يجب تسجيل الدخول أولاً
          </div>
          <div className="text-gray-600 mb-4">
            لا يمكن عرض إدارة الصلاحيات بدون تسجيل الدخول
          </div>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !roles.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 text-brand-dark">
          {title}
        </h1>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          <span className="mr-3 text-gray-600">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 text-brand-dark">
          {title}
        </h1>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 text-brand-dark">
        {title}
      </h1>

      {/* Debug info - remove in production */}
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <div className="text-blue-800 font-medium">
            معلومات المستخدم الحالي:
          </div>
          <div className="text-blue-600">
            الاسم: {currentUser.name || currentUser.email}
          </div>
          <div className="text-blue-600">
            الدور: {currentUser.role?.name || "غير محدد"}
          </div>
          {!currentUser.role && (
            <div className="mt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                تحديث البيانات
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="role-select"
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          اختر مجموعة الصلاحيات
        </label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className={selectStyle}
          disabled={isLoading}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.arabicName}>
              {role.arabicName}
            </option>
          ))}
        </select>
      </div>

      <div className="border-2 border-brand-blue rounded-md">
        <div className="grid grid-cols-7 items-center p-2 bg-brand-blue-bg font-bold border-b-2 border-brand-blue text-sm">
          <div className="col-span-2">الشاشة</div>
          {PERMISSION_ACTIONS.map((action) => (
            <div
              key={action}
              className="text-center flex flex-col items-center"
            >
              <span>{action}</span>
              <input
                type="checkbox"
                title={`اختيار الكل لـ ${action}`}
                className="form-checkbox h-4 w-4 mt-1 cursor-pointer"
                checked={isAllSelectedForAction(action)}
                onChange={(e) =>
                  handleSelectAllForAction(action, e.target.checked)
                }
              />
            </div>
          ))}
        </div>
        <div className="max-h-[60vh] overflow-y-auto bg-gray-50">
          {permissionTreeData.map((node) => (
            <PermissionTree
              key={node.key}
              node={node}
              permissions={currentPermissions}
              onPermissionChange={handlePermissionChange}
              PERMISSION_ACTIONS={PERMISSION_ACTIONS}
              selectedRoleName={selectedRoleName}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 mt-4">
        <button
          type="button"
          onClick={handleSavePermissions}
          disabled={isLoading}
          className="px-8 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>
    </div>
  );
};

export default Permissions;
