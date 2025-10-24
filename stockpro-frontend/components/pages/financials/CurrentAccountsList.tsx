import React from "react";
import type { CurrentAccount } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { useModal } from "../../common/ModalProvider.tsx";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";

interface CurrentAccountsListProps {
  title: string;
  accounts: CurrentAccount[];
  onAddNew: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const CurrentAccountsList: React.FC<CurrentAccountsListProps> = ({
  title,
  accounts,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";
  const { showModal } = useModal();

  const handleDeleteClick = (id: number, name: string) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف الحساب "${name}"؟`,
      onConfirm: () => onDelete(id),
      type: "delete",
    });
  };

  const handleExcelExport = () => {
    const dataToExport = accounts.map(({ code, name, type }) => ({
      الكود: code,
      "اسم الحساب": name,
      النوع: type,
    }));
    exportToExcel(dataToExport, "قائمة-الحسابات-الجارية");
  };

  const handlePdfExport = () => {
    const head = [["النوع", "اسم الحساب", "الكود"]];
    const body = accounts.map((acc) => [acc.type, acc.name, acc.code]);

    exportToPdf("قائمة الحسابات الجارية", head, body, "قائمة-الحسابات-الجارية");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4 border-b pb-4 no-print">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <button
          onClick={onAddNew}
          className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold transition-colors"
        >
          إضافة حساب جديد
        </button>
      </div>
      <div className="flex justify-between items-center mb-4 no-print">
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="بحث عن حساب..."
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
                الكود
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                اسم الحساب
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase no-print">
                اجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id} className="hover:bg-brand-blue-bg">
                <td className="px-6 py-4">{account.code}</td>
                <td className="px-6 py-4 font-medium text-brand-dark">
                  {account.name}
                </td>
                <td className="px-6 py-4">{account.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                  <button
                    onClick={() => onEdit(account.id)}
                    className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteClick(account.id, account.name)}
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

export default CurrentAccountsList;
