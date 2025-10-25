import React from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import ExpenseCodeModal from "./ExpenseCodeModal.tsx";
import { useExpenseCodes } from "../../hook/useExpenseCodes";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

interface ExpenseCodesProps {
  title: string;
}

const ExpenseCodes: React.FC<ExpenseCodesProps> = ({ title }) => {
  const {
    expenseCodes,
    expenseTypes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseCodeToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
  } = useExpenseCodes();

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

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-6 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن بند..."
              className={inputStyle}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              name="expense-code-search"
            />
          </div>
          <div>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.EXPENSE_CODES,
                Actions.CREATE,
              )}
              fallback={
                <button
                  type="button"
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md ml-2 font-semibold cursor-not-allowed opacity-50"
                >
                  اضافة بند جديد
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
              >
                اضافة بند جديد
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.EXPENSE_CODES,
                Actions.PRINT,
              )}
            >
              <button
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  كود البند
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم البند
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                expenseCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{code.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {code.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.expenseType?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.EXPENSE_CODES,
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
                          onClick={() => handleEditClick(code)}
                          className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                        >
                          تعديل
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.EXPENSE_CODES,
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
                          onClick={() => handleDeleteClick(code)}
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
      </div>
      <ExpenseCodeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        codeToEdit={expenseCodeToEdit}
        expenseTypes={expenseTypes}
        codes={expenseCodes}
      />
    </>
  );
};

export default ExpenseCodes;
