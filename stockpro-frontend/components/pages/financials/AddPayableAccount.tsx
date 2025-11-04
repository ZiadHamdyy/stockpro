import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import PermissionWrapper from "../../common/PermissionWrapper";
import { Resources, Actions, buildPermission } from "../../../enums/permissions.enum";
import {
  useGetPayableAccountsQuery,
  useCreatePayableAccountMutation,
  useUpdatePayableAccountMutation,
  useDeletePayableAccountMutation,
  PayableAccount,
} from "../../store/slices/payableAccounts/payableAccountsApi";

interface Props { title: string; editingId?: string | null; onNavigate?: (key: string, label: string, id?: string | null) => void; }

const emptyAccount = { code: "", name: "", openingBalance: 0 } as const;

const AddPayableAccount: React.FC<Props> = ({ title, editingId, onNavigate }) => {
  const navigate = useNavigate();
  const params = useParams();
  const accountId = params.id || editingId;

  const [accountData, setAccountData] = useState<PayableAccount | Omit<PayableAccount, "id" | "createdAt" | "updatedAt">>(emptyAccount);
  const [isReadOnly, setIsReadOnly] = useState(true);

  const { data: accounts = [] } = useGetPayableAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreatePayableAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdatePayableAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeletePayableAccountMutation();

  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (accountId) {
      const found = Array.isArray(accounts) ? accounts.find(a => a.id === accountId) : null;
      if (found) { setAccountData(found); setIsReadOnly(true); }
    } else {
      const next = (accounts || []).length > 0
        ? Math.max(...(accounts as any).map((c: any) => parseInt(String(c.code).replace("PA-", ""), 10) || 0)) + 1
        : 1;
      const newCode = `PA-${String(next).padStart(3, "0")}`;
      setAccountData({ ...emptyAccount, code: newCode });
      setIsReadOnly(false);
    }
  }, [accountId, accounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: name === "openingBalance" ? parseFloat(value) || 0 : value } as any));
  };

  const handleOpeningBalanceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string and valid positive numbers (including decimals, no negatives)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAccountData((prev: any) => ({
        ...prev,
        openingBalance: value === "" ? "" : parseFloat(value) || 0,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const openingBalanceValue =
        typeof (accountData as any).openingBalance === "string"
          ? parseFloat((accountData as any).openingBalance) || 0
          : (accountData as any).openingBalance || 0;
      if (!("id" in accountData)) {
        await createAccount({ name: accountData.name, openingBalance: openingBalanceValue }).unwrap();
        showToast(`تم إنشاء الحساب "${accountData.name}" بنجاح!`);
      } else {
        await updateAccount({ id: accountData.id, data: { name: accountData.name, openingBalance: openingBalanceValue } }).unwrap();
        showToast(`تم تحديث الحساب "${accountData.name}" بنجاح!`);
        setIsReadOnly(true);
      }
    } catch (e) {
      showToast("حدث خطأ أثناء حفظ الحساب", 'error');
    }
  };

  const handleDelete = () => {
    if ("id" in accountData) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف الحساب "${accountData.name}"؟`,
        onConfirm: async () => {
          try {
            await deleteAccount(accountData.id).unwrap();
            showToast("تم الحذف بنجاح.");
            onNavigate?.("add_payable_account", "إضافة حساب");
          } catch {
            showToast("حدث خطأ أثناء حذف الحساب", 'error');
          }
        },
        type: "delete",
      });
    }
  };

  const getCurrentIndex = () => {
    if (!("id" in accountData)) return -1;
    return Array.isArray(accounts) ? accounts.findIndex(acc => acc.id === (accountData as any).id) : -1;
  };

  const navigateBy = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(accounts) || accounts.length === 0) return;
    const currentIndex = getCurrentIndex();
    let newIndex = currentIndex;
    switch (direction) {
      case "first": newIndex = 0; break;
      case "last": newIndex = accounts.length - 1; break;
      case "next": newIndex = currentIndex === -1 ? 0 : Math.min(accounts.length - 1, currentIndex + 1); break;
      case "prev": newIndex = currentIndex === -1 ? accounts.length - 1 : Math.max(0, currentIndex - 1); break;
    }
    if (newIndex >= 0 && newIndex < accounts.length) {
      const newId = (accounts as any)[newIndex].id;
      navigate(`/financials/payable-accounts/add/${newId}`);
    }
  };

  const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">كود الحساب</label>
            <input type="text" name="code" id="code" value={(accountData as any).code} onChange={handleChange} className={inputStyle} disabled required />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم الحساب</label>
            <input type="text" name="name" id="name" value={(accountData as any).name} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required />
          </div>
          <div>
            <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">الرصيد الافتتاحي</label>
            <input
              type="text"
              name="openingBalance"
              id="openingBalance"
              value={
                typeof (accountData as any).openingBalance === "string"
                  ? (accountData as any).openingBalance
                  : (accountData as any).openingBalance === 0 || (accountData as any).openingBalance === null
                  ? ""
                  : (accountData as any).openingBalance
              }
              onChange={handleOpeningBalanceChange}
              className={inputStyle}
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2">
            <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.CREATE)} fallback={<button disabled className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold">جديد</button>}>
              <button type="button" onClick={() => navigate("/financials/payable-accounts/add")} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">جديد</button>
            </PermissionWrapper>

            {isReadOnly ? (
              <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.UPDATE)} fallback={<button disabled className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold">تعديل</button>}>
                <button type="button" onClick={() => setIsReadOnly(false)} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold">تعديل</button>
              </PermissionWrapper>
            ) : (
              <PermissionWrapper requiredPermission={[buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.CREATE), buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.UPDATE)] as any} fallback={<button type="submit" disabled className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold">{isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}</button>}>
                <button type="submit" disabled={isCreating || isUpdating} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50">{isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}</button>
              </PermissionWrapper>
            )}

            <PermissionWrapper requiredPermission={buildPermission(Resources.PAYABLE_ACCOUNTS, Actions.DELETE)} fallback={<button disabled className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold">حذف</button>}>
              <button type="button" onClick={handleDelete} disabled={!("id" in (accountData as any)) || isDeleting} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400">{isDeleting ? "جاري الحذف..." : "حذف"}</button>
            </PermissionWrapper>

            <button type="button" onClick={() => navigate("/financials/payable-accounts/list")} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">القائمة</button>
          </div>

          <div className="flex items-center justify-start gap-1">
            <button type="button" onClick={() => navigateBy("first")} disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأول</button>
            <button type="button" onClick={() => navigateBy("prev")} disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">السابق</button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">{getCurrentIndex() > -1 ? `${getCurrentIndex() + 1} / ${(accounts || []).length}` : `سجل جديد`}</span>
            </div>
            <button type="button" onClick={() => navigateBy("next")} disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === (accounts as any).length - 1} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">التالي</button>
            <button type="button" onClick={() => navigateBy("last")} disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === (accounts as any).length - 1} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأخير</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddPayableAccount;


