import React, { useState, useCallback } from "react";
import type { RevenueCode } from "../../../types";
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

interface RevenueCodesProps {
  title: string;
}

const RevenueCodes: React.FC<RevenueCodesProps> = ({ title }) => {
  const [revenueCodes, setRevenueCodes] = useState<RevenueCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeToEdit, setCodeToEdit] = useState<RevenueCode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();
  const { showModal } = useModal();

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
        onConfirm: () => {
          try {
            setRevenueCodes((prev) => prev.filter((c) => c.id !== code.id));
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
    [showModal, showToast]
  );

  const handleSave = useCallback(
    (code: RevenueCode) => {
      try {
        if (codeToEdit) {
          // Update existing code
          setRevenueCodes((prev) =>
            prev.map((c) => (c.id === codeToEdit.id ? code : c))
          );
          showToast("تم تعديل بند الإيراد بنجاح");
        } else {
          // Create new code
          setRevenueCodes((prev) => [...prev, code]);
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
    [codeToEdit, showToast, handleCloseModal]
  );

  const filteredCodes = revenueCodes.filter(
    (code) =>
      code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

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
          <div>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.REVENUE_CODES,
                Actions.CREATE
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
        codes={revenueCodes}
      />
    </>
  );
};

export default RevenueCodes;
