import React, { useState, useEffect } from "react";
import type { Safe } from "../../../types";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (safe: Partial<Safe>) => Promise<void>;
  safeToEdit: Safe | null;
}

const SafeModal: React.FC<SafeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  safeToEdit,
}) => {
  const { data: branches = [] } = useGetBranchesQuery();
  const [safeData, setSafeData] = useState<Partial<Safe>>({
    name: "",
    branchId: "",
    openingBalance: 0,
  });

  useEffect(() => {
    if (safeToEdit) {
      setSafeData(safeToEdit);
    } else {
      setSafeData({
        name: "",
        branchId: "",
        openingBalance: 0,
      });
    }
  }, [safeToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setSafeData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(safeData);
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
            {safeToEdit ? "تعديل خزنة" : "اضافة خزنة جديدة"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {safeToEdit && (
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  كود الخزنة
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={safeToEdit.code}
                  className={inputStyle + " bg-gray-200"}
                  readOnly
                />
              </div>
            )}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                اسم الخزنة
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={safeData.name}
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
                الفرع
              </label>
              <select
                id="branchId"
                name="branchId"
                value={safeData.branchId}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="">اختر فرع...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="openingBalance"
                className="block text-sm font-medium text-gray-700"
              >
                الرصيد الافتتاحي
              </label>
              <input
                type="number"
                id="openingBalance"
                name="openingBalance"
                value={safeData.openingBalance}
                onChange={handleChange}
                className={inputStyle}
              />
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

export default SafeModal;
