import React from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import ExpenseTypeModal from "./ExpenseTypeModal.tsx";
import { useExpenseTypes } from "../../hook/useExpenseTypes";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

interface ExpenseTypesProps {
  title: string;
}

const ExpenseTypes: React.FC<ExpenseTypesProps> = ({ title }) => {
  const {
    expenseTypes,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    expenseTypeToEdit,
    handleOpenModal,
    handleCloseModal,
    handleEditClick,
    handleDeleteClick,
    handleSave,
  } = useExpenseTypes();

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
              placeholder="بحث عن نوع..."
              className={inputStyle}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              name="expense-type-search"
            />
          </div>
          <div>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.EXPENSE_TYPES,
                Actions.CREATE,
              )}
              fallback={
                <button
                  type="button"
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md ml-2 font-semibold cursor-not-allowed opacity-50"
                >
                  اضافة نوع جديد
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
              >
                اضافة نوع جديد
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.EXPENSE_TYPES,
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
                  كود النوع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم النوع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenseTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                expenseTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{type.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.EXPENSE_TYPES,
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
                          onClick={() => handleEditClick(type)}
                          className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                        >
                          تعديل
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.EXPENSE_TYPES,
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
                          onClick={() => handleDeleteClick(type)}
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
      <ExpenseTypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        typeToEdit={expenseTypeToEdit}
      />
    </>
  );
};

export default ExpenseTypes;
