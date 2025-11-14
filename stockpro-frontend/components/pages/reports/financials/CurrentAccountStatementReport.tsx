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

interface CurrentAccountStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const CurrentAccountStatementReport: React.FC<
  CurrentAccountStatementReportProps
> = ({ title, companyInfo, receiptVouchers, paymentVouchers, currentUser }) => {
  // API hooks
  const { data: apiCurrentAccounts = [], isLoading: currentAccountsLoading } =
    useGetCurrentAccountsQuery(undefined);

  // Transform API data to match expected format
  const currentAccounts = useMemo(() => {
    return (apiCurrentAccounts as any[]).map((account) => ({
      ...account,
      // Add any necessary transformations here
    }));
  }, [apiCurrentAccounts]);

  const isLoading = currentAccountsLoading;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

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
    const accountId = selectedAccount.id;
    const receiptsBefore = receiptVouchers
      .filter(
        (v) =>
          v.entity.type === "current_account" &&
          v.entity.id === accountId &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    const paymentsBefore = paymentVouchers
      .filter(
        (v) =>
          v.entity.type === "current_account" &&
          v.entity.id === accountId &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    // Assuming debit (payment) increases balance for liability accounts (partners) and credit (receipt) decreases it.
    // Let's stick to Debit increases, Credit decreases for simplicity.
    return selectedAccount.openingBalance + paymentsBefore - receiptsBefore;
  }, [selectedAccount, receiptVouchers, paymentVouchers, startDate]);

  const reportData = useMemo(() => {
    if (!selectedAccountId) return [];
    const accountId = parseInt(selectedAccountId);

    const transactions: {
      date: string;
      description: string;
      ref: string;
      debit: number;
      credit: number;
    }[] = [];

    paymentVouchers.forEach((v) => {
      if (
        v.entity.type === "current_account" &&
        v.entity.id === accountId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند صرف",
          ref: v.id,
          debit: v.amount,
          credit: 0,
        });
      }
    });
    receiptVouchers.forEach((v) => {
      if (
        v.entity.type === "current_account" &&
        v.entity.id === accountId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند قبض",
          ref: v.id,
          debit: 0,
          credit: v.amount,
        });
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
    receiptVouchers,
    paymentVouchers,
    startDate,
    endDate,
    openingBalance,
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
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
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
                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">فرع الطباعة:</span> {typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">المستخدم:</span> {currentUser?.fullName || currentUser?.name}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4">
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
            <button className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
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
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={4} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-36">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description} ({item.ref})
                  </td>
                  <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(item.debit)}`}>
                    {formatNumber(item.debit)}
                  </td>
                  <td className={`px-6 py-4 text-green-600 ${getNegativeNumberClass(item.credit)}`}>
                    {formatNumber(item.credit)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue">
              <tr className="font-bold text-white">
                <td colSpan={2} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalDebit)}`}>
                  {formatNumber(totalDebit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalCredit)}`}>
                  {formatNumber(totalCredit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(finalBalance)}`}>
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
