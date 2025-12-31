import React from "react";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import { useExpenses } from "../../hook/useExpenses";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import AddExpenseModal from "./AddExpenseModal";

interface ExpensesListProps {
  title: string;
}

const ExpensesList: React.FC<ExpensesListProps> = ({ title }) => {
  const {
    expenses,
    expenseCodes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
  } = useExpenses();

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500">حدث خطأ أثناء تحميل البيانات</div>
        </div>
      </div>
    );
  }

  const handleExcelExport = () => {
    const dataToExport = expenses.map((expense, index) => ({
      م: index + 1,
      الكود: expense.code,
      التاريخ: expense.date,
      "اسم البند": expense.expenseCode?.name || "-",
      "نوع المصروف": expense.expenseCode?.expenseType?.name || "-",
    }));
    exportToExcel(dataToExport, "قائمة-المصروفات");
  };

  const handlePdfExport = () => {
    const head = [["نوع المصروف", "اسم البند", "التاريخ", "الكود", "م"]];
    const body = expenses.map((e, index) => [
      e.expenseCode?.expenseType?.name || "-",
      e.expenseCode?.name || "-",
      e.date,
      e.code,
      (index + 1).toString(),
    ]);

    exportToPdf("قائمة المصروفات", head, body, "قائمة-المصروفات");
  };

  return (
    <>
      <style>{`
        @page {
          @bottom-center {
            content: counter(page) " / " counter(pages);
            font-family: "Cairo", sans-serif;
            font-size: 12px;
            color: #1F2937;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          thead { display: table-header-group; }
          tfoot { display: table-row-group !important; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 6px 8px !important; }
          td { padding: 6px 8px !important; }
          tbody tr:first-child { background: #FFFFFF !important; }
          tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
          tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
          tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            name="expense-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.EXPENSES_LIST,
              Actions.CREATE,
            )}
            fallback={
              <button
                type="button"
                disabled
                className="px-6 py-3 bg-gray-400 text-white rounded-md ml-2 font-semibold cursor-not-allowed opacity-50"
              >
                اضافة مصروف جديد
              </button>
            }
          >
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
            >
              اضافة مصروف جديد
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.EXPENSES_LIST,
              Actions.PRINT,
            )}
            fallback={null}
          >
            <button
              onClick={handleExcelExport}
              title="تصدير Excel"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.EXPENSES_LIST,
              Actions.PRINT,
            )}
            fallback={null}
          >
            <button
              onClick={handlePdfExport}
              title="تصدير PDF"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.EXPENSES_LIST,
              Actions.PRINT,
            )}
          >
            <button
              title="طباعة"
              onClick={() => window.print()}
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
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
                اجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              expenses.map((expense, index) => (
                <tr key={expense.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {expense.code}
                  </td>
                  <td className="px-6 py-4">
                    {expense.expenseCode?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {expense.expenseCode?.expenseType?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                    <PermissionWrapper
                      requiredPermission={buildPermission(
                        Resources.EXPENSES_LIST,
                        Actions.UPDATE,
                      )}
                      fallback={
                        <button
                          type="button"
                          disabled
                          className="text-gray-400 font-semibold ml-4 cursor-not-allowed opacity-50"
                        >
                          تعديل
                        </button>
                      }
                    >
                      <button
                        onClick={() => handleEditClick(expense)}
                        className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                      >
                        تعديل
                      </button>
                    </PermissionWrapper>
                    <PermissionWrapper
                      requiredPermission={buildPermission(
                        Resources.EXPENSES_LIST,
                        Actions.DELETE,
                      )}
                      fallback={
                        <button
                          type="button"
                          disabled
                          className="text-gray-400 font-semibold cursor-not-allowed opacity-50"
                        >
                          حذف
                        </button>
                      }
                    >
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        حذف
                      </button>
                    </PermissionWrapper>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        expenseToEdit={expenseToEdit}
        expenseCodes={expenseCodes}
      />
      </div>
    </>
  );
};

export default ExpensesList;
