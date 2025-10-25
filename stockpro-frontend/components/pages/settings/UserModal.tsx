import React, { useState, useEffect } from "react";
import type { User, Branch } from "../../../types";
import { EyeIcon, EyeOffIcon, UserIcon } from "../../icons";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  type User as ReduxUser,
} from "../../store/slices/user/userApi";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";

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
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    image: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setUserData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: "",
        image: userToEdit.image || "",
      });
    } else {
      setUserData({
        name: "",
        email: "",
        password: "",
        image: "",
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
        setUserData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userDataToSave = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        image: userData.image,
      };

      if (userToEdit) {
        // Update existing user
        await updateUser({
          id: userToEdit.id,
          data: userDataToSave,
        }).unwrap();
      } else {
        // Create new user
        await createUser(userDataToSave).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      // You might want to show a toast notification here
    }
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
                {userData.image ? (
                  <img
                    src={userData.image}
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
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userData.email}
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
              disabled={isCreating || isUpdating}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
