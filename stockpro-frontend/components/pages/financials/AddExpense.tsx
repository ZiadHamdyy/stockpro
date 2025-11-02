import React, { useState, useEffect } from "react";
import type { Expense, ExpenseCode } from "../../../types";
import { useModal } from "../../common/ModalProvider.tsx";
import { useToast } from "../../common/ToastProvider.tsx";

interface AddExpenseProps {
  title: string;
  editingId: number | null;
  expenses: Expense[];
  expenseCodes: ExpenseCode[];
  onSave: (expense: Expense | Omit<Expense, "id">) => void;
  onDelete: (id: number) => void;
  onNavigate: (key: string, label: string, id?: number | null) => void;
}

const emptyExpense: Omit<Expense, "id"> = {
  code: "",
  date: new Date().toISOString().substring(0, 10),
  expenseCodeId: 0,
  expenseCode: "",
  expenseCodeName: "",
  expenseCodeType: "",
  amount: 0,
  description: "",
};

const AddExpense: React.FC<AddExpenseProps> = ({
  title,
  editingId,
  expenses,
  expenseCodes,
  onSave,
  onDelete,
  onNavigate,
}) => {
  const [expenseData, setExpenseData] = useState<Expense | Omit<Expense, "id">>(
    emptyExpense,
  );
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingId !== null) {
      const index = expenses.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        setExpenseData(expenses[index]);
        setCurrentIndex(index);
        setIsReadOnly(true);
      }
    } else {
      const nextCodeNumber =
        expenses.length > 0
          ? Math.max(
              ...expenses.map((e) => parseInt(e.code.split("-")[1]) || 0),
            ) + 1
          : 1;
      const newCode = `MSR-${String(nextCodeNumber).padStart(3, "0")}`;
      setExpenseData({ ...emptyExpense, code: newCode });
      setIsReadOnly(false);
      setCurrentIndex(-1);
    }
  }, [editingId, expenses]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setExpenseData((prev) => {
      let updatedValue: string | number = value;
      if (name === "amount" || name === "expenseCodeId") {
        updatedValue = parseFloat(value) || 0;
      }

      const updatedData = { ...prev, [name]: updatedValue };

      if (name === "expenseCodeId") {
        const selectedCode = expenseCodes.find((c) => c.id === updatedValue);
        updatedData.expenseCode = selectedCode?.code || "";
        updatedData.expenseCodeName = selectedCode?.name || "";
        updatedData.expenseCodeType = selectedCode?.type || "";
      }

      return updatedData;
    });
  };

  const handleSave = () => {
    if (!expenseData.expenseCodeId || expenseData.amount <= 0) {
      showToast("الرجاء اختيار بند المصروف وإدخال مبلغ صحيح.", 'error');
      return;
    }
    onSave(expenseData);
    showToast(`تم حفظ المصروف بنجاح!`);
    if (!("id" in expenseData)) {
      // new
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in expenseData) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف هذا المصروف؟`,
        onConfirm: () => {
          onDelete(expenseData.id as number);
          showToast("تم الحذف بنجاح.");
        },
        type: "delete",
      });
    }
  };

  const handleEdit = () => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المصروف؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const navigate = (direction: "first" | "prev" | "next" | "last") => {
    let newIndex = -1;
    if (expenses.length === 0) return;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "prev":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "next":
        newIndex = Math.min(expenses.length - 1, currentIndex + 1);
        break;
      case "last":
        newIndex = expenses.length - 1;
        break;
    }

    if (newIndex !== -1 && expenses[newIndex]) {
      const newId = expenses[newIndex].id;
      onNavigate("add_expense", `تعديل مصروف #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              رقم المصروف
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={expenseData.code}
              className={inputStyle}
              readOnly
            />
          </div>
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              التاريخ
            </label>
            <input
              type="date"
              name="date"
              id="date"
              value={expenseData.date}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700"
            >
              المبلغ
            </label>
            <input
              type="number"
              name="amount"
              id="amount"
              value={expenseData.amount}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="expenseCodeId"
              className="block text-sm font-medium text-gray-700"
            >
              بند المصروف
            </label>
            <select
              name="expenseCodeId"
              id="expenseCodeId"
              value={expenseData.expenseCodeId}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            >
              <option value={0}>اختر بند...</option>
              {expenseCodes.map((code) => (
                <option
                  key={code.id}
                  value={code.id}
                >{`${code.code} - ${code.name}`}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="expenseCodeType"
              className="block text-sm font-medium text-gray-700"
            >
              نوع المصروف
            </label>
            <input
              type="text"
              name="expenseCodeType"
              id="expenseCodeType"
              value={expenseData.expenseCodeType}
              className={inputStyle + " bg-gray-200"}
              readOnly
            />
          </div>
          <div className="md:col-span-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              البيان
            </label>
            <textarea
              name="description"
              id="description"
              value={expenseData.description}
              onChange={handleChange}
              className={inputStyle}
              rows={3}
              disabled={isReadOnly}
            ></textarea>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2">
            <button
              type="button"
              onClick={() => onNavigate("add_expense", "إضافة مصروف")}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              جديد
            </button>
            {isReadOnly ? (
              <button
                type="button"
                onClick={handleEdit}
                disabled={!("id" in expenseData)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold"
              >
                تعديل
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold"
              >
                حفظ
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={!("id" in expenseData)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={() => onNavigate("expenses_list", "قائمة المصروفات")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              القائمة
            </button>
          </div>

          <div className="flex items-center justify-start gap-1">
            <button
              type="button"
              onClick={() => navigate("first")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigate("prev")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {currentIndex > -1 && expenses.length > 0
                  ? `${currentIndex + 1} / ${expenses.length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={currentIndex < 0 || currentIndex >= expenses.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigate("last")}
              disabled={currentIndex < 0 || currentIndex >= expenses.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأخير
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
