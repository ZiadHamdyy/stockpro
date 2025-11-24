import React, { useState, useEffect } from "react";
import type { Branch } from "../../../types";
// Updated to use ReduxUser type with branchId
import { EyeIcon, EyeOffIcon, UserIcon } from "../../icons";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  type User as ReduxUser,
} from "../../store/slices/user/userApi";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useGetRolesQuery } from "../../store/slices/role/roleApi";
import { useToast } from "../../common/ToastProvider";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: ReduxUser | null;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
}) => {
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { data: branches = [], isLoading: isLoadingBranches } =
    useGetBranchesQuery();
  const { showToast } = useToast();
  const { data: roles = [], isLoading: isLoadingRoles } = useGetRolesQuery(undefined);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    image: "",
    branchId: "",
    roleId: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    branchId?: string;
    roleId?: string;
  }>({});

  const roleNameArMap: Record<string, string> = {
    manager: "مدير",
    data_entry: "مدخل البيانات",
    salesperson: "بائع",
    accountant: "محاسب",
  };

  const getRoleLabelAr = (name: string) => {
    const key = name?.toLowerCase?.() ?? name;
    return roleNameArMap[key] ?? name;
  };

  useEffect(() => {
    if (userToEdit) {
      setUserData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: "",
        image: userToEdit.image || "",
        branchId: userToEdit.branchId || "",
        roleId: userToEdit.role?.id || "",
      });
    } else {
      setUserData({
        name: "",
        email: "",
        password: "",
        image: "",
        branchId: "",
        roleId: "",
      });
    }

    // Clear validation errors when modal opens
    setValidationErrors({});
  }, [userToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!userData.name.trim()) {
      errors.name = "الاسم مطلوب";
    }

    if (!userData.email.trim()) {
      errors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!userToEdit && !userData.password.trim()) {
      errors.password = "الرقم السري مطلوب";
    } else if (userData.password && userData.password.length < 8) {
      errors.password = "الرقم السري يجب أن يكون 8 أحرف على الأقل";
    }

    if (!userData.branchId) {
      errors.branchId = "يجب اختيار فرع";
    }

    if (!userData.roleId) {
      errors.roleId = "يجب اختيار صلاحية";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      showToast("يرجى تصحيح الأخطاء في النموذج", 'error');
      return;
    }

    try {
      if (userToEdit) {
        const userDataToSave: any = {
          name: userData.name,
          email: userData.email,
          image: userData.image,
          branchId: userData.branchId,
          roleId: userData.roleId,
        };
        if (userData.password && userData.password.trim().length > 0) {
          userDataToSave.password = userData.password;
        }
        // Update existing user
        await updateUser({
          id: userToEdit.id,
          data: userDataToSave,
        }).unwrap();
        showToast("تم تعديل المستخدم بنجاح");
      } else {
        // Create new user
        const userDataToSave = {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          image: userData.image,
          branchId: userData.branchId,
          roleId: userData.roleId,
        };
        await createUser(userDataToSave).unwrap();
        showToast("تم إضافة المستخدم بنجاح");
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving user:", error);

      // Show custom notification messages instead of backend errors
      let errorMessage = "حدث خطأ أثناء حفظ المستخدم";

      if (error?.status === 409) {
        errorMessage = "البريد الإلكتروني مستخدم بالفعل";
      } else if (error?.status === 400) {
        errorMessage = "البيانات المدخلة غير صحيحة";
      } else if (error?.status === 401) {
        errorMessage = "غير مصرح لك بهذا الإجراء";
      } else if (error?.status === 403) {
        errorMessage = "غير مصرح لك بهذا الإجراء";
      } else if (error?.status === 404) {
        errorMessage = "المستخدم غير موجود";
      } else if (error?.status === 422) {
        errorMessage = "البيانات المدخلة غير صحيحة";
      } else if (error?.status >= 500) {
        errorMessage = "خطأ في الخادم، يرجى المحاولة لاحقاً";
      } else if (error?.message?.includes("Network")) {
        errorMessage = "خطأ في الاتصال بالخادم";
      } else if (error?.message?.includes("timeout")) {
        errorMessage = "انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى";
      }

      showToast(errorMessage, 'error');
    }
  };

  if (!isOpen) return null;

  const inputStyle =
    "mt-2 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-lg shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3.5 px-4 transition-all duration-200 hover:border-blue-400";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-brand-blue/5 to-transparent">
          <h2 className="text-2xl font-bold text-brand-dark">
            {userToEdit ? "تعديل مستخدم" : "اضافة مستخدم جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-brand-blue-bg border-4 border-brand-blue flex items-center justify-center mb-6 overflow-hidden shadow-lg transition-transform duration-200 hover:scale-105">
                {userData.image ? (
                  <img
                    src={userData.image}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-20 h-20 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer px-6 py-2.5 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 text-sm font-semibold rounded-lg hover:from-gray-300 hover:to-gray-400 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                اختيار صورة
              </label>
              <input
                id="avatar-upload"
                name="avatar-upload"
                type="file"
                className="sr-only"
                onChange={handleAvatarChange}
                accept="image/*"
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className={`${inputStyle} ${validationErrors.name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className={`${inputStyle} ${validationErrors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  الرقم السري
                </label>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={userData.password || ""}
                  onChange={handleChange}
                  className={`${inputStyle} pl-12 ${validationErrors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                  placeholder={userToEdit ? "اتركه فارغاً لعدم التغيير" : ""}
                  required={!userToEdit}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute left-4 top-11 text-gray-500 hover:text-brand-blue transition-colors duration-200"
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {validationErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">
                    {validationErrors.password}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="branchId"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  الفرع التابع له
                </label>
                <select
                  id="branchId"
                  name="branchId"
                  value={userData.branchId}
                  onChange={handleChange}
                  className={`${inputStyle} ${validationErrors.branchId ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                  required
                >
                  <option value="">اختر فرع...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {validationErrors.branchId && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">
                    {validationErrors.branchId}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="roleId"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  الصلاحيات
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={userData.roleId}
                  onChange={handleChange}
                  className={`${inputStyle} ${validationErrors.roleId ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                  required
                >
                  <option value="">اختر الصلاحيات...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {getRoleLabelAr(role.name)}
                    </option>
                  ))}
                </select>
                {validationErrors.roleId && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">
                    {validationErrors.roleId}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating || isLoadingBranches || isLoadingRoles}
              className="px-8 py-3 bg-gradient-to-r from-brand-blue to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {isCreating || isUpdating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
