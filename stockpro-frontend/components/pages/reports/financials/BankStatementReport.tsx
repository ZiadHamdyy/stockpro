import React, { useState, useMemo, useEffect } from "react";
import type { CompanyInfo, Bank, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetBanksQuery } from "../../../store/slices/bank/bankApiSlice";
import { useGetInternalTransfersQuery } from "../../../store/slices/internalTransferApiSlice";

interface BankStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const BankStatementReport: React.FC<BankStatementReportProps> = ({
  title,
  companyInfo,
  receiptVouchers,
  paymentVouchers,
  currentUser,
}) => {
  // API hooks
  const { data: apiBanks = [], isLoading: banksLoading } =
    useGetBanksQuery(undefined);
  const { data: apiInternalTransfers = [] } = useGetInternalTransfersQuery();

  // Transform API data to match expected format
  const banks = useMemo(() => {
    return (apiBanks as any[]).map((bank) => ({
      ...bank,
      // Add any necessary transformations here
    }));
  }, [apiBanks]);

  const isLoading = banksLoading;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Set initial selected bank when data loads
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id.toString());
    }
  }, [banks, selectedBankId]);

  const selectedBank = useMemo(
    () => banks.find((b) => b.id.toString() === selectedBankId),
    [banks, selectedBankId],
  );
  const selectedBankName = selectedBank?.name || "غير محدد";

  const openingBalance = useMemo(() => {
    if (!selectedBank) return 0;
    const bankId = selectedBank.id.toString();
    const receiptsBefore = receiptVouchers
      .filter(
        (v) =>
          v.paymentMethod === "bank" &&
          v.safeOrBankId === selectedBank.id &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    const paymentsBefore = paymentVouchers
      .filter(
        (v) =>
          v.paymentMethod === "bank" &&
          v.safeOrBankId === selectedBank.id &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Include internal transfers before startDate
    const outgoingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) =>
          t.fromType === "bank" &&
          t.fromBankId === bankId &&
          new Date(t.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const incomingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) =>
          t.toType === "bank" &&
          t.toBankId === bankId &&
          new Date(t.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return selectedBank.openingBalance + receiptsBefore - paymentsBefore - outgoingBefore + incomingBefore;
  }, [selectedBank, receiptVouchers, paymentVouchers, apiInternalTransfers, startDate]);

  const reportData = useMemo(() => {
    if (!selectedBankId) return [];
    const bankId = parseInt(selectedBankId);

    const transactions: {
      date: string;
      description: string;
      ref: string;
      debit: number;
      credit: number;
    }[] = [];

    receiptVouchers.forEach((v) => {
      if (
        v.paymentMethod === "bank" &&
        v.safeOrBankId === bankId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند قبض من ${v.entity.name}`,
          ref: v.id,
          debit: v.amount,
          credit: 0,
        });
      }
    });
    paymentVouchers.forEach((v) => {
      if (
        v.paymentMethod === "bank" &&
        v.safeOrBankId === bankId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند صرف إلى ${v.entity.name}`,
          ref: v.id,
          debit: 0,
          credit: v.amount,
        });
      }
    });

    // Add outgoing internal transfers (money going out)
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = new Date(t.date).toISOString().substring(0, 10);
      if (
        t.fromType === "bank" &&
        t.fromBankId === bankId.toString() &&
        transferDate >= startDate &&
        transferDate <= endDate
      ) {
        const toAccountName =
          t.toType === "safe" ? t.toSafe?.name : t.toBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل إلى ${toAccountName}`,
          ref: t.code,
          debit: 0,
          credit: t.amount,
        });
      }
    });

    // Add incoming internal transfers (money coming in)
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = new Date(t.date).toISOString().substring(0, 10);
      if (
        t.toType === "bank" &&
        t.toBankId === bankId.toString() &&
        transferDate >= startDate &&
        transferDate <= endDate
      ) {
        const fromAccountName =
          t.fromType === "safe" ? t.fromSafe?.name : t.fromBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل من ${fromAccountName}`,
          ref: t.code,
          debit: t.amount,
          credit: 0,
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
    selectedBankId,
    receiptVouchers,
    paymentVouchers,
    apiInternalTransfers,
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
      '<script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(
      '<style>body { font-family: "Cairo", sans-serif; direction: rtl; } @media print { body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } .no-print { display: none !important; } thead { display: table-header-group; } tfoot { display: table-footer-group; } table { width: 100%; border-collapse: collapse; } .bg-brand-blue { background-color: #1E40AF !important; } .text-white { color: white !important; } .bg-gray-50 { background-color: #F9FAFB !important; } .text-brand-blue { color: #1E40AF !important; } .text-gray-700 { color: #374151 !important; } .text-gray-800 { color: #1F2937 !important; } .flex { display: flex !important; } .justify-between { justify-content: space-between !important; } }</style>',
    );
    printWindow?.document.write(
      "</head><body>" + reportContent.innerHTML + "</body></html>",
    );
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
                <span className="text-brand-blue">البنك:</span> {selectedBankName}
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
              value={selectedBankId || ""}
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              <option value="">اختر البنك...</option>
              {banks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
                  مدين (إيداع)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  دائن (سحب)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description}
                  </td>
                  <td className="px-6 py-4">{item.ref}</td>
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
            <tfoot className="bg-brand-blue">
              <tr className="font-bold text-white">
                <td colSpan={3} className="px-6 py-3 text-right">
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

export default BankStatementReport;
