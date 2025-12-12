import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PrintIcon } from "../../icons";
import { tafqeet } from "../../../utils/tafqeet";
import DocumentHeader from "../../common/DocumentHeader";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useReceiptVouchers } from "../../hook/useReceiptVouchers";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useToast } from "../../common/ToastProvider";
import {
  buildPermission,
  Resources,
  Actions,
} from "../../../enums/permissions.enum";
import ReceiptVoucherPrintPreview from "./ReceiptVoucherPrintPreview";
import { useAuth } from "../../hook/Auth";
import { useGetReceivableAccountsQuery } from "../../store/slices/receivableAccounts/receivableAccountsApi";
import { useGetPayableAccountsQuery } from "../../store/slices/payableAccounts/payableAccountsApi";
import { useUserPermissions } from "../../hook/usePermissions";
import EntityBottomBar from "../../common/EntityBottomBar";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPaymentVouchersQuery } from "../../store/slices/paymentVoucherApiSlice";

type AllEntityType =
  | "customer"
  | "supplier"
  | "current_account"
  | "receivable_account"
  | "payable_account"
  | "expense"
  | "expense-Type"
  | "revenue"
  | "vat"
  | "profit_and_loss";
import DataTableModal from "../../common/DataTableModal";
import { formatNumber } from "../../../utils/formatting";

interface ReceiptVoucherProps {
  title: string;
}

