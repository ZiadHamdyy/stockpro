import React, { useState, useEffect } from "react";
import type {
  Expense,
  ExpenseCode,
} from "../../store/slices/expense/expenseApiSlice";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    date: string;
    expenseCodeId: string;
    description?: string;
  }) => void;
  expenseToEdit: Expense | null;
  expenseCodes: ExpenseCode[];
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  expenseCodes,
}) => {
  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split("T")[0],
    expenseCodeId: "",
    description: "",
  });

  useEffect(() => {
    if (expenseToEdit) {
      setExpenseData({
        date: expenseToEdit.date.split("T")[0],
        expenseCodeId: expenseToEdit.expenseCodeId,
        description: expenseToEdit.description || "",
      });
    } else {
      setExpenseData({
        date: new Date().toISOString().split("T")[0],
        expenseCodeId: "",
        description: "",
      });
    }
  }, [expenseToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setExpenseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.expenseCodeId) {
      alert("الرجاء اختيار بند المصروف");
      return;
    }
    onSave(expenseData);
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
            {expenseToEdit ? "تعديل مصروف" : "اضافة مصروف جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {expenseToEdit && (
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  رقم المصروف
                </label>
                <input
                  type="text"
                  id="code"
                  value={expenseToEdit.code}
                  className={inputStyle + " bg-gray-200"}
                  readOnly
                />
              </div>
            )}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                التاريخ
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={expenseData.date}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="expenseCodeId"
                className="block text-sm font-medium text-gray-700"
              >
                بند المصروف
              </label>
              <select
                id="expenseCodeId"
                name="expenseCodeId"
                value={expenseData.expenseCodeId}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="" disabled>
                  اختر بند المصروف...
                </option>
                {expenseCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.code} - {code.name}
                  </option>
                ))}
              </select>
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
                name="description"
                value={expenseData.description}
                onChange={handleChange}
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

export default AddExpenseModal;
