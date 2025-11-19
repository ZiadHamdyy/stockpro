import React, { useState, useMemo, useEffect } from "react";
import type {
  CompanyInfo,
  CurrentAccount,
  User,
  Voucher,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetCurrentAccountsQuery } from "../../../store/slices/currentAccounts/currentAccountsApi";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { getCurrentYearRange } from "../dateUtils";
import { useAuth } from "../../../hook/Auth";

interface CurrentAccountStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers?: Voucher[];
  paymentVouchers?: Voucher[];
  currentUser: User | null;
}

const CurrentAccountStatementReport: React.FC<
  CurrentAccountStatementReportProps
> = ({ title, companyInfo, receiptVouchers: propReceiptVouchers, paymentVouchers: propPaymentVouchers, currentUser }) => {
  const { isAuthed } = useAuth();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  
  // API hooks - fetch vouchers directly from API
  const { data: apiCurrentAccounts = [], isLoading: currentAccountsLoading } =
    useGetCurrentAccountsQuery(undefined);
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { 
    data: apiReceiptVouchers = [], 
    isLoading: receiptVouchersLoading,
    refetch: refetchReceiptVouchers,
  } = useGetReceiptVouchersQuery(undefined, { skip });
  const { 
    data: apiPaymentVouchers = [], 
    isLoading: paymentVouchersLoading,
    refetch: refetchPaymentVouchers,
  } = useGetPaymentVouchersQuery(undefined, { skip });
  
  // Use API vouchers if authenticated and API is being used, otherwise fall back to props
  const receiptVouchers = isAuthed ? apiReceiptVouchers : (propReceiptVouchers || []);
  const paymentVouchers = isAuthed ? apiPaymentVouchers : (propPaymentVouchers || []);
  
  // Refetch function
  const handleRefetch = () => {
    refetchReceiptVouchers();
    refetchPaymentVouchers();
  };

  // Transform branches
  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
    }));
  }, [apiBranches]);

  // Helper function to normalize date to YYYY-MM-DD format
  const normalizeDate = useMemo(() => {
    return (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // If it's an ISO string, extract the date part
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // Try to parse as Date if it's a string that looks like a date
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return "";
    };
  }, []);

  // Transform API data to match expected format
  const currentAccounts = useMemo(() => {
    return (apiCurrentAccounts as any[]).map((account) => ({
      ...account,
      // Add any necessary transformations here
    }));
  }, [apiCurrentAccounts]);

  // Transform vouchers to include branch information and normalize entity structure
  const transformedReceiptVouchers = useMemo(() => {
    return receiptVouchers.map((voucher: any) => {
      const branchName = voucher.branchName || 
        (voucher.branch?.name) ||
        branches.find((b) => b.id === voucher.branchId)?.name || 
        "غير محدد";
      
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName,
      };
      
      return {
        id: voucher.id,
        code: voucher.code,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
        branchId: voucher.branchId,
        branchName: branchName,
      };
    });
  }, [receiptVouchers, branches, normalizeDate]);

  const transformedPaymentVouchers = useMemo(() => {
    return paymentVouchers.map((voucher: any) => {
      const branchName = voucher.branchName || 
        (voucher.branch?.name) ||
        branches.find((b) => b.id === voucher.branchId)?.name || 
        "غير محدد";
      
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName,
      };
      
      return {
        id: voucher.id,
        code: voucher.code,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
        branchId: voucher.branchId,
        branchName: branchName,
      };
    });
  }, [paymentVouchers, branches, normalizeDate]);

  const isLoading = currentAccountsLoading || branchesLoading || receiptVouchersLoading || paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Set initial selected account when data loads
  useEffect(() => {
    if (currentAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(currentAccounts[0].id.toString());
    }
  }, [currentAccounts, selectedAccountId]);

  const selectedAccount = useMemo(
    () => currentAccounts.find((c) => c.id.toString() === selectedAccountId),
    [currentAccounts, selectedAccountId],
  );
  const selectedAccountName = selectedAccount?.name || "غير محدد";

  const openingBalance = useMemo(() => {
    if (!selectedAccount) return 0;
    const accountId = selectedAccount.id.toString(); // Keep as string for comparison
    const normalizedStartDate = normalizeDate(startDate);
    
    const receiptsBefore = transformedReceiptVouchers
      .filter(
        (v) => {
          const voucherDate = normalizeDate(v.date);
          const voucherEntityId = v.entity?.id ? String(v.entity.id) : null;
          return (
            v.entity?.type === "current_account" &&
            voucherEntityId === accountId &&
            voucherDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    const paymentsBefore = transformedPaymentVouchers
      .filter(
        (v) => {
          const voucherDate = normalizeDate(v.date);
          const voucherEntityId = v.entity?.id ? String(v.entity.id) : null;
          return (
            v.entity?.type === "current_account" &&
            voucherEntityId === accountId &&
            voucherDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    // Assuming debit (payment) increases balance for liability accounts (partners) and credit (receipt) decreases it.
    // Let's stick to Debit increases, Credit decreases for simplicity.
    return selectedAccount.openingBalance + paymentsBefore - receiptsBefore;
  }, [selectedAccount, transformedReceiptVouchers, transformedPaymentVouchers, startDate, normalizeDate]);

  const reportData = useMemo(() => {
    if (!selectedAccountId) return [];
    const accountId = selectedAccountId.toString(); // Keep as string for comparison
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const transactions: {
      date: string;
      description: string;
      ref: string;
      voucherId: string;
      voucherType: "receipt" | "payment";
      branchName: string;
      debit: number;
      credit: number;
    }[] = [];

    transformedPaymentVouchers.forEach((v) => {
      const voucherDate = normalizeDate(v.date);
      // Convert entity.id to string for comparison
      const voucherEntityId = v.entity?.id ? String(v.entity.id) : null;
      
      if (
        v.entity?.type === "current_account" &&
        voucherEntityId === accountId &&
        voucherDate >= normalizedStartDate &&
        voucherDate <= normalizedEndDate
      ) {
        const branchMatch = selectedBranch === "all" || v.branchName === selectedBranch;
        if (branchMatch) {
          transactions.push({
            date: v.date,
            description: "سند صرف",
            ref: v.code || v.id,
            voucherId: v.id,
            voucherType: "payment",
            branchName: v.branchName,
            debit: v.amount,
            credit: 0,
          });
        }
      }
    });
    transformedReceiptVouchers.forEach((v) => {
      const voucherDate = normalizeDate(v.date);
      // Convert entity.id to string for comparison
      const voucherEntityId = v.entity?.id ? String(v.entity.id) : null;
      
      if (
        v.entity?.type === "current_account" &&
        voucherEntityId === accountId &&
        voucherDate >= normalizedStartDate &&
        voucherDate <= normalizedEndDate
      ) {
        const branchMatch = selectedBranch === "all" || v.branchName === selectedBranch;
        if (branchMatch) {
          transactions.push({
            date: v.date,
            description: "سند قبض",
            ref: v.code || v.id,
            voucherId: v.id,
            voucherType: "receipt",
            branchName: v.branchName,
            debit: 0,
            credit: v.amount,
          });
        }
      }
    });

    transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let balance = openingBalance;
    return transactions.map((t) => {
      balance = balance + t.debit - t.credit;
      return { ...t, balance };
    });
  }, [
    selectedAccountId,
    transformedReceiptVouchers,
    transformedPaymentVouchers,
    startDate,
    endDate,
    openingBalance,
    selectedBranch,
    normalizeDate,
  ]);

  const totalDebit = reportData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = reportData.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance = openingBalance + totalDebit - totalCredit;

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

  const handlePrint = () => {
    const reportContent = document.getElementById("printable-area");
    if (!reportContent) return;

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow?.document.write("<html><head><title>طباعة التقرير</title>");
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; font-size: 14px; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                table { font-size: 13px; }
                th { font-size: 13px; font-weight: bold; }
                td { font-size: 13px; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
                    th { font-size: 13px !important; font-weight: bold !important; }
                    td { font-size: 13px !important; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-red-600 { color: #DC2626 !important; }
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
                    .justify-end { justify-content: flex-end !important; }
                }
            </style>
        `);
    printWindow?.document.write("</head><body>");
    printWindow?.document.write(reportContent.innerHTML);
    printWindow?.document.write("</body></html>");
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => {
      printWindow?.print();
      printWindow?.close();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <div className="border-2 border-brand-blue rounded-lg mb-4">
          <InvoiceHeader
            branchName={typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
            userName={currentUser?.fullName || currentUser?.name}
          />
        </div>
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-blue">الحساب:</span> {selectedAccountName}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranch === "all" ? "جميع الفروع" : selectedBranch}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <select
              className={inputStyle}
              value={selectedAccountId || ""}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">اختر الحساب...</option>
              {currentAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">الفرع:</label>
            <select
              className={inputStyle}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">جميع الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className={inputStyle}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
            <input
              type="date"
              className={inputStyle}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button 
              onClick={handleRefetch}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              title="تصدير Excel"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
            <button
              title="تصدير PDF"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handlePrint}
              title="طباعة"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-green-200 uppercase">
                  مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-36">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4">{item.branchName}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.voucherId) {
                          const url = item.voucherType === "receipt"
                            ? `/financials/receipt-voucher?voucherId=${encodeURIComponent(item.voucherId)}`
                            : `/financials/payment-voucher?voucherId=${encodeURIComponent(item.voucherId)}`;
                          // Use window.location to ensure URL updates
                          window.location.href = url;
                        } else {
                          console.error("Voucher ID is missing:", item);
                        }
                      }}
                      className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                      title={item.voucherType === "receipt" ? "فتح سند القبض" : "فتح سند الصرف"}
                    >
                      {item.ref}
                    </button>
                    <span className="print:inline hidden">{item.ref}</span>
                  </td>
                  <td className={`px-6 py-4 text-green-600 ${getNegativeNumberClass(item.debit)}`}>
                    {formatNumber(item.debit)}
                  </td>
                  <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(item.credit)}`}>
                    {formatNumber(item.credit)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold text-white">
                <td colSpan={4} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalDebit) || "text-green-200"}`}>
                  {formatNumber(totalDebit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalCredit) || "text-red-200"}`}>
                  {formatNumber(totalCredit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(finalBalance)}`}>
                  {formatNumber(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurrentAccountStatementReport;