const ReceiptVoucher: React.FC<ReceiptVoucherProps> = ({ title }) => {
  const { data: companyInfo } = useGetCompanyQuery();
  const { User } = useAuth();
  const { showToast } = useToast();
  const { data: receivableAccounts = [] } = useGetReceivableAccountsQuery();
  const { data: payableAccounts = [] } = useGetPayableAccountsQuery();
  const { hasPermission } = useUserPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    vouchers: allVouchers,
    customers,
    suppliers,
    currentAccounts,
    revenueCodes,
    safes,
    branchSafes,
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
    setCurrentIndex,
  } = useReceiptVouchers();
  
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
        buildPermission(Resources.RECEIPT_VOUCHER, Actions.SEARCH),
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
  const [showInfoBar, setShowInfoBar] = useState(false);
  const [previewVoucherData, setPreviewVoucherData] = useState<{
    number: string;
    date: string;
    amount: number | string;
    receivedFrom: string;
    description: string;
    paymentMethod: "safe" | "bank";
    userName: string;
    branchName: string;
  } | null>(null);
  const shouldOpenPreviewRef = useRef(false);

  // Fetch data for entity stats calculation
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery();
  const { data: salesReturns = [] } = useGetSalesReturnsQuery();
  const { data: paymentVouchers = [] } = useGetPaymentVouchersQuery();

  // Open preview when previewVoucherData is set and we have a flag to open it
  useEffect(() => {
    if (shouldOpenPreviewRef.current && previewVoucherData) {
      setIsPreviewOpen(true);
      shouldOpenPreviewRef.current = false; // Reset flag
    }
  }, [previewVoucherData]);

  // Handle voucherId from URL query params
  useEffect(() => {
    const voucherId = searchParams.get("voucherId");
    if (voucherId) {
      // Wait for vouchers to load before processing
      if (vouchers.length > 0 && !isLoading) {
        // Use flexible comparison to handle both string and number IDs
        const index = vouchers.findIndex(
          (v) => 
            String(v.id) === String(voucherId) || 
            v.id === voucherId ||
            String(v.code) === String(voucherId) || 
            v.code === voucherId
        );
        if (index !== -1) {
          if (index !== currentIndex) {
            setCurrentIndex(index);
            setHasInitialized(true);
          }
          // Remove the query param after setting the index
          searchParams.delete("voucherId");
          setSearchParams(searchParams, { replace: true });
        } else {
          // Voucher not found, but vouchers are loaded - might be invalid ID
          console.warn(`Voucher with ID/code "${voucherId}" not found. Available vouchers:`, vouchers.map(v => ({ id: v.id, code: v.code })));
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
    
    // Only initialize with new voucher if no voucherId in URL and not already initialized
    if (!hasInitialized && !isLoading && vouchers.length >= 0 && currentIndex === -1) {
      handleNew();
      setHasInitialized(true);
    }
  }, [vouchers, isLoading, searchParams, setSearchParams, currentIndex, setCurrentIndex, hasInitialized, handleNew]);

  const handleEntityChange = (field: "type" | "id", value: any) => {
    setVoucherData((prev) => {
      const newEntity = { ...prev.entity, [field]: value };
      if (field === "type") {
        newEntity.id = null;
        if (value === "vat") {
          newEntity.name = "ضريبة القيمة المضافة";
        } else if (value === "profit_and_loss") {
          newEntity.name = "الارباح والخسائر المبقاه";
        } else {
          newEntity.name = "";
        }
      }
      if (field === "id") {
        let foundName = "";
        const t = newEntity.type as AllEntityType;
        if (t === "customer")
          foundName = customers.find((c) => c.id === value)?.name || "";
        if (t === "supplier")
          foundName = suppliers.find((s) => s.id === value)?.name || "";
        if (t === "current_account")
          foundName = currentAccounts.find((a) => a.id === value)?.name || "";
        if (t === "receivable_account")
          foundName = (receivableAccounts as any[]).find((a) => a.id === value)?.name || "";
        if (t === "payable_account")
          foundName = (payableAccounts as any[]).find((a) => a.id === value)?.name || "";
        if (t === "revenue")
          foundName = revenueCodes.find((c) => c.id === value)?.name || "";
        newEntity.name = foundName;
      }
      return { ...prev, entity: newEntity };
    });
  };

  const renderEntitySelector = () => {
    const entityType = voucherData.entity.type as AllEntityType;
    const entityId = voucherData.entity.id ? String(voucherData.entity.id) : "";
    
    if (entityType === "vat" || entityType === "profit_and_loss") {
      return null;
    }
    
    if (entityType === "customer") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر عميل...</option>
          {customers.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "supplier") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر مورد...</option>
          {suppliers.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "current_account") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر حساب...</option>
          {currentAccounts.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "receivable_account") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر حساب مدين...</option>
          {(receivableAccounts as any[]).map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "payable_account") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر حساب دائن...</option>
          {(payableAccounts as any[]).map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      );
    }
    if (entityType === "revenue") {
      return (
        <select
          value={entityId}
          onChange={(e) => handleEntityChange("id", e.target.value)}
          className={inputStyle}
          disabled={isReadOnly}
        >
          <option value="">اختر بند إيراد...</option>
          {revenueCodes.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      );
    }
    return null;
  };

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";

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
  const isExistingVoucher = currentIndex > -1;
  const canPrintExistingVoucher = isExistingVoucher && isReadOnly;

  const handleOpenPreview = () => {
    if (!canPrintExistingVoucher) {
      showToast("لا يمكن الطباعة إلا بعد حفظ السند.", "error");
      return;
    }
    setShouldResetOnClose(false);
    setIsPreviewOpen(true);
  };

  // Calculate entity stats for bottom bar
  const entityStats = useMemo(() => {
    const { type, id } = voucherData.entity;
    if (!id) return null;
    const idStr = String(id);
    const currentVoucherId = voucherData.number;

    let balance = 0;
    let lastInvoice = undefined;
    let lastReceipt = undefined;

    // Logic for Customers
    if (type === 'customer') {
      const customer = customers.find(c => String(c.id) === idStr);
      if (customer) {
        // Calculate balance: openingBalance + creditSales - creditReturns - receipts + payments
        const creditSales = salesInvoices
          .filter(i => {
            const invCustomerId = i.customerId || i.customer?.id;
            return invCustomerId && String(invCustomerId) === idStr && i.paymentMethod === 'credit';
          })
          .reduce((sum, i) => sum + (i.net || 0), 0);
        
        const creditReturns = salesReturns
          .filter(i => {
            const retCustomerId = i.customerId || i.customer?.id;
            return retCustomerId && String(retCustomerId) === idStr && i.paymentMethod === 'credit';
          })
          .reduce((sum, i) => sum + (i.net || 0), 0);
        
        const totalReceipts = vouchers
          .filter(v => v.entityType === 'customer' && String(v.customerId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .reduce((sum, v) => sum + (v.amount || 0), 0);
        
        const totalPayments = paymentVouchers
          .filter(v => v.entityType === 'customer' && String(v.customerId || '') === idStr)
          .reduce((sum, v) => sum + (v.amount || 0), 0);
        
        balance = (customer.openingBalance || 0) + creditSales - creditReturns - totalReceipts + totalPayments;
        
        // Get Last Invoice
        const sortedInvoices = salesInvoices
          .filter(i => {
            const invCustomerId = i.customerId || i.customer?.id;
            return invCustomerId && String(invCustomerId) === idStr;
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedInvoices.length > 0) {
          lastInvoice = { 
            amount: sortedInvoices[0].net || 0, 
            date: new Date(sortedInvoices[0].date).toLocaleDateString("ar-EG") 
          };
        }

        // Get Last Receipt (excluding current if editing)
        const sortedReceipts = vouchers
          .filter(v => v.entityType === 'customer' && String(v.customerId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (sortedReceipts.length > 0) {
          lastReceipt = { 
            amount: sortedReceipts[0].amount || 0, 
            date: new Date(sortedReceipts[0].date).toLocaleDateString("ar-EG") 
          };
        }
      }
    } 
    // Logic for Suppliers
    else if (type === 'supplier') {
      const supplier = suppliers.find(s => String(s.id) === idStr);
      if (supplier) {
        balance = supplier.openingBalance || 0;
        
        const lastTx = vouchers
          .filter(v => v.entityType === 'supplier' && String(v.supplierId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastTx) { 
          lastReceipt = { 
            amount: lastTx.amount || 0, 
            date: new Date(lastTx.date).toLocaleDateString("ar-EG") 
          };
        }
      }
    }
    // Logic for Current Accounts
    else if (type === 'current_account') {
      const account = currentAccounts.find(a => String(a.id) === idStr);
      if (account) {
        const totalRec = vouchers
          .filter(v => v.entityType === 'current_account' && String(v.currentAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .reduce((sum, v) => sum + (v.amount || 0), 0);
        balance = (account.openingBalance || 0) - totalRec; 
        
        const lastTx = vouchers
          .filter(v => v.entityType === 'current_account' && String(v.currentAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastTx) { 
          lastReceipt = { 
            amount: lastTx.amount || 0, 
            date: new Date(lastTx.date).toLocaleDateString("ar-EG") 
          };
        }
      }
    }
    // Logic for Revenue Codes
    else if (type === 'revenue' as AllEntityType) {
      const totalCollected = vouchers
        .filter(v => v.entityType === 'revenue' && String(v.revenueCodeId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
        .reduce((sum, v) => sum + (v.amount || 0), 0);
      balance = totalCollected;
      
      const lastTx = vouchers
        .filter(v => v.entityType === 'revenue' && String(v.revenueCodeId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (lastTx) { 
        lastReceipt = { 
          amount: lastTx.amount || 0, 
          date: new Date(lastTx.date).toLocaleDateString("ar-EG") 
        };
      }
    }
    // Logic for Receivable Accounts
    else if (type === 'receivable_account') {
      const account = receivableAccounts.find((a: any) => String(a.id) === idStr);
      if (account) {
        const totalRec = vouchers
          .filter(v => v.entityType === 'receivable_account' && String(v.receivableAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .reduce((sum, v) => sum + (v.amount || 0), 0);
        balance = (account.openingBalance || 0) - totalRec;
        
        const lastTx = vouchers
          .filter(v => v.entityType === 'receivable_account' && String(v.receivableAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastTx) { 
          lastReceipt = { 
            amount: lastTx.amount || 0, 
            date: new Date(lastTx.date).toLocaleDateString("ar-EG") 
          };
        }
      }
    }
    // Logic for Payable Accounts
    else if (type === 'payable_account') {
      const account = payableAccounts.find((a: any) => String(a.id) === idStr);
      if (account) {
        const totalRec = vouchers
          .filter(v => v.entityType === 'payable_account' && String(v.payableAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .reduce((sum, v) => sum + (v.amount || 0), 0);
        balance = (account.openingBalance || 0) - totalRec;
        
        const lastTx = vouchers
          .filter(v => v.entityType === 'payable_account' && String(v.payableAccountId || '') === idStr && String(v.id || '') !== String(currentVoucherId || ''))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastTx) { 
          lastReceipt = { 
            amount: lastTx.amount || 0, 
            date: new Date(lastTx.date).toLocaleDateString("ar-EG") 
          };
        }
      }
    }

    return { balance, lastInvoice, lastReceipt };
  }, [
    voucherData.entity.id, 
    voucherData.entity.type, 
    voucherData.number,
    customers, 
    suppliers, 
    currentAccounts, 
    revenueCodes, 
    receivableAccounts,
    payableAccounts,
    salesInvoices, 
    salesReturns, 
    vouchers,
    paymentVouchers
  ]);

  // Show/Hide Bar logic
  useEffect(() => {
    if (voucherData.entity.id && entityStats && !isReadOnly) {
      setShowInfoBar(true);
    } else {
      setShowInfoBar(false);
    }
  }, [voucherData.entity.id, entityStats, isReadOnly]);

  if (isLoading) {
    return <div className="text-center p-6">جاري التحميل...</div>;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow pb-20">
        <div className="border-2 border-brand-blue rounded-lg mb-4">
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
              value={voucherData.number}
              className={inputStyle + " bg-gray-200"}
              readOnly
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
              type="text"
              value={
                typeof voucherData.amount === "string"
                  ? voucherData.amount
                  : voucherData.amount === 0 || voucherData.amount === null
                  ? ""
                  : voucherData.amount
              }
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty string, negative sign, and valid numbers (including decimals and negatives)
                if (value === "" || value === "-" || /^-?\d*\.?\d*$/.test(value)) {
                  setVoucherData((prev) => ({
                    ...prev,
                    amount: value === "" || value === "-" ? (value as any) : parseFloat(value) || 0,
                  }));
                }
              }}
              className={inputStyle}
              placeholder="0.00"
              disabled={isReadOnly}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                استلمنا من
              </label>
              <select
                value={voucherData.entity.type}
                onChange={(e) => handleEntityChange("type", e.target.value)}
                className={inputStyle}
                disabled={isReadOnly}
              >
                <option value="customer">عميل</option>
                <option value="supplier">مورد</option>
                <option value="receivable_account">أرصدة مدينة اخري</option>
                <option value="payable_account">أرصدة دائنة اخري</option>
                <option value="current_account">حساب جاري</option>
                <option value="revenue">إيراد</option>
                <option value="vat">ضريبة القيمة المضافة</option>
                <option value="profit_and_loss">الارباح والخسائر المبقاه</option>
              </select>
            </div>
            {(voucherData.entity.type as AllEntityType) !== "vat" &&
              (voucherData.entity.type as AllEntityType) !== "profit_and_loss" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  الاسم
                </label>
                {renderEntitySelector()}
              </div>
            )}
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
              placeholder="تفاصيل القبض"
              disabled={isReadOnly}
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                طريقة الدفع
              </label>
              <div className="relative mt-1 bg-brand-blue-bg border-2 border-brand-blue rounded-md p-1 flex items-center">
                <button
                  onClick={() =>
                    setVoucherData((prev) => ({
                      ...prev,
                      paymentMethod: "safe",
                      safeOrBankId:
                        visibleBranchSafes.length > 0 ? visibleBranchSafes[0].id : null,
                    }))
                  }
                  className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === "safe" ? "bg-brand-blue text-white shadow" : "text-gray-600"} transition-all duration-200`}
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
                  className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === "bank" ? "bg-brand-blue text-white shadow" : "text-gray-600"} transition-all duration-200`}
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
                disabled={isReadOnly || voucherData.paymentMethod === "safe"}
              >
                <option value="">
                  {voucherData.paymentMethod === "safe"
                    ? "اختر خزينة..."
                    : "اختر بنك..."}
                </option>
                {voucherData.paymentMethod === "safe"
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

        <div className="mt-6">
          <div className="bg-brand-blue-bg p-3 rounded-md text-center text-brand-dark font-semibold">
            {companyInfo
              ? tafqeet(
                  typeof voucherData.amount === "string"
                    ? parseFloat(voucherData.amount) || 0
                    : voucherData.amount || 0,
                  companyInfo.currency
                )
              : "جاري التحميل..."}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
          <div className="flex justify-center gap-2 flex-wrap">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.RECEIPT_VOUCHER,
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
                Resources.RECEIPT_VOUCHER,
                isExistingVoucher ? Actions.UPDATE : Actions.CREATE,
              )}
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
                        id: savedVoucher.customerId || savedVoucher.supplierId || savedVoucher.currentAccountId || savedVoucher.revenueCodeId || savedVoucher.receivableAccountId || savedVoucher.payableAccountId || null,
                        name: savedVoucher.entityName,
                      },
                      amount: savedVoucher.amount === 0 || savedVoucher.amount === null ? ("" as any) : savedVoucher.amount,
                      paymentMethod: savedVoucher.paymentMethod as "safe" | "bank",
                      safeOrBankId: savedVoucher.paymentMethod === "safe" ? savedVoucher.safeId || null : savedVoucher.bankId || null,
                      description: savedVoucher.description || "",
                    });
                    // Prepare preview data
                    const previewData = {
                      number: savedVoucher.code,
                      date: savedVoucher.date ? new Date(savedVoucher.date).toISOString().substring(0, 10) : voucherData.date,
                      amount: savedVoucher.amount === 0 || savedVoucher.amount === null ? ("" as any) : savedVoucher.amount,
                      receivedFrom: savedVoucher.entityName,
                      description: savedVoucher.description || "",
                      paymentMethod: savedVoucher.paymentMethod as "safe" | "bank",
                      userName: User?.fullName || User?.name || "غير محدد",
                      branchName: typeof User?.branch === 'string' ? User.branch : User?.branch?.name || "غير محدد",
                    };
                    
                    // Set preview data and flag to open preview
                    setPreviewVoucherData(previewData);
                    setShouldResetOnClose(true);
                    shouldOpenPreviewRef.current = true;
                    
                    // Find and set current index for navigation
                    setTimeout(() => {
                      const savedIndex = vouchers.findIndex((v) => v.id === savedVoucher.id);
                      if (savedIndex >= 0) {
                        navigate(savedIndex);
                      }
                    }, 300);
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
                Resources.RECEIPT_VOUCHER,
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
                Resources.RECEIPT_VOUCHER,
                Actions.DELETE,
              )}
            >
              <button
                onClick={handleDelete}
                disabled={currentIndex < 0}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400"
              >
                حذف
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.RECEIPT_VOUCHER,
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
                Resources.RECEIPT_VOUCHER,
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
            <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
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
        <ReceiptVoucherPrintPreview
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
          voucherData={previewVoucherData || {
            number: voucherData.number,
            date: voucherData.date,
            amount: voucherData.amount,
            receivedFrom: voucherData.entity.name,
            description: voucherData.description,
            paymentMethod: voucherData.paymentMethod,
            userName: User?.fullName || User?.name || "غير محدد",
            branchName: typeof User?.branch === 'string' ? User.branch : User?.branch?.name || "غير محدد",
          }}
        />
      )}
      <DataTableModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="بحث عن سند قبض"
        columns={[
          { Header: "الرقم", accessor: "code" },
          { Header: "التاريخ", accessor: "date" },
          { Header: "الاسم", accessor: "entityName" },
          { Header: "المبلغ", accessor: "amount" },
        ]}
        data={vouchers.map((v) => ({
          ...v,
          date: v.date ? new Date(v.date).toLocaleDateString("ar-EG") : "-",
          amount: formatNumber(v.amount || 0),
        }))}
        onSelectRow={(row) => {
          const index = vouchers.findIndex((v) => v.id === row.id);
          if (index >= 0) {
            navigate(index);
            setIsSearchModalOpen(false);
          }
        }}
        companyInfo={companyInfo}
        colorTheme="green"
      />
      {/* Entity Bottom Bar */}
      {showInfoBar && entityStats && (
        <EntityBottomBar 
          type={voucherData.entity.type as any}
          entityName={voucherData.entity.name}
          balance={entityStats.balance}
          lastInvoice={entityStats.lastInvoice}
          lastReceipt={entityStats.lastReceipt}
          onClose={() => setShowInfoBar(false)}
        />
      )}
    </>
  );
};

export default ReceiptVoucher;
