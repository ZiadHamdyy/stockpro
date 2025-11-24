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
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetExpenseCodesQuery } from "../../../store/slices/expense/expenseApiSlice";
import { useGetExpensePaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";

interface ExpenseStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const ExpenseStatementReport: React.FC<ExpenseStatementReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  // API hooks
  const { data: apiExpenseCodes = [], isLoading: expenseCodesLoading } =
    useGetExpenseCodesQuery(undefined, { skip });
  const { data: apiPaymentVouchers = [], isLoading: vouchersLoading } =
    useGetExpensePaymentVouchersQuery(undefined, { skip });
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);

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
  const expenseCodes = useMemo(() => {
    return (apiExpenseCodes as any[]).map((code) => ({
      ...code,
      // Add any necessary transformations here
    }));
  }, [apiExpenseCodes]);

  // Transform payment vouchers from API
  const paymentVouchers = useMemo(() => {
    return (apiPaymentVouchers as any[]).map((voucher) => {
      const branchName = voucher.branch?.name || 
        branches.find((b) => b.id === voucher.branchId)?.name || 
        "غير محدد";
      
      return {
        id: voucher.id,
        code: voucher.code,
        date: normalizeDate(voucher.date),
        entity: {
          type: voucher.entityType,
          id: voucher.expenseCodeId || "",
        },
        expenseCodeId: voucher.expenseCodeId,
        amount: voucher.amount,
        description: voucher.description || "",
        branchId: voucher.branchId,
        branchName: branchName,
      };
    });
  }, [apiPaymentVouchers, branches, normalizeDate]);

  const isLoading = expenseCodesLoading || vouchersLoading || branchesLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedExpenseCodeId, setSelectedExpenseCodeId] = useState<
    string | null
  >(null);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [reportData, setReportData] = useState<any[]>([]);

  // Set initial selected expense code when data loads
  useEffect(() => {
    if (expenseCodes.length > 0 && !selectedExpenseCodeId) {
      setSelectedExpenseCodeId(expenseCodes[0].id.toString());
    }
  }, [expenseCodes, selectedExpenseCodeId]);

  const selectedExpenseCode = useMemo(
    () => expenseCodes.find((c) => c.id.toString() === selectedExpenseCodeId),
    [expenseCodes, selectedExpenseCodeId],
  );
  const selectedExpenseCodeName = selectedExpenseCode?.name || "غير محدد";

  const handleViewReport = useCallback(() => {
    if (!selectedExpenseCodeId) {
      setReportData([]);
      return;
    }
    const codeId = selectedExpenseCodeId;

    // Normalize dates for comparison
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const transactions = paymentVouchers
      .filter((v) => {
        const voucherDate = normalizeDate(v.date);
        if (!voucherDate) return false;
        
        const dateMatch = voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
        const expenseMatch = v.expenseCodeId === codeId;
        const branchMatch = selectedBranch === "all" || v.branchName === selectedBranch;
        
        return dateMatch && expenseMatch && branchMatch;
      })
      .map((v) => ({
        date: v.date,
        description: v.description || "مصروف",
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
  }, [selectedExpenseCodeId, paymentVouchers, startDate, endDate, selectedBranch, normalizeDate]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);

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
        <ReportHeader title={title} />
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-blue">بند المصروف:</span> {selectedExpenseCodeName}
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
              value={selectedExpenseCodeId || ""}
              onChange={(e) => setSelectedExpenseCodeId(e.target.value)}
            >
              <option value="">اختر بند مصروف...</option>
              {expenseCodes.map((code) => (
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
              onClick={handleViewReport}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.EXPENSE_STATEMENT_REPORT,
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
                          const url = `/financials/payment-voucher?voucherId=${encodeURIComponent(item.voucherId)}`;
                          // Use window.location to ensure URL updates
                          window.location.href = url;
                        } else {
                          console.error("Voucher ID is missing:", item);
                        }
                      }}
                      className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                      title="فتح سند الصرف"
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
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold text-white">
                <td colSpan={4} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(totalAmount)}`}>
                  {formatNumber(totalAmount)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(totalAmount)}`}>
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

export default ExpenseStatementReport;
