import React, { useState, useEffect } from "react";
import type { Bank } from "../../../types";

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bank: Partial<Bank>) => Promise<void>;
  bankToEdit: Bank | null;
}

const BankModal: React.FC<BankModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bankToEdit,
}) => {
  const [bankData, setBankData] = useState<any>({
    name: "",
    accountNumber: "",
    iban: "",
    openingBalance: "" as any,
  });

  useEffect(() => {
    if (bankToEdit) {
      setBankData({
        ...bankToEdit,
        openingBalance:
          bankToEdit.openingBalance === 0 || bankToEdit.openingBalance === null
            ? ("" as any)
            : bankToEdit.openingBalance,
      });
    } else {
      setBankData({
        name: "",
        accountNumber: "",
        iban: "",
        openingBalance: "" as any,
      });
    }
  }, [bankToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankData((prev) => ({
      ...prev,
      [name]: name === "openingBalance" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleOpeningBalanceChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // Allow empty string and valid positive numbers (including decimals, no negatives)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBankData((prev) => ({
        ...prev,
        openingBalance: value === "" ? "" : parseFloat(value) || 0,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...bankData,
      openingBalance:
        typeof bankData.openingBalance === "string"
          ? parseFloat(bankData.openingBalance) || 0
          : bankData.openingBalance || 0,
    };
    await onSave(dataToSave);
  };

  if (!isOpen) return null;

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-dark">
            {bankToEdit ? "تعديل بنك" : "اضافة بنك جديد"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {bankToEdit && (
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700"
                >
                  كود البنك
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={bankToEdit.code}
                  className={inputStyle + " bg-gray-200"}
                  readOnly
                />
              </div>
            )}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                اسم البنك
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={bankData.name}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700"
              >
                رقم الحساب
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={bankData.accountNumber}
                onChange={handleChange}
                className={inputStyle}
                required
              />
            </div>
            <div>
              <label
                htmlFor="iban"
                className="block text-sm font-medium text-gray-700"
              >
                الآيبان (IBAN)
              </label>
              <input
                type="text"
                id="iban"
                name="iban"
                value={bankData.iban}
                onChange={handleChange}
                className={inputStyle}
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
                id="openingBalance"
                name="openingBalance"
                value={
                  typeof bankData.openingBalance === "string"
                    ? bankData.openingBalance
                    : bankData.openingBalance === 0 || bankData.openingBalance === null
                    ? ""
                    : bankData.openingBalance
                }
                onChange={handleOpeningBalanceChange}
                className={inputStyle}
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankModal;
