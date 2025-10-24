import React, { useState, useEffect } from "react";
import type { CurrentAccount } from "../../../types";
import { useModal } from "../../common/ModalProvider";
import { useToast } from "../../common/ToastProvider";

interface AddCurrentAccountProps {
  title: string;
  editingId: number | null;
  accounts: CurrentAccount[];
  onSave: (account: CurrentAccount | Omit<CurrentAccount, "id">) => void;
  onDelete: (id: number) => void;
  onNavigate: (key: string, label: string, id?: number | null) => void;
}

const emptyAccount: Omit<CurrentAccount, "id"> = {
  code: "",
  name: "",
  type: "",
  openingBalance: 0,
};

const AddCurrentAccount: React.FC<AddCurrentAccountProps> = ({
  title,
  editingId,
  accounts,
  onSave,
  onDelete,
  onNavigate,
}) => {
  const [accountData, setAccountData] = useState<
    CurrentAccount | Omit<CurrentAccount, "id">
  >(emptyAccount);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const { showModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingId !== null) {
      const index = accounts.findIndex((c) => c.id === editingId);
      if (index !== -1) {
        setAccountData(accounts[index]);
        setCurrentIndex(index);
        setIsReadOnly(true);
      }
    } else {
      const nextCodeNumber =
        accounts.length > 0
          ? Math.max(
              ...accounts.map(
                (c) => parseInt(c.code.replace("CA-", ""), 10) || 0,
              ),
            ) + 1
          : 1;
      const newCode = `CA-${String(nextCodeNumber).padStart(3, "0")}`;
      setAccountData({ ...emptyAccount, code: newCode });
      setIsReadOnly(false);
      setCurrentIndex(-1);
    }
  }, [editingId, accounts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSave = () => {
    onSave(accountData);
    showToast(`تم حفظ الحساب "${accountData.name}" بنجاح!`);
    if (!("id" in accountData)) {
      // new
    } else {
      setIsReadOnly(true);
    }
  };

  const handleDelete = () => {
    if ("id" in accountData) {
      showModal({
        title: "تأكيد الحذف",
        message: `هل أنت متأكد من حذف الحساب "${accountData.name}"؟`,
        onConfirm: () => {
          onDelete(accountData.id as number);
          showToast("تم الحذف بنجاح.");
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

  const navigate = (direction: "first" | "prev" | "next" | "last") => {
    let newIndex = -1;
    if (accounts.length === 0) return;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "prev":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "next":
        newIndex = Math.min(accounts.length - 1, currentIndex + 1);
        break;
      case "last":
        newIndex = accounts.length - 1;
        break;
    }

    if (newIndex !== -1) {
      const newId = accounts[newIndex].id;
      onNavigate("add_current_account", `تعديل حساب #${newId}`, newId);
    }
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
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
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              نوع الحساب
            </label>
            <input
              type="text"
              name="type"
              id="type"
              value={accountData.type}
              onChange={handleChange}
              className={inputStyle}
              placeholder="شريك, سلفة,..."
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
              type="number"
              name="openingBalance"
              id="openingBalance"
              value={accountData.openingBalance}
              onChange={handleChange}
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
          <div className="flex justify-start gap-2">
            <button
              type="button"
              onClick={() =>
                onNavigate("add_current_account", "إضافة حساب جاري")
              }
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              جديد
            </button>
            {isReadOnly ? (
              <button
                type="button"
                onClick={handleEdit}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold"
              >
                تعديل
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold"
              >
                حفظ
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={!("id" in accountData)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate("current_accounts_list", "قائمة الحسابات الجارية")
              }
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
            >
              القائمة
            </button>
          </div>

          <div className="flex items-center justify-start gap-1">
            <button
              type="button"
              onClick={() => navigate("first")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              type="button"
              onClick={() => navigate("prev")}
              disabled={currentIndex <= 0}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${accounts.length}`
                  : `سجل جديد`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("next")}
              disabled={currentIndex >= accounts.length - 1}
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={() => navigate("last")}
              disabled={currentIndex >= accounts.length - 1}
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
