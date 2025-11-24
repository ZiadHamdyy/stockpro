import React, { useState, useEffect } from "react";
import { useGetUsersQuery } from "../../store/slices/user/userApi";
import type { Branch } from "../../store/slices/branch/branchApi";
import type { Store as StoreEntity } from "../../store/slices/store/storeApi";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";

interface StoreFormData {
  name: string;
  branchId: string;
  userId: string;
}

interface StoreFormSubmit extends StoreFormData {
  id?: string;
}

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (store: StoreFormSubmit) => void;
  storeToEdit: StoreEntity | null;
  availableBranches: Branch[];
}

const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  storeToEdit,
  availableBranches,
}) => {
  const { data: users = [] } = useGetUsersQuery();
  const [storeData, setStoreData] = useState<StoreFormData>({
    name: "",
    branchId: "",
    userId: "",
  });

  useEffect(() => {
    if (storeToEdit) {
      setStoreData({
        name: storeToEdit.name ?? "",
        branchId:
          storeToEdit.branchId ??
          storeToEdit.branch?.id ??
          "",
        userId:
          storeToEdit.userId ??
          storeToEdit.user?.id ??
          "",
      });
    } else {
      setStoreData({ name: "", branchId: "", userId: "" });
    }
  }, [storeToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setStoreData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storeToSave: StoreFormSubmit = {
      ...storeData,
      id: storeToEdit?.id ?? undefined,
    };
    onSave(storeToSave);
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
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-dark">
            {storeToEdit ? "تعديل مخزن" : "اضافة مخزن جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                اسم المخزن
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={storeData.name}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="branchId"
                className="block text-sm font-medium text-gray-700"
              >
                الفرع التابع له
              </label>
              <select
                id="branchId"
                name="branchId"
                value={storeData.branchId}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="">اختر فرع...</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700"
              >
                أمين المخزن
              </label>
              <select
                id="userId"
                name="userId"
                value={storeData.userId}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="">اختر أمين مخزن...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
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
            <PermissionWrapper
              requiredPermission={[
                buildPermission(Resources.STORES_DATA, Actions.CREATE),
                buildPermission(Resources.STORES_DATA, Actions.UPDATE),
              ]}
            >
              <button
                type="submit"
                className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                حفظ
              </button>
            </PermissionWrapper>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreModal;
