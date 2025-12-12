import React, { useState, useCallback, useMemo } from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import RevenueCodeModal from "../reports/financials/RevenueCodeModal";
import { useToast } from "../../common/ToastProvider";
import { useModal } from "../../common/ModalProvider";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import {
  useGetRevenueCodesQuery,
  useCreateRevenueCodeMutation,
  useUpdateRevenueCodeMutation,
  useDeleteRevenueCodeMutation,
  type RevenueCode,
} from "../../store/slices/revenueCode/revenueCodeApiSlice";

interface RevenueCodesProps {
  title: string;
}

const RevenueCodes: React.FC<RevenueCodesProps> = ({ title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeToEdit, setCodeToEdit] = useState<RevenueCode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();
  const { showModal } = useModal();

  const { data: revenueCodes = [], isLoading, error } = useGetRevenueCodesQuery(searchTerm || undefined);
  const [createRevenueCode, { isLoading: isCreating }] = useCreateRevenueCodeMutation();
  const [updateRevenueCode, { isLoading: isUpdating }] = useUpdateRevenueCodeMutation();
  const [deleteRevenueCode, { isLoading: isDeleting }] = useDeleteRevenueCodeMutation();

  const handleOpenModal = useCallback((code: RevenueCode | null = null) => {
    setCodeToEdit(code);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setCodeToEdit(null);
  }, []);

  const handleEditClick = useCallback(
    (code: RevenueCode) => {
      showModal({
        title: "تأكيد التعديل",
        message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا البند؟",
        onConfirm: () => handleOpenModal(code),
        type: "edit",
        showPassword: true,
      });
    },
    [showModal, handleOpenModal]
  );

  const handleDeleteClick = useCallback(
    (code: RevenueCode) => {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف بند الإيراد "${code.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteRevenueCode(code.id).unwrap();
            showToast("تم حذف بند الإيراد بنجاح");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف بند الإيراد", "error");
            console.error("Error deleting revenue code:", error);
          }
        },
        type: "delete",
        showPassword: true,
      });
    },
    [showModal, deleteRevenueCode, showToast]
  );

  const handleSave = useCallback(
    async (code: RevenueCode) => {
      try {
        if (codeToEdit) {
          await updateRevenueCode({
            id: codeToEdit.id,
            data: { name: code.name },
          }).unwrap();
          showToast("تم تعديل بند الإيراد بنجاح");
        } else {
          await createRevenueCode({ name: code.name }).unwrap();
          showToast("تم إضافة بند الإيراد بنجاح");
        }
        handleCloseModal();
      } catch (error) {
        showToast(
          codeToEdit
            ? "حدث خطأ أثناء تعديل بند الإيراد"
            : "حدث خطأ أثناء إضافة بند الإيراد",
          "error"
        );
        console.error("Error saving revenue code:", error);
      }
    },
    [codeToEdit, createRevenueCode, updateRevenueCode, showToast, handleCloseModal]
  );

  const filteredCodes = useMemo(() => {
    if (!searchTerm) return revenueCodes;
    const query = searchTerm.toLowerCase();
    return revenueCodes.filter(
      (code) =>
        code.name.toLowerCase().includes(query) ||
        code.code.toLowerCase().includes(query)
    );
  }, [revenueCodes, searchTerm]);

  const isLoadingData = isLoading || isCreating || isUpdating || isDeleting;

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  if (isLoadingData && revenueCodes.length === 0) {
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
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن بند..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.REVENUE_CODES,
                Actions.CREATE
              )}
              fallback={
                <button
                  type="button"
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md font-semibold cursor-not-allowed opacity-50"
                >
                  اضافة بند جديد
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                اضافة بند جديد
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.REVENUE_CODES,
                Actions.PRINT
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
                  اسم بند الإيراد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{code.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {code.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.REVENUE_CODES,
                          Actions.UPDATE
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
                          Resources.REVENUE_CODES,
                          Actions.DELETE
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
      <RevenueCodeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        codeToEdit={codeToEdit}
      />
    </>
  );
};

export default RevenueCodes;
