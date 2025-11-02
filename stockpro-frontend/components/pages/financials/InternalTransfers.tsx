import React, { useState, useEffect } from "react";
import { PrintIcon } from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import InvoiceHeader from "../../common/InvoiceHeader";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetSafesQuery } from "../../store/slices/safe/safeApiSlice";
import { useGetBanksQuery } from "../../store/slices/bank/bankApiSlice";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  buildPermission,
  Resources,
  Actions,
} from "../../../enums/permissions.enum";
import { useAuth } from "../../hook/Auth";
import { useToast } from "../../common/ToastProvider";

interface InternalTransfersProps {
  title: string;
}

const InternalTransfers: React.FC<InternalTransfersProps> = ({ title }) => {
  const { data: companyInfo } = useGetCompanyQuery();
  const { User } = useAuth();
  const { showToast } = useToast();
  
  const { data: safes = [] } = useGetSafesQuery();
  const { data: banks = [] } = useGetBanksQuery();

  const [transferData, setTransferData] = useState({
    number: "",
    date: new Date().toISOString().substring(0, 10),
    fromType: "safe" as "safe" | "bank",
    fromId: null as string | null,
    toType: "bank" as "safe" | "bank",
    toId: null as string | null,
    amount: "" as any,
    description: "",
  });

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [vouchers] = useState<any[]>([]); // TODO: Replace with actual API call
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const inputStyle =
    "mt-1 block w-full bg-yellow-100 border-2 border-amber-500 rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";

  const handleSave = async () => {
    if (!transferData.fromId || !transferData.toId) {
      showToast("يرجى اختيار الحساب المصدر والوجهة", "error");
      return;
    }

    if (transferData.fromId === transferData.toId && transferData.fromType === transferData.toType) {
      showToast("لا يمكن التحويل لنفس الحساب", "error");
      return;
    }

    if (!transferData.amount || parseFloat(String(transferData.amount)) <= 0) {
      showToast("يرجى إدخال مبلغ صحيح", "error");
      return;
    }

    // TODO: Implement API call when backend is ready
    showToast("سيتم تطبيق هذه الوظيفة قريباً - جاري تطوير واجهة برمجة التطبيقات", "success");
  };

  const handleNew = () => {
    setTransferData({
      number: "",
      date: new Date().toISOString().substring(0, 10),
      fromType: "safe",
      fromId: null,
      toType: "bank",
      toId: null,
      amount: "",
      description: "",
    });
    setIsReadOnly(false);
    setCurrentIndex(-1);
  };

  const handleEdit = () => {
    setIsReadOnly(false);
  };

  const handleDelete = async () => {
    // TODO: Implement API call when backend is ready
    showToast("سيتم تطبيق هذه الوظيفة قريباً - جاري تطوير واجهة برمجة التطبيقات", "success");
  };

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
          newIndex = 0;
        } else {
          newIndex = Math.min(vouchers.length - 1, currentIndex + 1);
        }
        break;
      case "prev":
        if (currentIndex === -1) {
          newIndex = vouchers.length - 1;
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
        break;
    }

    if (newIndex >= 0 && newIndex < vouchers.length) {
      setCurrentIndex(newIndex);
      // TODO: Load voucher data when backend is ready
      setIsReadOnly(true);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-amber-500 rounded-lg mb-4">
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
              value={transferData.number}
              className={inputStyle + " bg-gray-200"}
              readOnly
              placeholder="سيتم توليده تلقائياً"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              التاريخ
            </label>
            <input
              type="date"
              value={transferData.date}
              onChange={(e) =>
                setTransferData((prev) => ({ ...prev, date: e.target.value }))
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
              type="text"
              value={
                typeof transferData.amount === "string"
                  ? transferData.amount
                  : transferData.amount === 0 || transferData.amount === null
                  ? ""
                  : transferData.amount
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setTransferData((prev) => ({
                    ...prev,
                    amount: value === "" ? (value as any) : parseFloat(value) || 0,
                  }));
                }
              }}
              className={inputStyle}
              placeholder="0.00"
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold text-brand-dark mb-3">
              من
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  نوع الحساب المصدر
                </label>
                <div className="relative mt-1 bg-yellow-100 border-2 border-amber-500 rounded-md p-1 flex items-center">
                  <button
                    onClick={() =>
                      setTransferData((prev) => ({
                        ...prev,
                        fromType: "safe",
                        fromId: null,
                      }))
                    }
                    className={`w-1/2 py-2 rounded ${
                      transferData.fromType === "safe"
                        ? "bg-amber-500 text-white shadow"
                        : "text-gray-600"
                    } transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    خزنة
                  </button>
                  <button
                    onClick={() =>
                      setTransferData((prev) => ({
                        ...prev,
                        fromType: "bank",
                        fromId: null,
                      }))
                    }
                    className={`w-1/2 py-2 rounded ${
                      transferData.fromType === "bank"
                        ? "bg-amber-500 text-white shadow"
                        : "text-gray-600"
                    } transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    بنك
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {transferData.fromType === "safe" ? "الخزينة" : "البنك"}
                </label>
                <select
                  value={transferData.fromId || ""}
                  onChange={(e) =>
                    setTransferData((prev) => ({
                      ...prev,
                      fromId: e.target.value || null,
                    }))
                  }
                  className={inputStyle}
                  disabled={isReadOnly}
                >
                  <option value="">
                    {transferData.fromType === "safe"
                      ? "اختر خزينة..."
                      : "اختر بنك..."}
                  </option>
                  {transferData.fromType === "safe"
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

          <div className="md:col-span-3">
            <h3 className="text-lg font-semibold text-brand-dark mb-3">
              إلى
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  نوع الحساب الوجهة
                </label>
                <div className="relative mt-1 bg-yellow-100 border-2 border-amber-500 rounded-md p-1 flex items-center">
                  <button
                    onClick={() =>
                      setTransferData((prev) => ({
                        ...prev,
                        toType: "safe",
                        toId: null,
                      }))
                    }
                    className={`w-1/2 py-2 rounded ${
                      transferData.toType === "safe"
                        ? "bg-amber-500 text-white shadow"
                        : "text-gray-600"
                    } transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    خزنة
                  </button>
                  <button
                    onClick={() =>
                      setTransferData((prev) => ({
                        ...prev,
                        toType: "bank",
                        toId: null,
                      }))
                    }
                    className={`w-1/2 py-2 rounded ${
                      transferData.toType === "bank"
                        ? "bg-amber-500 text-white shadow"
                        : "text-gray-600"
                    } transition-all duration-200`}
                    disabled={isReadOnly}
                  >
                    بنك
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {transferData.toType === "safe" ? "الخزينة" : "البنك"}
                </label>
                <select
                  value={transferData.toId || ""}
                  onChange={(e) =>
                    setTransferData((prev) => ({
                      ...prev,
                      toId: e.target.value || null,
                    }))
                  }
                  className={inputStyle}
                  disabled={isReadOnly}
                >
                  <option value="">
                    {transferData.toType === "safe"
                      ? "اختر خزينة..."
                      : "اختر بنك..."}
                  </option>
                  {transferData.toType === "safe"
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

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              ملاحظات
            </label>
            <textarea
              value={transferData.description}
              onChange={(e) =>
                setTransferData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={inputStyle + " h-24"}
              placeholder="ملاحظات التحويل"
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-yellow-100 p-3 rounded-md text-center text-brand-dark font-semibold border-2 border-amber-500">
            {companyInfo
              ? tafqeet(
                  typeof transferData.amount === "string"
                    ? parseFloat(transferData.amount) || 0
                    : transferData.amount || 0,
                  companyInfo.currency
                )
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
                buildPermission(Resources.INTERNAL_TRANSFER, Actions.CREATE),
                buildPermission(Resources.INTERNAL_TRANSFER, Actions.UPDATE),
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
                onClick={handleSave}
                disabled={isReadOnly}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-semibold disabled:bg-gray-400"
              >
                حفظ
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.INTERNAL_TRANSFER,
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
                Resources.INTERNAL_TRANSFER,
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
                Resources.INTERNAL_TRANSFER,
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
            <div className="px-4 py-2 bg-yellow-100 border-2 border-amber-500 rounded-md">
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
    </>
  );
};

export default InternalTransfers;

