import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyInfo, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";

interface DailyCollectionsReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const DailyCollectionsReport: React.FC<DailyCollectionsReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  const {
    data: apiReceiptVouchers = [],
    isLoading: vouchersLoading,
    error,
    refetch: refetchVouchers,
  } = useGetReceiptVouchersQuery(undefined, { skip });

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
  const receiptVouchers = useMemo(() => {
    return (apiReceiptVouchers as any[]).map((voucher) => {
      const branchName = voucher.branch?.name || 
        branches.find((b) => b.id === voucher.branchId)?.name || 
        "غير محدد";
      
      return {
        id: voucher.id,
        code: voucher.code,
        date: normalizeDate(voucher.date),
        entity: {
          type: voucher.entityType,
          id:
            voucher.customerId ||
            voucher.supplierId ||
            voucher.currentAccountId ||
            "",
          name: voucher.entityName,
        },
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
        branchId: voucher.branchId,
        branchName: branchName,
      };
    });
  }, [apiReceiptVouchers, branches, normalizeDate]);

  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedBranch, setSelectedBranch] = useState("all");

  // Filter vouchers by date range and branch
  const filteredVouchers = useMemo(() => {
    return receiptVouchers.filter((voucher) => {
      // Normalize voucher date to ensure proper comparison
      const voucherDate = normalizeDate(voucher.date);
      if (!voucherDate) return false;
      
      // Ensure dates are in YYYY-MM-DD format for string comparison
      const normalizedStartDate = normalizeDate(startDate);
      const normalizedEndDate = normalizeDate(endDate);
      
      const dateMatch = voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
      const branchMatch = selectedBranch === "all" || voucher.branchName === selectedBranch;
      return dateMatch && branchMatch;
    });
  }, [receiptVouchers, startDate, endDate, selectedBranch, normalizeDate]);

  const isLoading = vouchersLoading || branchesLoading;

  const totals = filteredVouchers.reduce(
    (acc, voucher) => {
      acc.amount += voucher.amount;
      return acc;
    },
    { amount: 0 },
  );

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

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

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

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600">حدث خطأ في تحميل البيانات</p>
            <p className="text-gray-500 text-sm mt-2">
              يرجى التأكد من اتصالك بالإنترنت والتحقق من صلاحياتك
            </p>
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
              onClick={() => refetchVouchers()}
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  م
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رقم السند
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  قبضنا من
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  البيان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVouchers.map((voucher, index) => (
                <tr key={voucher.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4 w-36">{voucher.date.substring(0, 10)}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (voucher.id) {
                          const url = `/financials/receipt-voucher?voucherId=${encodeURIComponent(voucher.id)}`;
                          // Use window.location to ensure URL updates
                          window.location.href = url;
                        } else {
                          console.error("Voucher ID is missing:", voucher);
                        }
                      }}
                      className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                      title="فتح سند القبض"
                    >
                      {voucher.code}
                    </button>
                    <span className="print:inline hidden">{voucher.code}</span>
                  </td>
                  <td className="px-6 py-4">{voucher.branchName}</td>
                  <td className="px-6 py-4">{voucher.entity.name}</td>
                  <td className="px-6 py-4">
                    {voucher.paymentMethod === "safe" ? "نقداً" : "بنك"}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(voucher.amount)}`}>
                    {formatNumber(voucher.amount)}
                  </td>
                  <td className="px-6 py-4">{voucher.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold text-white">
                <td colSpan={6} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(totals.amount)}`}>
                  {formatNumber(totals.amount)}
                </td>
                <td className="text-white"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyCollectionsReport;
