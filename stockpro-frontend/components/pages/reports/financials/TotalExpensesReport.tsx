import React, { useMemo, useState, useCallback, useEffect } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber } from "../../../../utils/formatting";
import { useGetExpensePaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";

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
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;
  const { data: apiExpenseVouchers = [], isLoading } =
    useGetExpensePaymentVouchersQuery(undefined, { skip });

  // Transform API data to match expected format
  const expenseVouchers = useMemo(() => {
    return (apiExpenseVouchers as any[]).map((voucher) => ({
      id: voucher.code,
      date: typeof voucher.date === "string" 
        ? voucher.date 
        : voucher.date?.toISOString().split("T")[0] || "",
      entity: {
        type: voucher.entityType,
        name: voucher.entityName,
      },
      expenseCode: voucher.expenseCode?.name || voucher.entityName,
      amount: voucher.amount,
    }));
  }, [apiExpenseVouchers]);

  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<any[]>([]);

  const handleViewReport = useCallback(() => {
    const summary: Record<string, { name: string; monthly: number[] }> = {};

    const filteredExpenseVouchers = expenseVouchers.filter(
      (v) => new Date(v.date).getFullYear() === year,
    );

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

    setReportData(Object.values(summary));
  }, [expenseVouchers, year]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const monthlyTotals = months.map((_, monthIndex) =>
    reportData.reduce((sum, item) => sum + (item.monthly[monthIndex] || 0), 0),
  );
  const grandTotal = monthlyTotals.reduce((sum, total) => sum + total, 0);

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
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    #printable-container { overflow: visible !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
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
        <div className="border-2 border-brand-blue rounded-lg mb-4">
          <InvoiceHeader
            branchName={typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
            userName={currentUser?.fullName || currentUser?.name}
          />
        </div>
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2">
          <p>
            <strong>فرع الطباعة:</strong> {typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName || currentUser?.name}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 no-print">
          <div className="flex items-center gap-4">
            <label className="font-semibold">للسنة:</label>
            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(parseInt(e.target.value) || new Date().getFullYear())
              }
              className="p-2 border-2 border-brand-blue rounded-md w-32"
            />
            <button
              onClick={handleViewReport}
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

        <div
          id="printable-container"
          className="overflow-x-auto border-2 border-brand-blue rounded-lg"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase sticky right-0 bg-brand-blue z-10">
                  اسم البند
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="px-4 py-3 text-center text-sm font-semibold text-white uppercase"
                  >
                    {month}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase">
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
                return (
                  <tr key={idx} className="hover:bg-brand-blue-bg">
                    <td className="px-4 py-4 font-medium text-brand-dark whitespace-nowrap sticky right-0 bg-white hover:bg-brand-blue-bg z-10">
                      {item.name}
                    </td>
                    {item.monthly.map((amount, index) => (
                      <td
                        key={index}
                        className="px-4 py-4 text-center whitespace-nowrap"
                      >
                        {amount > 0 ? formatNumber(amount) : "-"}
                      </td>
                    ))}
                    <td className="px-4 py-4 font-bold text-center whitespace-nowrap">
                      {formatNumber(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td className="px-4 py-3 text-right sticky right-0 bg-brand-blue z-10">
                  الإجمالي الشهري
                </td>
                {monthlyTotals.map((total, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-center whitespace-nowrap"
                  >
                    {formatNumber(total)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center whitespace-nowrap">
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
