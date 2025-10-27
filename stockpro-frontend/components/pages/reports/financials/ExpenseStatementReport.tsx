import React, { useState, useMemo, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber } from "../../../../utils/formatting";
import { useGetExpenseCodesQuery } from "../../../store/slices/expense/expenseApiSlice";
import { useGetExpensePaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";

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

  // Transform API data to match expected format
  const expenseCodes = useMemo(() => {
    return (apiExpenseCodes as any[]).map((code) => ({
      ...code,
      // Add any necessary transformations here
    }));
  }, [apiExpenseCodes]);

  // Transform payment vouchers from API
  const paymentVouchers = useMemo(() => {
    return (apiPaymentVouchers as any[]).map((voucher) => ({
      id: voucher.code,
      date: typeof voucher.date === "string" 
        ? voucher.date 
        : voucher.date?.toISOString().split("T")[0] || "",
      entity: {
        type: voucher.entityType,
        id: voucher.expenseCodeId || "",
      },
      expenseCodeId: voucher.expenseCodeId,
      amount: voucher.amount,
      description: voucher.description || "",
    }));
  }, [apiPaymentVouchers]);

  const isLoading = expenseCodesLoading || vouchersLoading;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [selectedExpenseCodeId, setSelectedExpenseCodeId] = useState<
    string | null
  >(null);
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

    const transactions = paymentVouchers
      .filter(
        (v) =>
          v.expenseCodeId === codeId &&
          v.date >= startDate &&
          v.date <= endDate,
      )
      .map((v) => ({
        date: v.date,
        description: v.description || "مصروف",
        ref: v.id,
        amount: v.amount,
      }));

    transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let balance = 0;
    const finalData = transactions.map((t) => {
      balance += t.amount;
      return { ...t, balance };
    });
    setReportData(finalData);
  }, [selectedExpenseCodeId, paymentVouchers, startDate, endDate]);

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
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>بند المصروف:</strong> {selectedExpenseCodeName}
          </p>
          <p>
            <strong>الفترة من:</strong> {startDate} <strong>إلى:</strong>{" "}
            {endDate}
          </p>
          <p>
            <strong>فرع الطباعة:</strong> {typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName || currentUser?.name}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4">
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
                  التاريخ
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
                <td colSpan={4} className="px-6 py-3 font-bold">
                  رصيد أول المدة
                </td>
                <td className="px-6 py-3 font-bold">{formatNumber(0)}</td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description}
                  </td>
                  <td className="px-6 py-4">{item.ref}</td>
                  <td className="px-6 py-4 text-red-600">
                    {formatNumber(item.amount)}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-bold text-brand-dark">
                <td colSpan={3} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right text-red-600">
                  {formatNumber(totalAmount)}
                </td>
                <td className="px-6 py-3 text-right">
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
