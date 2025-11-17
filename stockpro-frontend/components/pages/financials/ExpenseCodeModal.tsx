import React, { useState, useEffect } from "react";
import type {
  ExpenseCode,
  ExpenseType,
} from "../../store/slices/expense/expenseApiSlice";

interface ExpenseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    expenseTypeId: string;
    description?: string;
  }) => void;
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
  const [codeData, setCodeData] = useState({
    name: "",
    expenseTypeId: "",
    description: "",
  });
  const [isDescriptionDirty, setIsDescriptionDirty] = useState(false);

  useEffect(() => {
    if (codeToEdit) {
      setCodeData({
        name: codeToEdit.name,
        expenseTypeId: codeToEdit.expenseTypeId,
        description: codeToEdit.description || "",
      });
      setIsDescriptionDirty(true);
    } else {
      const defaultTypeId = expenseTypes.length > 0 ? expenseTypes[0].id : "";
      setCodeData({ name: "", expenseTypeId: defaultTypeId, description: "" });
      setIsDescriptionDirty(false);
    }
  }, [codeToEdit, isOpen, expenseTypes, codes]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "description") {
      setIsDescriptionDirty(true);
      setCodeData((prev) => ({ ...prev, description: value }));
      return;
    }

    if (name === "name") {
      setCodeData((prev) => {
        const nextState = { ...prev, name: value };
        if (!codeToEdit && !isDescriptionDirty) {
          nextState.description = value;
        }
        return nextState;
      });
      return;
    }

    setCodeData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: codeData.name,
      expenseTypeId: codeData.expenseTypeId,
      description: codeData.description || undefined,
    });
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
            {codeToEdit && (
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
                  value={codeToEdit.code}
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
                htmlFor="expenseTypeId"
                className="block text-sm font-medium text-gray-700"
              >
                نوع المصروف
              </label>
              <select
                id="expenseTypeId"
                name="expenseTypeId"
                value={codeData.expenseTypeId}
                onChange={handleChange}
                className={inputStyle}
                required
              >
                <option value="" disabled>
                  اختر نوع...
                </option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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
                value={codeData.description}
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

export default ExpenseCodeModal;
