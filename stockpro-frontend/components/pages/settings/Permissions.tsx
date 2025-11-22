// @ts-nocheck
import React, { useState } from "react";
import type { PermissionNode } from "../../../types";
import { ChevronDownIcon, ChevronLeftIcon } from "../../icons";
import { usePermissions } from "../../hook/usePermissions";
import { ARABIC_TO_ENGLISH_ACTIONS } from "../../../constants";
import { useToast } from "../../common/ToastProvider";
import { useModal } from "../../common/ModalProvider";
import { useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from "../../store/slices/role/roleApi";
import PermissionWrapper from "../../common/PermissionWrapper";

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
            isPermissionsResource && selectedRoleName === "مدير";

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

  const { showToast } = useToast();
  const { showModal } = useModal();
  const [createRole, { isLoading: isCreatingRole }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeletingRole }] = useDeleteRoleMutation();
  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRoleName, setCreateRoleName] = useState("");
  const [createRoleDescription, setCreateRoleDescription] = useState("");
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");
  // Add-role section visibility controlled by PermissionWrapper

  // Find the selected role object (role names are now in Arabic)
  const selectedRoleObj = roles.find(
    (role) => role.arabicName === selectedRole,
  );
  const selectedRoleName = selectedRoleObj?.name || "";

  const selectStyle =
    "block w-full md:w-1/3 bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  const handleCreateClick = () => {
    setCreateRoleName("");
    setCreateRoleDescription("");
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateRoleName("");
    setCreateRoleDescription("");
  };

  const handleSaveCreate = async () => {
    const trimmedName = createRoleName.trim();
    if (!trimmedName) {
      showToast("أدخل اسم الدور", 'error');
      return;
    }
    // Prevent creating a role with the name "مدير" (manager)
    if (trimmedName === "مدير") {
      showToast("لا يمكن إنشاء دور باسم مدير", 'error');
      return;
    }
    try {
      const created = await createRole({
        name: trimmedName,
        description: createRoleDescription.trim() || undefined,
      }).unwrap();

      // Role names are now in Arabic directly, so use the name as-is
      setSelectedRole(created.name);
      handleCloseCreateModal();
      showToast("تم إنشاء الدور بنجاح");
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;
      if (status === 403) {
        showToast("لا تملك صلاحية إنشاء دور (permissions-create)", 'error');
        return;
      }
      if (status === 409) {
        showToast("لا يمكن إنشاء دور باسم مدير", 'error');
        return;
      }
      showToast("فشل إنشاء الدور", 'error');
    }
  };

  const handleEditClick = () => {
    if (!selectedRoleObj) return;
    setEditRoleName(selectedRoleObj.name);
    setEditRoleDescription(selectedRoleObj.description || "");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditRoleName("");
    setEditRoleDescription("");
  };

  const handleSaveEdit = async () => {
    if (!selectedRoleObj) return;
    const trimmedName = editRoleName.trim();
    if (!trimmedName) {
      showToast("أدخل اسم الدور", 'error');
      return;
    }
    try {
      const updated = await updateRole({
        id: selectedRoleObj.id,
        name: trimmedName,
        description: editRoleDescription.trim() || undefined,
      }).unwrap();

      // Role names are now in Arabic directly, so use the name as-is
      setSelectedRole(updated.name);
      handleCloseEditModal();
      showToast("تم تحديث الدور بنجاح");
    } catch (err: any) {
      const status = err?.status ?? err?.originalStatus;
      if (status === 403) {
        showToast("لا تملك صلاحية تحديث الدور", 'error');
        return;
      }
      const message = err instanceof Error ? err.message : "فشل تحديث الدور";
      showToast(`خطأ: ${message}`, 'error');
    }
  };

  const handleDeleteClick = () => {
    if (!selectedRoleObj) return;

    // Prevent deleting the manager role "مدير" (also checked by backend)
    if (selectedRoleObj.name === "مدير" || selectedRoleObj.arabicName === "مدير") {
      showToast("لا يمكن حذف دور المدير", 'error');
      return;
    }

    // Prevent deleting own role (also checked by backend)
    if (currentUser?.role?.id === selectedRoleObj.id) {
      showToast("لا يمكن حذف الدور الخاص بك", 'error');
      return;
    }

    // Build confirmation message
    const message = `هل أنت متأكد من حذف الدور "${selectedRoleObj.arabicName}"؟`;

    showModal({
      title: "تأكيد الحذف",
      message: message,
      onConfirm: async () => {
        try {
          await deleteRole(selectedRoleObj.id).unwrap();
          // Select first available role if current role was deleted
          const remainingRoles = roles.filter((r) => r.id !== selectedRoleObj.id);
          if (remainingRoles.length > 0) {
            setSelectedRole(remainingRoles[0].arabicName);
          }
          showToast("تم حذف الدور بنجاح");
        } catch (err: any) {
          const status = err?.status ?? err?.originalStatus;
          if (status === 403) {
            showToast("لا تملك صلاحية حذف الدور", 'error');
            return;
          }
          if (status === 409) {
            showToast("لا يمكن حذف الدور لوجود مستخدمين مرتبطين به", 'error');
            return;
          }
          if (status === 400) {
            showToast("لا يمكن حذف الأدوار النظامية", 'error');
            return;
          }
          showToast("فشل حذف الدور", 'error');
        }
      },
      type: "delete",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-lg shad
ow-md">
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
        <div className="flex items-end gap-2">
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
          <PermissionWrapper requiredPermission="permissions-create">
            <button
              type="button"
              onClick={handleCreateClick}
              disabled={isLoading || isCreatingRole}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة
            </button>
          </PermissionWrapper>
          {selectedRoleObj && (
            <>
              <PermissionWrapper requiredPermission="permissions-update">
                <button
                  type="button"
                  onClick={handleEditClick}
                  disabled={isLoading || !selectedRoleObj}
                  className="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تعديل
                </button>
              </PermissionWrapper>
              <PermissionWrapper requiredPermission="permissions-delete">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={
                    isLoading ||
                    isDeletingRole ||
                    !selectedRoleObj ||
                    currentUser?.role?.id === selectedRoleObj.id ||
                    selectedRoleObj.name === "مدير" ||
                    selectedRoleObj.arabicName === "مدير"
                  }
                  title={
                    currentUser?.role?.id === selectedRoleObj.id
                      ? "لا يمكن حذف الدور الخاص بك"
                      : selectedRoleObj.name === "مدير" || selectedRoleObj.arabicName === "مدير"
                      ? "لا يمكن حذف دور المدير"
                      : undefined
                  }
                  className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingRole ? "جاري الحذف..." : "حذف"}
                </button>
              </PermissionWrapper>
            </>
          )}
        </div>
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

      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-brand-dark border-b border-gray-200 pb-2">
              إضافة دور جديد
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  اسم الدور
                </label>
                <input
                  type="text"
                  value={createRoleName}
                  onChange={(e) => setCreateRoleName(e.target.value)}
                  placeholder="مثال: مدير"
                  className="block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  الوصف (اختياري)
                </label>
                <input
                  type="text"
                  value={createRoleDescription}
                  onChange={(e) => setCreateRoleDescription(e.target.value)}
                  placeholder="مسؤول النظام مع إمكانية الوصول إلى جميع الميزات"
                  className="block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCreate}
                disabled={isCreatingRole}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingRole ? "جاري الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRoleObj && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-brand-dark border-b border-gray-200 pb-2">
              تعديل الدور
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  اسم الدور
                </label>
                <input
                  type="text"
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="مثال: مدير"
                  className="block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  الوصف (اختياري)
                </label>
                <input
                  type="text"
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  placeholder="مسؤول النظام مع إمكانية الوصول إلى جميع الميزات"
                  className="block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6 justify-end">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isUpdatingRole}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingRole ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;
