import React, { useState, useEffect } from "react";
import { PrintIcon } from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import InvoiceHeader from "../../common/InvoiceHeader";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { usePaymentVouchers } from "../../hook/usePaymentVouchers";
import { useGetExpenseTypesQuery } from "../../store/slices/expense/expenseApiSlice";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  buildPermission,
  Resources,
  Actions,
} from "../../../enums/permissions.enum";
import PaymentVoucherPrintPreview from "./PaymentVoucherPrintPreview";
import { useAuth } from "../../hook/Auth";

interface PaymentVoucherProps {
  title: string;
}

const PaymentVoucher: React.FC<PaymentVoucherProps> = ({ title }) => {
  const { data: companyInfo } = useGetCompanyQuery();
  const { User } = useAuth();
  const {
    vouchers,
    customers,
    suppliers,
    currentAccounts,
    expenseCodes,
    safes,
    banks,
    isLoading,
    voucherData,
    setVoucherData,
    isReadOnly,
    handleNew,
    handleSave,
    handleEdit,
    handleDelete,
    navigate,
    currentIndex,
  } = usePaymentVouchers();
  const { data: expenseTypes = [] } = useGetExpenseTypesQuery();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    // Initialize with a new voucher on mount
    handleNew();
  }, []);

  const handleEntityChange = (field: "type" | "id", value: any) => {
    setVoucherData((prev) => {
      const newEntity = { ...prev.entity, [field]: value };
      if (field === "type") {
        newEntity.id = null;
        newEntity.name = "";
      }
      if (field === "id") {
        let foundName = "";
        if (newEntity.type === "customer")
          foundName = customers.find((c) => c.id === value)?.name || "";
        if (newEntity.type === "supplier")
          foundName = suppliers.find((s) => s.id === value)?.name || "";
        if (newEntity.type === "current_account")
          foundName = currentAccounts.find((a) => a.id === value)?.name || "";
        if (newEntity.type === "expense")
          foundName = expenseCodes.find((c) => c.id === value)?.name || "";
        if (newEntity.type === "expense-Type")
          foundName = expenseTypes.find((t) => t.id === value)?.name || "";
        newEntity.name = foundName;
      }
      return { ...prev, entity: newEntity };
    });
  };

  const renderEntitySelector = () => {
    const entityType = voucherData.entity.type;
    if (entityType === "customer") {
      return (
        <select
          value={voucherData.entity.id || ""}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر عميل...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "supplier") {
      return (
        <select
          value={voucherData.entity.id || ""}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر مورد...</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "current_account") {
      return (
        <select
          value={voucherData.entity.id || ""}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر حساب...</option>
          {currentAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "expense") {
      return (
        <select
          value={voucherData.entity.id || ""}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر بند مصروف...</option>
          {expenseCodes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "expense-Type") {
      return (
        <select
          value={voucherData.entity.id || ""}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر نوع مصروف...</option>
          {expenseTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      );
    }
    return null;
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";

  const navigateToVoucher = (direction: "first" | "prev" | "next" | "last") => {
    if (!Array.isArray(vouchers) || vouchers.length === 0) return;

    let newIndex = currentIndex;

    switch (direction) {
      case "first":
        newIndex = 0;
        break;
      case "last":
        newIndex = vouchers.length - 1;
        break;
      case "next":
        if (currentIndex === -1) {
          newIndex = 0; // from new → first voucher
        } else {
          newIndex = Math.min(vouchers.length - 1, currentIndex + 1);
        }
        break;
      case "prev":
        if (currentIndex === -1) {
          newIndex = vouchers.length - 1; // from new → last voucher
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
        break;
    }

    if (newIndex >= 0 && newIndex < vouchers.length) {
      navigate(newIndex);
    }
  };

  const voucher = currentIndex > -1 ? vouchers[currentIndex] : null;

  if (isLoading) {
    return <div className="text-center p-6">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-brand-green rounded-lg mb-4">
          <InvoiceHeader />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              رقم السند
            </label>
            <input
              type="text"
              value={voucherData.number}
              className={inputStyle + " bg-gray-200"}
              readOnly
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              التاريخ
            </label>
            <input
              type="date"
              value={voucherData.date}
              onChange={(e) =>
                setVoucherData((prev) => ({ ...prev, date: e.target.value }))
              }
              className={inputStyle}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              المبلغ
            </label>
            <input
              type="number"
              value={voucherData.amount}
              onChange={(e) =>
                setVoucherData((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              className={inputStyle}
              placeholder="0.00"
              disabled={isReadOnly}
            />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                اصرفوا لـ
              </label>
              <select
                value={voucherData.entity.type}
                onChange={(e) => handleEntityChange("type", e.target.value)}
                className={inputStyle}
                disabled={isReadOnly}
              >
                <option value="supplier">مورد</option>
                <option value="expense">مصروف</option>
                <option value="customer">عميل</option>
                <option value="current_account">حساب جاري</option>
                <option value="expense-Type">مصروفات ضريبية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                الاسم
              </label>
              {renderEntitySelector()}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              وذلك عن
            </label>
            <textarea
              value={voucherData.description}
              onChange={(e) =>
                setVoucherData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={inputStyle + " h-24"}
              placeholder="تفاصيل الصرف"
              disabled={isReadOnly}
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                طريقة الدفع
              </label>
              <div className="relative mt-1 bg-brand-green-bg border-2 border-brand-green rounded-md p-1 flex items-center">
                <button
                  onClick={() =>
                    setVoucherData((prev) => ({
                      ...prev,
                      paymentMethod: "safe",
                      safeOrBankId: safes.length > 0 ? safes[0].id : null,
                    }))
                  }
                  className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === "safe" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                  disabled={isReadOnly}
                >
                  نقداً (خزنة)
                </button>
                <button
                  onClick={() =>
                    setVoucherData((prev) => ({
                      ...prev,
                      paymentMethod: "bank",
                      safeOrBankId: banks.length > 0 ? banks[0].id : null,
                    }))
                  }
                  className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === "bank" ? "bg-brand-green text-white shadow" : "text-gray-600"} transition-all duration-200`}
                  disabled={isReadOnly}
                >
                  شيك (بنك)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {voucherData.paymentMethod === "safe" ? "الخزينة" : "البنك"}
              </label>
              <select
                value={voucherData.safeOrBankId || ""}
                onChange={(e) =>
                  setVoucherData((prev) => ({
                    ...prev,
                    safeOrBankId: e.target.value || null,
                  }))
                }
                className={inputStyle}
                disabled={isReadOnly}
              >
                <option value="">
                  {voucherData.paymentMethod === "safe"
                    ? "اختر خزينة..."
                    : "اختر بنك..."}
                </option>
                {voucherData.paymentMethod === "safe"
                  ? safes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  : banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-brand-green-bg p-3 rounded-md text-center text-brand-dark font-semibold">
            {companyInfo
              ? tafqeet(voucherData.amount, companyInfo.currency)
              : "جاري التحميل..."}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              جديد
            </button>
            <PermissionWrapper
              requiredPermission={[
                buildPermission(Resources.PAYMENT_VOUCHER, Actions.CREATE),
                buildPermission(Resources.PAYMENT_VOUCHER, Actions.UPDATE),
              ]}
              fallback={
                <button
                  disabled={true}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md font-semibold"
                >
                  حفظ
                </button>
              }
            >
              <button
                onClick={async () => {
                  const savedVoucher = await handleSave();
                  if (savedVoucher) {
                    // Update voucher data with saved voucher data
                    setVoucherData({
                      number: savedVoucher.code,
                      date: savedVoucher.date ? new Date(savedVoucher.date).toISOString().substring(0, 10) : voucherData.date,
                      entity: {
                        type: savedVoucher.entityType as any,
                        id: savedVoucher.customerId || savedVoucher.supplierId || savedVoucher.currentAccountId || savedVoucher.expenseCodeId || null,
                        name: savedVoucher.entityName,
                      },
                      amount: savedVoucher.amount,
                      paymentMethod: savedVoucher.paymentMethod as "safe" | "bank",
                      safeOrBankId: savedVoucher.paymentMethod === "safe" ? savedVoucher.safeId || null : savedVoucher.bankId || null,
                      description: savedVoucher.description || "",
                    });
                    // Find and set current index for navigation
                    setTimeout(() => {
                      const savedIndex = vouchers.findIndex((v) => v.id === savedVoucher.id);
                      if (savedIndex >= 0) {
                        navigate(savedIndex);
                      }
                    }, 300);
                    // Open print preview
                    setIsPreviewOpen(true);
                  }
                }}
                disabled={isReadOnly}
                className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
              >
                حفظ
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.PAYMENT_VOUCHER,
                Actions.UPDATE,
              )}
              fallback={
                <button
                  disabled={true}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md font-semibold"
                >
                  تعديل
                </button>
              }
            >
              <button
                onClick={handleEdit}
                disabled={currentIndex < 0 || !isReadOnly}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400"
              >
                تعديل
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.PAYMENT_VOUCHER,
                Actions.DELETE,
              )}
              fallback={
                <button
                  disabled={true}
                  className="px-4 py-2 bg-gray-400 text-white rounded-md font-semibold"
                >
                  حذف
                </button>
              }
            >
              <button
                onClick={handleDelete}
                disabled={currentIndex < 0}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
            </PermissionWrapper>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">
              بحث
            </button>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.PAYMENT_VOUCHER,
                Actions.PRINT,
              )}
              fallback={
                <button
                  disabled={true}
                  className="px-4 py-2 bg-gray-400 text-brand-dark rounded-md font-semibold flex items-center"
                >
                  <PrintIcon className="mr-2 w-5 h-5" /> معاينة وطباعة
                </button>
              }
            >
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
              >
                <PrintIcon className="mr-2 w-5 h-5" /> معاينة وطباعة
              </button>
            </PermissionWrapper>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigateToVoucher("first")}
              disabled={
                (Array.isArray(vouchers) ? vouchers.length === 0 : true) ||
                currentIndex === 0
              }
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأول
            </button>
            <button
              onClick={() => navigateToVoucher("prev")}
              disabled={
                (Array.isArray(vouchers) ? vouchers.length === 0 : true) ||
                currentIndex === 0
              }
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              السابق
            </button>
            <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
              <span className="font-bold">
                {currentIndex > -1
                  ? `${currentIndex + 1} / ${Array.isArray(vouchers) ? vouchers.length : 0}`
                  : `جديد`}
              </span>
            </div>
            <button
              onClick={() => navigateToVoucher("next")}
              disabled={
                (Array.isArray(vouchers) ? vouchers.length === 0 : true) ||
                currentIndex ===
                  (Array.isArray(vouchers) ? vouchers.length - 1 : 0)
              }
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              التالي
            </button>
            <button
              onClick={() => navigateToVoucher("last")}
              disabled={
                (Array.isArray(vouchers) ? vouchers.length === 0 : true) ||
                currentIndex ===
                  (Array.isArray(vouchers) ? vouchers.length - 1 : 0)
              }
              className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              الأخير
            </button>
          </div>
        </div>
      </div>
      {companyInfo && (
        <PaymentVoucherPrintPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          voucherData={{
            number: voucherData.number,
            date: voucherData.date,
            amount: voucherData.amount,
            paidTo: voucherData.entity.name,
            description: voucherData.description,
            userName: User?.fullName || "غير محدد",
            branchName: typeof User?.branch === 'string' ? User.branch : User?.branch?.name || "غير محدد",
          }}
        />
      )}
    </>
  );
};

export default PaymentVoucher;
