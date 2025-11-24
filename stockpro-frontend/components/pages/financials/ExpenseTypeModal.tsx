import React, { useState, useEffect } from "react";
import type { ExpenseType } from "../../store/slices/expense/expenseApiSlice";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";

interface ExpenseTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => void;
  typeToEdit: ExpenseType | null;
}

const ExpenseTypeModal: React.FC<ExpenseTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  typeToEdit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (typeToEdit) {
      setName(typeToEdit.name);
      setDescription(typeToEdit.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [typeToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description: description || undefined });
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-dark">
            {typeToEdit ? "تعديل نوع مصروف" : "اضافة نوع مصروف جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                اسم النوع
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                الوصف
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputStyle}
                rows={3}
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
            <PermissionWrapper
              requiredPermission={[
                buildPermission(Resources.EXPENSE_TYPES, Actions.CREATE),
                buildPermission(Resources.EXPENSE_TYPES, Actions.UPDATE),
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

export default ExpenseTypeModal;
