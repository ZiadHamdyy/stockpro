import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";
import { useTitle } from "../../context/TitleContext";
import {
  useGetCurrentAccountsQuery,
  useCreateCurrentAccountMutation,
  useUpdateCurrentAccountMutation,
  useDeleteCurrentAccountMutation,
  CurrentAccount,
} from "../../store/slices/currentAccounts";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useAppSelector } from "../../store/hooks";

interface AddCurrentAccountProps {
  title: string;
  editingId?: string | null;
  onNavigate?: (key: string, label: string, id?: string | null) => void;
}

const emptyAccount: {
  code: string;
  name: string;
  openingBalance: number;
} = {
  code: "",
  name: "",
  openingBalance: 0,
};

const AddCurrentAccount: React.FC<AddCurrentAccountProps> = ({
  title,
  editingId,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const { setTitle } = useTitle();

  // Get the account ID from URL parameters or props
  const accountId = params.id || editingId;

  const [accountData, setAccountData] = useState<
    CurrentAccount | Omit<CurrentAccount, "id" | "createdAt" | "updatedAt">
  >(emptyAccount);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [accountPosition, setAccountPosition] = useState<number | null>(null);

  const { data: accounts = [], isLoading } = useGetCurrentAccountsQuery();
  const [createCurrentAccount, { isLoading: isCreating }] =
    useCreateCurrentAccountMutation();
  const [updateCurrentAccount, { isLoading: isUpdating }] =
    useUpdateCurrentAccountMutation();
  const [deleteCurrentAccount, { isLoading: isDeleting }] =
    useDeleteCurrentAccountMutation();

  const { showModal } = useModal();
  const { showToast } = useToast();

  // Calculate account position when accounts data is available
  useEffect(() => {
    if (Array.isArray(accounts) && accounts.length > 0 && accountId) {
      const index = accounts.findIndex((account) => account.id === accountId);
      const position = index !== -1 ? index + 1 : null;
      setAccountPosition(position);

      // Update title context for the header
      if (position) {
        setTitle(`تعديل حساب #${position}`);
      } else {
        setTitle(`تعديل حساب`);
      }
    } else {
      setAccountPosition(null);
      setTitle(`تعديل حساب`);
    }
  }, [accounts, accountId, setTitle]);

  useEffect(() => {
    if (accountId !== null && accountId !== undefined) {
      const foundAccount = Array.isArray(accounts)
        ? accounts.find((account) => account.id === accountId)
        : null;
      if (foundAccount) {
        setAccountData(foundAccount);
        setIsReadOnly(true);
      }
    } else {
      const nextCodeNumber =
        (accounts || []).length > 0
          ? Math.max(
              ...(accounts || []).map(
                (c) => parseInt(c.code.replace("CA-", ""), 10) || 0,
              ),
            ) + 1
          : 1;
      const newCode = `CA-${String(nextCodeNumber).padStart(3, "0")}`;
      setAccountData({ ...emptyAccount, code: newCode });
      setIsReadOnly(false);
    }
  }, [accountId, accounts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleOpeningBalanceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string, lone minus, and valid numbers (positive or negative)
    if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
      setAccountData((prev: any) => ({
        ...prev,
        openingBalance:
          value === "" || value === "-" ? value : parseFloat(value) || 0,
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
        // Create new account
        await createCurrentAccount({
          name: accountData.name,
          openingBalance: openingBalanceValue,
        }).unwrap();
        showToast(`تم إنشاء الحساب "${accountData.name}" بنجاح!`);
      } else {
        // Update existing account
        await updateCurrentAccount({
          id: accountData.id,
          data: {
            name: accountData.name,
            openingBalance: openingBalanceValue,
          },
        }).unwrap();
        showToast(`تم تحديث الحساب "${accountData.name}" بنجاح!`);
        setIsReadOnly(true);
      }
    } catch (error) {
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
            await deleteCurrentAccount(accountData.id).unwrap();
            showToast("تم الحذف بنجاح.");
            onNavigate("add_current_account", "إضافة حساب جاري");
          } catch (error) {
            showToast("حدث خطأ أثناء حذف الحساب", 'error');
          }
        },
        type: "delete",
      });
    }
  };

  const handleEdit = () => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا الحساب؟",
      onConfirm: () => setIsReadOnly(false),
      type: "edit",
    });
  };

  const getCurrentIndex = () => {
    if (!('id' in accountData)) return -1;
    return Array.isArray(accounts)
      ? accounts.findIndex((acc) => acc.id === accountData.id)
      : -1;
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
      const newId = accounts[newIndex].id;
      navigate(`/financials/current-accounts/add/${newId}`);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">
        {accountPosition ? `تعديل حساب #${accountPosition}` : title}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              كود الحساب
            </label>
            <input
              type="text"
              name="code"
              id="code"
              value={accountData.code}
              onChange={handleChange}
              className={inputStyle}
              disabled
              required
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              اسم الحساب
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={accountData.name}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
              required
            />
          </div>
          <div>
            <label
              htmlFor="openingBalance"
              className="block text-sm font-medium text-gray-700"
            >
              الرصيد الافتتاحي
            </label>
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
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.CURRENT_ACCOUNTS,
                Actions.CREATE,
              )}
              fallback={
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                >
                  جديد
                </button>
              }
            >
              <button
                type="button"
                onClick={() => navigate("/financials/current-accounts/add")}
                className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                جديد
              </button>
            </PermissionWrapper>
            {isReadOnly ? (
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.CURRENT_ACCOUNTS,
                  Actions.UPDATE,
                )}
                fallback={
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                  >
                    تعديل
                  </button>
                }
              >
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold"
                >
                  تعديل
                </button>
              </PermissionWrapper>
            ) : (
              <PermissionWrapper
                requiredPermission={[
                  buildPermission(Resources.CURRENT_ACCOUNTS, Actions.CREATE),
                  buildPermission(Resources.CURRENT_ACCOUNTS, Actions.UPDATE),
                ]}
                fallback={
                  <button
                    type="submit"
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                  >
                    {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
                  </button>
                }
              >
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
                </button>
              </PermissionWrapper>
            )}
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.CURRENT_ACCOUNTS,
                Actions.DELETE,
              )}
              fallback={
                <button
                  disabled
                  className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                >
                  حذف
                </button>
              }
            >
              <button
                type="button"
                onClick={handleDelete}
                disabled={!("id" in accountData) || isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                {isDeleting ? "جاري الحذف..." : "حذف"}
              </button>
            </PermissionWrapper>
            <button
              type="button"
              onClick={() => navigate("/financials/current-accounts/list")}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              القائمة
            </button>
          </div>

          <div className="flex items-center justify-start gap-1">
            <button
              type="button"
              onClick={() => navigateBy("first")}
              disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigateBy("prev")}
              disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {getCurrentIndex() > -1
                  ? `${getCurrentIndex() + 1} / ${(accounts || []).length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateBy("next")}
              disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === accounts.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigateBy("last")}
              disabled={(Array.isArray(accounts) ? accounts.length === 0 : true) || getCurrentIndex() === accounts.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأخير
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddCurrentAccount;
