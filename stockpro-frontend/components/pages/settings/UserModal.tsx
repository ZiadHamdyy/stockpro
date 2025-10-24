import React, { useState, useEffect } from "react";
import type { User, Branch } from "../../../types";
import { EyeIcon, EyeOffIcon, UserIcon } from "../../icons";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User> & { id?: number }) => void;
  userToEdit: User | null;
  branches: Branch[];
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  branches,
}) => {
  const [userData, setUserData] = useState<Omit<User, "id">>({
    name: "",
    email: "",
    fullName: "",
    username: "",
    password: "",
    permissionGroup: "بائع",
    branch: "",
    avatar: null,
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setUserData({ ...userToEdit, password: "" }); // Don't show password on edit
    } else {
      setUserData({
        name: "",
        email: "",
        fullName: "",
        username: "",
        password: "",
        permissionGroup: "بائع",
        branch: "",
        avatar: null,
      });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userToSave: Partial<User> & { id?: number } = {
      ...userData,
      id: userToEdit?.id,
    };

    if (userToEdit && !userToSave.password) {
      delete userToSave.password;
    }

    onSave(userToSave);
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-dark">
            {userToEdit ? "تعديل مستخدم" : "اضافة مستخدم جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-brand-blue-bg border-2 border-brand-blue flex items-center justify-center mb-4 overflow-hidden">
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300"
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
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={userData.fullName}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  الرقم السري
                </label>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={userData.password || ""}
                  onChange={handleChange}
                  className={inputStyle + " pl-10"}
                  placeholder={userToEdit ? "اتركه فارغاً لعدم التغيير" : ""}
                  required={!userToEdit}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute left-3 top-9 text-gray-500 hover:text-brand-blue"
                >
                  {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div>
                <label
                  htmlFor="permissionGroup"
                  className="block text-sm font-medium text-gray-700"
                >
                  مجموعة الصلاحيات
                </label>
                <select
                  id="permissionGroup"
                  name="permissionGroup"
                  value={userData.permissionGroup}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option>مدير</option>
                  <option>محاسب</option>
                  <option>بائع</option>
                  <option>مدخل بيانات</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="branch"
                  className="block text-sm font-medium text-gray-700"
                >
                  الفرع
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={userData.branch}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                >
                  <option value="">اختر فرع...</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
