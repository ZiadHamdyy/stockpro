import React, { useState, useEffect } from "react";
import type { ExpenseCode, ExpenseType } from "../../../types";

interface ExpenseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (code: ExpenseCode) => void;
  codeToEdit: ExpenseCode | null;
  expenseTypes: ExpenseType[];
  codes: ExpenseCode[];
}

const ExpenseCodeModal: React.FC<ExpenseCodeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  codeToEdit,
  expenseTypes,
  codes,
}) => {
  const [codeData, setCodeData] = useState<Omit<ExpenseCode, "id">>({
    code: "",
    name: "",
    type: "",
  });

  useEffect(() => {
    if (codeToEdit) {
      setCodeData(codeToEdit);
    } else {
      const existingNumbers = codes
        .map((c) =>
          c.code.startsWith("EC-") ? parseInt(c.code.substring(3), 10) : NaN,
        )
        .filter((n) => !isNaN(n));
      const maxNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      const newCode = `EC-${String(maxNumber + 1).padStart(3, "0")}`;

      const defaultType = expenseTypes.length > 0 ? expenseTypes[0].name : "";
      setCodeData({ code: newCode, name: "", type: defaultType });
    }
  }, [codeToEdit, isOpen, expenseTypes, codes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setCodeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeToSave: ExpenseCode = {
      ...codeData,
      id: codeToEdit?.id || 0,
    };
    onSave(codeToSave);
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
            {codeToEdit ? "تعديل بند مصروف" : "اضافة بند مصروف جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                كود البند
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={codeData.code}
                className={inputStyle + " bg-gray-200"}
                required
                readOnly
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                اسم البند
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={codeData.name}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                نوع المصروف
              </label>
              <select
                id="type"
                name="type"
                value={codeData.type}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="" disabled>
                  اختر نوع...
                </option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
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

export default ExpenseCodeModal;
