import React, { useState, useMemo, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal } from "../../../../utils/formatting";
import { useGetRevenueCodesQuery } from "../../../store/slices/revenueCode/revenueCodeApiSlice";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";
import { useUserPermissions } from "../../../hook/usePermissions";

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

interface RevenueStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const RevenueStatementReport: React.FC<RevenueStatementReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  const { hasPermission } = useUserPermissions();
  
  // Check if user has SEARCH permission to view all branches
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.REVENUE_STATEMENT_REPORT, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  // API hooks
  const { data: apiRevenueCodes = [], isLoading: revenueCodesLoading } =
    useGetRevenueCodesQuery(undefined, { skip });
  const { data: apiReceiptVouchers = [], isLoading: vouchersLoading } =
    useGetReceiptVouchersQuery(undefined, { skip });
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);

  // Transform branches
  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
    }));
  }, [apiBranches]);
  
  // Get current user's branch ID
  const userBranchId = useMemo(() => getUserBranchId(currentUser), [currentUser]);
  
  // Get user's branch name
  const userBranchName = useMemo(() => {
    if (!userBranchId) return "";
    return branches.find(b => b.id === userBranchId)?.name || "";
  }, [userBranchId, branches]);

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
  const revenueCodes = useMemo(() => {
    return (apiRevenueCodes as any[]).map((code) => ({
      ...code,
      // Add any necessary transformations here
    }));
  }, [apiRevenueCodes]);

  // Transform receipt vouchers from API - filter by revenue entity type
  const receiptVouchers = useMemo(() => {
    return (apiReceiptVouchers as any[])
      .filter((voucher) => voucher.entityType === 'revenue')
      .map((voucher) => {
        const branchName = voucher.branch?.name || 
          branches.find((b) => b.id === voucher.branchId)?.name || 
          "غير محدد";
        
        return {
          id: voucher.id,
          code: voucher.code,
          date: normalizeDate(voucher.date),
          entity: {
            type: voucher.entityType,
            id: voucher.revenueCodeId || "",
          },
          revenueCodeId: voucher.revenueCodeId,
          amount: voucher.amount,
          description: voucher.description || "",
          branchId: voucher.branchId,
          branchName: branchName,
        };
      });
  }, [apiReceiptVouchers, branches, normalizeDate]);

  const isLoading = revenueCodesLoading || vouchersLoading || branchesLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedRevenueCodeId, setSelectedRevenueCodeId] = useState<
    string | null
  >(null);
  
  // Branch filter state - default based on permission
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    // Compute initial value based on permission check
    const hasSearchPermission = hasPermission(
      buildPermission(Resources.REVENUE_STATEMENT_REPORT, Actions.SEARCH),
    );
    return hasSearchPermission ? "all" : "";
  });
  
  // Sync selectedBranch when permission changes or branches load
  useEffect(() => {
    if (!canSearchAllBranches && branches.length > 0 && userBranchName) {
      // If user doesn't have permission, always set to current branch name
      if (selectedBranch !== userBranchName) {
        setSelectedBranch(userBranchName);
      }
    } else if (!canSearchAllBranches && !userBranchName && selectedBranch !== "") {
      setSelectedBranch("");
    }
  }, [canSearchAllBranches, userBranchName, selectedBranch, branches]);
  
  const [reportData, setReportData] = useState<any[]>([]);

  // Set initial selected revenue code when data loads
  useEffect(() => {
    if (revenueCodes.length > 0 && !selectedRevenueCodeId) {
      setSelectedRevenueCodeId(revenueCodes[0].id.toString());
    }
  }, [revenueCodes, selectedRevenueCodeId]);

  const selectedRevenueCode = useMemo(
    () => revenueCodes.find((c) => c.id.toString() === selectedRevenueCodeId),
    [revenueCodes, selectedRevenueCodeId],
  );
  const selectedRevenueCodeName = selectedRevenueCode?.name || "غير محدد";

  const handleViewReport = useCallback(() => {
    if (!selectedRevenueCodeId) {
      setReportData([]);
      return;
    }
    const codeId = selectedRevenueCodeId;

    // Normalize dates for comparison
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const transactions = receiptVouchers
      .filter((v) => {
        const voucherDate = normalizeDate(v.date);
        if (!voucherDate) return false;
        
        const dateMatch = voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
        const revenueMatch = v.revenueCodeId === codeId;
        const branchMatch = selectedBranch === "all" || v.branchName === selectedBranch;
        
        return dateMatch && revenueMatch && branchMatch;
      })
      .map((v) => ({
        date: v.date,
        description: v.description || "إيراد",
        ref: v.code,
        voucherId: v.id,
        amount: v.amount,
        branchName: v.branchName,
      }));

    // Sort all transactions by date field from oldest to newest (ascending order)
    transactions.sort((a, b) => {
      // Sort by date field (transaction date)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // If dates are equal, use voucherId as secondary sort to maintain consistent order
      if (dateA === dateB) {
        return String(a.voucherId).localeCompare(String(b.voucherId));
      }
      
      // Sort ascending: older dates first (oldest to newest)
      return dateA - dateB;
    });

    let balance = 0;
    const finalData = transactions.map((t) => {
      balance += t.amount;
      return { ...t, balance };
    });
    setReportData(finalData);
  }, [selectedRevenueCodeId, receiptVouchers, startDate, endDate, selectedBranch, normalizeDate]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);

  const inputStyle =
    "p-2 border-2 border-brand-green rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green bg-brand-green-bg";

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
                    .bg-brand-green { background-color: #059669 !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-green { color: #059669 !important; }
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} />
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-green">بند الإيراد:</span> {selectedRevenueCodeName}
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
              value={selectedRevenueCodeId || ""}
              onChange={(e) => setSelectedRevenueCodeId(e.target.value)}
            >
              <option value="">اختر بند إيراد...</option>
              {revenueCodes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">الفرع:</label>
            <select
              className={inputStyle}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!canSearchAllBranches}
            >
              {canSearchAllBranches && <option value="all">جميع الفروع</option>}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
              {!canSearchAllBranches && !branches.find(b => b.name === selectedBranch) && userBranchName && (
                <option value={userBranchName}>
                  {userBranchName}
                </option>
              )}
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
              onClick={handleViewReport}
              className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.REVENUE_STATEMENT_REPORT,
              Actions.PRINT,
            )}
            fallback={
              <div className="no-print flex items-center gap-2">
                <button
                  disabled
                  title="تصدير Excel"
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <ExcelIcon className="w-6 h-6" />
                </button>
                <button
                  disabled
                  title="تصدير PDF"
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PdfIcon className="w-6 h-6" />
                </button>
                <button
                  disabled
                  title="طباعة"
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PrintIcon className="w-6 h-6" />
                </button>
              </div>
            }
          >
            <div className="no-print flex items-center gap-2">
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
          </PermissionWrapper>
        </div>

        <div className="overflow-x-auto border-2 border-brand-green rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-green">
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد التراكمي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className="px-6 py-3">{formatNumber(0)}</td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-green-bg">
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
                          const url = `/financials/receipt-voucher?voucherId=${encodeURIComponent(item.voucherId)}`;
                          // Use window.location to ensure URL updates
                          window.location.href = url;
                        } else {
                          console.error("Voucher ID is missing:", item);
                        }
                      }}
                      className="text-brand-green hover:underline font-semibold no-print cursor-pointer"
                      title="فتح سند القبض"
                    >
                      {item.ref}
                    </button>
                    <span className="print:inline hidden">{item.ref}</span>
                  </td>
                  <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(item.amount)}`}>
                    {formatNumber(item.amount)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-green text-white">
              <tr className="font-bold text-white">
                <td colSpan={4} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totalAmount)}`}>
                  {formatNumber(totalAmount)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totalAmount)}`}>
                  {formatNumber(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueStatementReport;
