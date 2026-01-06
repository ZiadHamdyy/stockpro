import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, XIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal, exportToExcel } from "../../../../utils/formatting";
import { useGetExpensePaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useAuth } from "../../../hook/Auth";
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

interface TotalExpensesReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const months = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const TotalExpensesReport: React.FC<TotalExpensesReportProps> = ({
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
        buildPermission(Resources.TOTAL_EXPENSES_REPORT, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  const { data: apiExpenseVouchers = [], isLoading: vouchersLoading } =
    useGetExpensePaymentVouchersQuery(undefined, { skip });
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
  const expenseVouchers = useMemo(() => {
    return (apiExpenseVouchers as any[]).map((voucher) => {
      const branchName = voucher.branch?.name || 
        branches.find((b) => b.id === voucher.branchId)?.name || 
        "غير محدد";
      
      // Use priceBeforeTax if available (expense before tax), otherwise use amount
      const expenseAmount = voucher.priceBeforeTax ?? voucher.amount;
      
      return {
        id: voucher.id,
        code: voucher.code,
        date: normalizeDate(voucher.date),
        entity: {
          type: voucher.entityType,
          name: voucher.entityName,
        },
        expenseCode: voucher.expenseCode?.name || voucher.entityName,
        amount: expenseAmount,
        branchId: voucher.branchId,
        branchName: branchName,
      };
    });
  }, [apiExpenseVouchers, branches, normalizeDate]);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [yearQuery, setYearQuery] = useState<string | null>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  
  // Branch filter state - default based on permission
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    // Compute initial value based on permission check
    const hasSearchPermission = hasPermission(
      buildPermission(Resources.TOTAL_EXPENSES_REPORT, Actions.SEARCH),
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
  
  const yearRef = useRef<HTMLDivElement>(null);
  const isLoading = vouchersLoading || branchesLoading;

  // Generate years list (from current year going backwards to 2000)
  const years = useMemo(() => {
    const yearsList = [];
    for (let y = currentYear; y >= 2000; y--) {
      yearsList.push(y);
    }
    return yearsList; // Current year first, then descending
  }, [currentYear]);

  // Filter years based on search query
  const filteredYears = useMemo(() => {
    if (!yearQuery || !yearQuery.trim()) {
      return years;
    }
    const query = yearQuery.toLowerCase();
    return years.filter((y) => y.toString().includes(query));
  }, [yearQuery, years]);

  // Handle year selection
  const handleSelectYear = useCallback((selectedYear: number) => {
    setYear(selectedYear);
    setYearQuery(selectedYear.toString());
    setIsYearDropdownOpen(false);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setYearQuery(null);
    setIsYearDropdownOpen(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute report data using useMemo to avoid infinite loops
  const reportData = useMemo(() => {
    const summary: Record<string, { name: string; monthly: number[] }> = {};

    const filteredExpenseVouchers = expenseVouchers.filter((v) => {
      const voucherYear = new Date(v.date).getFullYear();
      const yearMatch = voucherYear === year;
      const branchMatch = selectedBranch === "all" || v.branchName === selectedBranch;
      return yearMatch && branchMatch;
    });

    filteredExpenseVouchers.forEach((voucher) => {
      const monthIndex = new Date(voucher.date).getMonth();
      const key = voucher.expenseCode;

      if (!summary[key]) {
        summary[key] = {
          name: key,
          monthly: Array(12).fill(0),
        };
      }
      summary[key].monthly[monthIndex] += voucher.amount;
    });

    return Object.values(summary);
  }, [expenseVouchers, year, selectedBranch]);

  const monthlyTotals = months.map((_, monthIndex) =>
    reportData.reduce((sum, item) => sum + (item.monthly[monthIndex] || 0), 0),
  );
  const grandTotal = monthlyTotals.reduce((sum, total) => sum + total, 0);

  const handleExcelExport = () => {
    const dataToExport = [
      ...reportData.map((item) => {
        const itemTotal = item.monthly.reduce((sum, val) => sum + val, 0);
        const row: any = {
          "اسم البند": item.name,
        };
        months.forEach((month, index) => {
          row[month] = item.monthly[index] > 0 ? formatNumber(item.monthly[index]) : "-";
        });
        row["الإجمالي"] = formatNumber(itemTotal);
        return row;
      }),
      (() => {
        const totalRow: any = {
          "اسم البند": "الإجمالي الشهري",
        };
        months.forEach((month, index) => {
          totalRow[month] = formatNumber(monthlyTotals[index]);
        });
        totalRow["الإجمالي"] = formatNumber(grandTotal);
        return totalRow;
      })(),
    ];
    exportToExcel(dataToExport, `تقرير_إجمالي_المصروفات_${year}`);
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
                @page {
                    size: landscape;
                    @bottom-center {
                        content: counter(page) " / " counter(pages);
                        font-family: "Cairo", sans-serif;
                        font-size: 12px;
                        color: #1F2937;
                    }
                }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; margin: 0; padding: 10px; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    #printable-container { overflow: visible !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-row-group !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px !important; border: 1px solid #D1D5DB !important; }
                    th { font-size: 12px !important; font-weight: bold !important; border-left: 1px solid #D1D5DB !important; border-top: 1px solid #D1D5DB !important; border-bottom: 1px solid #D1D5DB !important; padding: 6px 8px !important; }
                    td { font-size: 12px !important; border-left: 1px solid #D1D5DB !important; border-top: 1px solid #D1D5DB !important; border-bottom: 1px solid #D1D5DB !important; padding: 6px 8px !important; }
                    tbody tr:nth-child(2n+1) { background: #FFFFFF !important; }
                    tbody tr:nth-child(2n+2) { background: #F3F4F6 !important; }
                    tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                    tfoot td { padding: 6px 8px !important; }
                    tfoot th { padding: 6px 8px !important; }
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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} />
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
            <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranch === "all" ? "جميع الفروع" : selectedBranch}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">السنة:</span> {year}
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
            <label className="font-semibold">الفرع:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg"
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
            <label className="font-semibold">للسنة:</label>
            <div className="relative" ref={yearRef}>
              <input
                type="text"
                placeholder="ابحث عن سنة..."
                value={yearQuery !== null ? yearQuery : year.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setYearQuery(value);
                  setIsYearDropdownOpen(true);
                  // If user types a valid year number, update the year
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 2000 && numValue <= currentYear + 10) {
                    setYear(numValue);
                  }
                }}
                onFocus={() => {
                  setIsYearDropdownOpen(true);
                }}
                className="p-2 pr-8 border-2 border-brand-blue rounded-md w-32"
              />
              {yearQuery !== null && yearQuery !== "" && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="مسح البحث"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              {isYearDropdownOpen && (
                <div className="absolute z-20 w-32 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredYears.length > 0 ? (
                    filteredYears.map((y) => (
                      <div
                        key={y}
                        onClick={() => handleSelectYear(y)}
                        className="p-2 cursor-pointer hover:bg-brand-blue-bg text-center"
                      >
                        {y}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-gray-500">
                      لا توجد نتائج
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2"
              disabled
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.TOTAL_EXPENSES_REPORT,
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
                onClick={handleExcelExport}
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

        <div
          id="printable-container"
          className="overflow-x-auto border-2 border-brand-blue rounded-lg"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase border-l border-gray-300">
                  اسم البند
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="px-4 py-3 text-center text-sm font-semibold text-white uppercase border-l border-gray-300"
                  >
                    {month}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase border-l border-gray-300">
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item, idx) => {
                const itemTotal = item.monthly.reduce(
                  (sum, val) => sum + val,
                  0,
                );
                const isEvenRow = idx % 2 === 0;
                const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-100";
                return (
                  <tr key={idx} className={`hover:bg-brand-blue-bg ${rowBgClass}`}>
                    <td className={`px-4 py-4 font-medium text-brand-dark whitespace-nowrap border-l border-gray-300`}>
                      {item.name}
                    </td>
                    {item.monthly.map((amount, index) => (
                      <td
                        key={index}
                        className={`px-4 py-4 text-center whitespace-nowrap border-l border-gray-300 ${getNegativeNumberClass(amount)}`}
                      >
                        {amount > 0 ? formatNumber(amount) : "-"}
                      </td>
                    ))}
                    <td className={`px-4 py-4 font-bold text-center whitespace-nowrap border-l border-gray-300 ${getNegativeNumberClass(itemTotal)}`}>
                      {formatNumber(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td className="px-2 py-1 text-right text-white border-l border-gray-300">
                  الإجمالي الشهري
                </td>
                {monthlyTotals.map((total, index) => (
                  <td
                    key={index}
                    className={`px-2 py-1 text-center text-white whitespace-nowrap border-l border-gray-300 ${getNegativeNumberClassForTotal(total)}`}
                  >
                    {formatNumber(total)}
                  </td>
                ))}
                <td className={`px-2 py-1 text-center text-white whitespace-nowrap border-l border-gray-300 ${getNegativeNumberClassForTotal(grandTotal)}`}>
                  {formatNumber(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TotalExpensesReport;
