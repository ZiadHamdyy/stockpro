import React, { useState } from "react";
import type { Safe, Branch } from "../../../types";
import { PrintIcon, SearchIcon } from "../../icons";
import SafeModal from "./SafeModal.tsx";
import { useModal } from "../../common/ModalProvider.tsx";

interface SafesProps {
  title: string;
  safes: Safe[];
  branches: Branch[];
  onSave: (safe: Safe) => void;
  onDelete: (id: number) => void;
}

const Safes: React.FC<SafesProps> = ({
  title,
  safes,
  branches,
  onSave,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [safeToEdit, setSafeToEdit] = useState<Safe | null>(null);
  const { showModal } = useModal();

  const handleOpenModal = (safe: Safe | null = null) => {
    setSafeToEdit(safe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSafeToEdit(null);
  };

  const handleEditClick = (safe: Safe) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذه الخزنة؟",
      onConfirm: () => handleOpenModal(safe),
      type: "edit",
      showPassword: true,
    });
  };

  const handleDeleteClick = (safe: Safe) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف الخزنة "${safe.name}"؟`,
      onConfirm: () => onDelete(safe.id),
      type: "delete",
      showPassword: true,
    });
  };

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-6 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن خزنة..."
              className={inputStyle}
            />
          </div>
          <div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
            >
              اضافة خزنة جديدة
            </button>
            <button
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
                  كود الخزنة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  اسم الخزنة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safes.map((safe) => (
                <tr key={safe.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{safe.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {safe.name}
                  </td>
                  <td className="px-6 py-4">{safe.branch}</td>
                  <td className="px-6 py-4 text-sm font-medium no-print">
                    <button
                      onClick={() => handleEditClick(safe)}
                      className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteClick(safe)}
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
      <SafeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSave}
        safeToEdit={safeToEdit}
        branches={branches}
        safes={safes}
      />
    </>
  );
};

export default Safes;
