import React from "react";
import type { Expense } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { useModal } from "../../common/ModalProvider.tsx";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";

interface ExpensesListProps {
  title: string;
  expenses: Expense[];
  onDelete: (id: number) => void;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  title,
  expenses,
  onDelete,
}) => {
  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";
  const { showModal } = useModal();

  const handleDeleteClick = (id: number, code: string) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف المصروف رقم "${code}"؟`,
      onConfirm: () => onDelete(id),
      type: "delete",
    });
  };

  const handleExcelExport = () => {
    const dataToExport = expenses.map(
      ({ code, expenseCodeName, expenseCodeType, amount, date }, index) => ({
        م: index + 1,
        الكود: code,
        التاريخ: date,
        "اسم البند": expenseCodeName,
        "نوع المصروف": expenseCodeType,
        المبلغ: amount,
      }),
    );
    exportToExcel(dataToExport, "قائمة-المصروفات");
  };

  const handlePdfExport = () => {
    const head = [
      ["المبلغ", "نوع المصروف", "اسم البند", "التاريخ", "الكود", "م"],
    ];
    const body = expenses.map((e, index) => [
      e.amount.toFixed(2),
      e.expenseCodeType,
      e.expenseCodeName,
      e.date,
      e.code,
      (index + 1).toString(),
    ]);

    exportToPdf("قائمة المصروفات", head, body, "قائمة-المصروفات");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
      </div>
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="بحث عن مصروف..."
            className={inputStyle}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExcelExport}
            title="تصدير Excel"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <ExcelIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handlePdfExport}
            title="تصدير PDF"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <PdfIcon className="w-6 h-6" />
          </button>
          <button
            title="طباعة"
            onClick={() => window.print()}
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <PrintIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-brand-blue">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                م
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                الكود
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                اسم البند
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                نوع المصروف
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                المبلغ
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase no-print">
                اجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr key={expense.id} className="hover:bg-brand-blue-bg">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-brand-dark">
                  {expense.code}
                </td>
                <td className="px-6 py-4">{expense.expenseCodeName}</td>
                <td className="px-6 py-4">{expense.expenseCodeType}</td>
                <td className="px-6 py-4 font-semibold">
                  {expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                  <button
                    onClick={() => handleDeleteClick(expense.id, expense.code)}
                    className="text-red-600 hover:text-red-900 font-semibold"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesList;
