import React, { useState } from "react";
import type { Bank } from "../../../types";
import { PrintIcon, SearchIcon } from "../../icons";
import BankModal from "./BankModal.tsx";
import { useModal } from "../../common/ModalProvider.tsx";

interface BanksProps {
  title: string;
  banks: Bank[];
  onSave: (bank: Bank) => void;
  onDelete: (id: number) => void;
}

const Banks: React.FC<BanksProps> = ({ title, banks, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<Bank | null>(null);
  const { showModal } = useModal();

  const handleOpenModal = (bank: Bank | null = null) => {
    setBankToEdit(bank);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBankToEdit(null);
  };

  const handleEditClick = (bank: Bank) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا البنك؟",
      onConfirm: () => handleOpenModal(bank),
      type: "edit",
      showPassword: true,
    });
  };

  const handleDeleteClick = (bank: Bank) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف البنك "${bank.name}"؟`,
      onConfirm: () => onDelete(bank.id),
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
              placeholder="بحث عن بنك..."
              className={inputStyle}
            />
          </div>
          <div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
            >
              اضافة بنك جديد
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  كود البنك
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم البنك
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  رقم الحساب
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  الآيبان (IBAN)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {banks.map((bank) => (
                <tr key={bank.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 whitespace-nowrap">{bank.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                    {bank.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bank.accountNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{bank.iban}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                    <button
                      onClick={() => handleEditClick(bank)}
                      className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteClick(bank)}
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
      <BankModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSave}
        bankToEdit={bankToEdit}
        banks={banks}
      />
    </>
  );
};

export default Banks;
