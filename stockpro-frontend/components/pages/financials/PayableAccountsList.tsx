import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { useModal } from "../../common/ModalProvider";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import { useToast } from "../../common/ToastProvider";
import PermissionWrapper from "../../common/PermissionWrapper";
import { Resources, Actions, buildPermission } from "../../../enums/permissions.enum";
import {
  useGetPayableAccountsQuery,
  useDeletePayableAccountMutation,
} from "../../store/slices/payableAccounts/payableAccountsApi";

interface Props { title: string; onNavigate?: (key: string, label: string, id?: string | null) => void; }

const PayableAccountsList: React.FC<Props> = ({ title, onNavigate }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: accounts = [], isLoading, error } = useGetPayableAccountsQuery();
  const [deleteAccount, { isLoading: isDeleting }] = useDeletePayableAccountMutation();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const inputStyle = "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  const filtered = Array.isArray(accounts)
    ? accounts.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.code.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleDeleteClick = (id: string, name: string) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف الحساب "${name}"؟`,
      onConfirm: async () => {
        try {
          await deleteAccount(id).unwrap();
          showToast("تم حذف الحساب بنجاح");
        } catch {
          showToast("حدث خطأ أثناء حذف الحساب", 'error');
        }
      },
      type: "delete",
    });
  };

  const handleExcelExport = () => {
    const dataToExport = filtered.map(({ code, name }) => ({ الكود: code, "اسم الحساب": name }));
    exportToExcel(dataToExport, "قائمة-الأرصدة-الدائنة");
  };

  const handlePdfExport = () => {
    const head = [["اسم الحساب", "الكود"]];
    const body = filtered.map((acc) => [acc.name, acc.code]);
    exportToPdf("قائمة الأرصدة الدائنة", head, body, "قائمة-الأرصدة-الدائنة");
  };

  if (isLoading) return <div className="bg-white p-6 rounded-lg shadow"><div className="flex justify-center items-center h-64"><div className="text-lg">جاري التحميل...</div></div></div>;
  if (error) return <div className="bg-white p-6 rounded-lg shadow"><div className="flex justify-center items-center h-64"><div className="text-lg text-red-600">حدث خطأ أثناء تحميل البيانات</div></div></div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4 border-b pb-4 no-print">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.CREATE)} fallback={<button disabled className="px-6 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold transition-colors">إضافة حساب جديد</button>}>
          <button onClick={() => navigate("/financials/payable-accounts/add")} className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold transition-colors">إضافة حساب جديد</button>
        </PermissionWrapper>
      </div>

      <div className="flex justify-between items-center mb-4 no-print">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input type="text" placeholder="بحث عن حساب..." className={inputStyle} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExcelExport} title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><ExcelIcon className="w-6 h-6" /></button>
          <button onClick={handlePdfExport} title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PdfIcon className="w-6 h-6" /></button>
          <button title="طباعة" onClick={() => window.print()} className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PrintIcon className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-brand-blue">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">الكود</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">اسم الحساب</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase no-print">اجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((account) => (
              <tr key={account.id} className="hover:bg-brand-blue-bg">
                <td className="px-6 py-4">{account.code}</td>
                <td className="px-6 py-4 font-medium text-brand-dark">{account.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                  <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.UPDATE)} fallback={<button disabled className="text-gray-400 cursor-not-allowed font-semibold ml-4">تعديل</button>}>
                    <button onClick={() => onNavigate ? onNavigate("add_payable_account", `تعديل حساب #${account.code}`, account.id) : navigate(`/financials/payable-accounts/add/${account.id}`)} className="text-brand-blue hover:text-blue-800 font-semibold ml-4">تعديل</button>
                  </PermissionWrapper>
                  <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.DELETE)} fallback={<button disabled className="text-gray-400 cursor-not-allowed font-semibold">حذف</button>}>
                    <button onClick={() => handleDeleteClick(account.id, account.name)} className="text-red-600 hover:text-red-900 font-semibold">حذف</button>
                  </PermissionWrapper>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayableAccountsList;


