import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PrintIcon } from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import DocumentHeader from "../../common/DocumentHeader";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useToast } from "../../common/ToastProvider";
import {
  buildPermission,
  Resources,
  Actions,
} from "../../../enums/permissions.enum";
import { useInternalTransfers } from "../../hook/useInternalTransfers";
import DataTableModal from "../../common/DataTableModal";
import InternalTransferPrintPreview from "./InternalTransferPrintPreview";
import { useAuth } from "../../hook/Auth";
import { useUserPermissions } from "../../hook/usePermissions";

interface InternalTransfersProps {
  title: string;
}

const InternalTransfers: React.FC<InternalTransfersProps> = ({ title }) => {
  const { data: companyInfo } = useGetCompanyQuery();
  const { User } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useUserPermissions();
  
  const {
    vouchers: allVouchers,
    safes,
    branchSafes,
    banks,
    isLoading,
    currentIndex,
    transferData,
    setTransferData,
    isReadOnly,
    handleNew,
    handleSave,
    handleEdit,
    handleDelete,
    navigate,
    refetch,
    isCreating,
    isUpdating,
    isDeleting,
    setCurrentIndex,
  } = useInternalTransfers();
  
  // Helper function to get user's branch ID
  const getUserBranchId = (user: any): string | null => {
    if (!user) return null;
    if (user.branchId) return user.branchId;
    const branch = user?.branch;
    if (typeof branch === "string") return branch;
    if (branch && typeof branch === "object") return branch.id || null;
    return null;
  };
  
  // Get current user's branch ID
  const userBranchId = getUserBranchId(User);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.INTERNAL_TRANSFER, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Filter vouchers: show only current branch + current user
  const visibleBranchSafes = useMemo(
    () => (canSearchAllBranches ? safes : branchSafes),
    [branchSafes, canSearchAllBranches, safes],
  );

  const vouchers = useMemo(() => {
    return allVouchers.filter((voucher: any) => {
      // Filter by current branch if user doesn't have SEARCH permission
      const voucherBranchId = voucher.branch?.id || voucher.branchId;
      if (!canSearchAllBranches && userBranchId && voucherBranchId !== userBranchId) {
        return false;
      }
      
      return true;
    });
  }, [allVouchers, canSearchAllBranches, userBranchId]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [shouldResetOnClose, setShouldResetOnClose] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const shouldOpenPreviewRef = useRef(false);
  const [previewVoucherData, setPreviewVoucherData] = useState<{
    number: string;
    date: string;
    amount: number;
    fromAccount: string;
    fromType: string;
    toAccount: string;
    toType: string;
    description: string;
    userName: string;
    branchName: string;
  } | null>(null);

  // Open preview when previewVoucherData is set and we have a flag to open it
  useEffect(() => {
    if (shouldOpenPreviewRef.current && previewVoucherData) {
      setIsPreviewOpen(true);
      shouldOpenPreviewRef.current = false; // Reset flag
    }
  }, [previewVoucherData]);

  // Handle transferId from URL query params
  useEffect(() => {
    const transferId = searchParams.get("transferId");
    if (transferId) {
      // Wait for vouchers to load before processing
      if (vouchers.length > 0 && !isLoading) {
        // Use flexible comparison to handle both string and number IDs
        const index = vouchers.findIndex(
          (v) => 
            String(v.id) === String(transferId) || 
            v.id === transferId ||
            String(v.code) === String(transferId) || 
            v.code === transferId
        );
        if (index !== -1) {
          if (index !== currentIndex) {
            setCurrentIndex(index);
            setHasInitialized(true);
          }
          // Remove the query param after setting the index
          searchParams.delete("transferId");
          setSearchParams(searchParams, { replace: true });
        } else {
          console.warn(`Transfer with ID/code "${transferId}" not found. Available transfers:`, vouchers.map(v => ({ id: v.id, code: v.code })));
          setHasInitialized(true);
        }
      }
      // If vouchers haven't loaded yet, wait - don't initialize with "new"
      // Set hasInitialized to true to prevent "new" initialization while waiting
      if (!hasInitialized && vouchers.length === 0) {
        setHasInitialized(true);
      }
      return;
    }
    
    // Only initialize with new transfer if no transferId in URL and not already initialized
    if (!hasInitialized && !isLoading && vouchers.length >= 0 && currentIndex === -1) {
      handleNew();
      setHasInitialized(true);
    }
  }, [vouchers, isLoading, searchParams, setSearchParams, currentIndex, setCurrentIndex, hasInitialized, handleNew]);

  const inputStyle =
    "mt-1 block w-full bg-yellow-100 border-2 border-amber-500 rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";

  const isExistingTransfer = currentIndex > -1;
  const canPrintExistingTransfer = isExistingTransfer && isReadOnly;

  const handleOpenPreview = () => {
    if (!canPrintExistingTransfer) {
      showToast("لا يمكن الطباعة إلا بعد حفظ السند.", "error");
      return;
    }
    setShouldResetOnClose(false);
    setIsPreviewOpen(true);
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
      navigate(newIndex);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-2 border-amber-500 rounded-lg mb-4">
          <DocumentHeader companyInfo={companyInfo} />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              رقم السند
            </label>
            <input
              type="text"
              value={transferData.number || ""}
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
                        fromId: visibleBranchSafes.length > 0 ? visibleBranchSafes[0].id : null,
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
                  disabled={isReadOnly || transferData.fromType === "safe"}
                >
                  <option value="">
                    {transferData.fromType === "safe"
                      ? "اختر خزينة..."
                      : "اختر بنك..."}
                  </option>
                  {transferData.fromType === "safe"
                    ? visibleBranchSafes.map((s) => (
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
                        toId: visibleBranchSafes.length > 0 ? visibleBranchSafes[0].id : null,
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
                  disabled={isReadOnly || transferData.toType === "safe"}
                >
                  <option value="">
                    {transferData.toType === "safe"
                      ? "اختر خزينة..."
                      : "اختر بنك..."}
                  </option>
                  {transferData.toType === "safe"
                    ? visibleBranchSafes.map((s) => (
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

        <div className="bg-gray-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
          <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4 no-print">
            <div className="flex justify-center gap-2 flex-wrap">
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.INTERNAL_TRANSFER,
                  Actions.CREATE,
                )}
              >
                <button
                  onClick={handleNew}
                  className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
                >
                  جديد
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.INTERNAL_TRANSFER,
                  isExistingTransfer ? Actions.UPDATE : Actions.CREATE,
                )}
              >
                <button
                  onClick={async () => {
                    const savedVoucher = await handleSave();
                    if (savedVoucher) {
                      // Get account names from saved voucher data
                      const fromAccountName =
                        savedVoucher.fromType === "safe"
                          ? savedVoucher.fromSafe?.name || "-"
                          : savedVoucher.fromBank?.name || "-";
                      const toAccountName =
                        savedVoucher.toType === "safe"
                          ? savedVoucher.toSafe?.name || "-"
                          : savedVoucher.toBank?.name || "-";
                      
                      // Prepare preview data from saved voucher
                      const previewData = {
                        number: savedVoucher.code,
                        date: savedVoucher.date
                          ? new Date(savedVoucher.date).toISOString().substring(0, 10)
                          : transferData.date,
                        amount: savedVoucher.amount || 0,
                        fromAccount: fromAccountName,
                        fromType: savedVoucher.fromType,
                        toAccount: toAccountName,
                        toType: savedVoucher.toType,
                        description: savedVoucher.description || "",
                        userName: User?.fullName || User?.name || "غير محدد",
                        branchName:
                          typeof User?.branch === "string"
                            ? User.branch
                            : User?.branch?.name || "غير محدد",
                      };
                      
                      // Set preview data and flag to open preview
                      setPreviewVoucherData(previewData);
                      setShouldResetOnClose(true);
                      shouldOpenPreviewRef.current = true;
                      
                      // Update transfer data with saved voucher data
                      setTransferData({
                        number: savedVoucher.code,
                        date: savedVoucher.date
                          ? new Date(savedVoucher.date).toISOString().substring(0, 10)
                          : transferData.date,
                        fromType: savedVoucher.fromType as "safe" | "bank",
                        fromId:
                          savedVoucher.fromType === "safe"
                            ? savedVoucher.fromSafeId || null
                            : savedVoucher.fromBankId || null,
                        toType: savedVoucher.toType as "safe" | "bank",
                        toId:
                          savedVoucher.toType === "safe"
                            ? savedVoucher.toSafeId || null
                            : savedVoucher.toBankId || null,
                        amount:
                          savedVoucher.amount === 0 || savedVoucher.amount === null
                            ? ("" as any)
                            : savedVoucher.amount,
                        description: savedVoucher.description || "",
                      });
                      
                      // Refetch vouchers and find index for navigation (async, non-blocking)
                      refetch().then(() => {
                        setTimeout(() => {
                          const updatedVouchers = vouchers;
                          const savedIndex = updatedVouchers.findIndex(
                            (v) => v.id === savedVoucher.id
                          );
                          if (savedIndex >= 0) {
                            navigate(savedIndex);
                          }
                        }, 300);
                      });
                    }
                  }}
                  disabled={
                    isReadOnly || isCreating || isUpdating
                  }
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-semibold disabled:bg-gray-400"
                >
                  {isCreating || isUpdating ? "جاري الحفظ..." : "حفظ"}
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.INTERNAL_TRANSFER,
                  Actions.UPDATE,
                )}
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
              >
                <button
                  onClick={handleDelete}
                  disabled={currentIndex < 0 || isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
                >
                  {isDeleting ? "جاري الحذف..." : "حذف"}
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.INTERNAL_TRANSFER,
                  Actions.SEARCH,
                )}
              >
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
                >
                  بحث
                </button>
              </PermissionWrapper>
              <PermissionWrapper
                requiredPermission={buildPermission(
                  Resources.INTERNAL_TRANSFER,
                  Actions.PRINT,
                )}
              >
                <button
                onClick={handleOpenPreview}
                  className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"
                >
                  <PrintIcon className="mr-2 w-5 h-5" /> معاينة وطباعة
                </button>
              </PermissionWrapper>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigateToVoucher("first")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => navigateToVoucher("prev")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === 0}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <div className="px-4 py-2 bg-yellow-100 border-2 border-amber-500 rounded-md">
                <span className="font-bold">
                  {currentIndex > -1
                    ? `${currentIndex + 1} / ${vouchers.length}`
                    : `جديد`}
                </span>
              </div>
              <button
                onClick={() => navigateToVoucher("next")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === vouchers.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => navigateToVoucher("last")}
                disabled={(Array.isArray(vouchers) ? vouchers.length === 0 : true) || currentIndex === vouchers.length - 1}
                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                الأخير
              </button>
            </div>
          </div>
        </div>
      </div>
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن سند تحويل"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "من", accessor: "fromAccount" },
          { Header: "إلى", accessor: "toAccount" },
          { Header: "المبلغ", accessor: "amount" },
        ]}
        data={vouchers.map((v) => ({
          ...v,
          fromAccount: v.fromType === "safe" 
            ? (v.fromSafe?.name || "-")
            : (v.fromBank?.name || "-"),
          toAccount: v.toType === "safe"
            ? (v.toSafe?.name || "-")
            : (v.toBank?.name || "-"),
          date: v.date
            ? new Date(v.date).toISOString().substring(0, 10)
            : "-",
        }))}
        onSelectRow={(row: { id: string }) => {
          const index = vouchers.findIndex((v) => v.id === row.id);
          if (index > -1) navigate(index);
          setIsSearchModalOpen(false);
        }}
        colorTheme="amber"
      />
      {companyInfo && previewVoucherData && (
        <InternalTransferPrintPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewVoucherData(null);
            shouldOpenPreviewRef.current = false;
            if (shouldResetOnClose) {
              handleNew();
              setShouldResetOnClose(false);
            }
          }}
          voucherData={previewVoucherData}
        />
      )}
      {companyInfo && !previewVoucherData && (
        <InternalTransferPrintPreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            shouldOpenPreviewRef.current = false;
            if (shouldResetOnClose) {
              handleNew();
              setShouldResetOnClose(false);
            }
          }}
          voucherData={{
            number: transferData.number || "",
            date: transferData.date || "",
            amount:
              typeof transferData.amount === "string"
                ? parseFloat(transferData.amount) || 0
                : transferData.amount || 0,
            fromAccount:
              transferData.fromType === "safe"
                ? safes.find((s) => s.id === transferData.fromId)?.name || "-"
                : banks.find((b) => b.id === transferData.fromId)?.name || "-",
            fromType: transferData.fromType,
            toAccount:
              transferData.toType === "safe"
                ? safes.find((s) => s.id === transferData.toId)?.name || "-"
                : banks.find((b) => b.id === transferData.toId)?.name || "-",
            toType: transferData.toType,
            description: transferData.description || "",
            userName: User?.fullName || User?.name || "غير محدد",
            branchName:
              typeof User?.branch === "string"
                ? User.branch
                : User?.branch?.name || "غير محدد",
          }}
        />
      )}
    </>
  );
};

export default InternalTransfers;

