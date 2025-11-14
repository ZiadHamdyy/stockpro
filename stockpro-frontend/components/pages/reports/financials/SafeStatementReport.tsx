import React, { useState, useMemo, useEffect } from "react";
import type { CompanyInfo, Safe, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetSafesQuery } from "../../../store/slices/safe/safeApiSlice";
import { useGetInternalTransfersQuery } from "../../../store/slices/internalTransferApiSlice";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";

interface SafeStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const SafeStatementReport: React.FC<SafeStatementReportProps> = ({
  title,
  companyInfo,
  receiptVouchers,
  paymentVouchers,
  currentUser,
}) => {
  // API hooks
  const { data: apiSafes = [], isLoading: safesLoading } =
    useGetSafesQuery(undefined);
  const { data: apiInternalTransfers = [] } = useGetInternalTransfersQuery();
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery(undefined);
  const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery(undefined);
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery(undefined);

  // Transform API data to match expected format
  const safes = useMemo(() => {
    return (apiSafes as any[]).map((safe) => ({
      ...safe,
      // Add any necessary transformations here
    }));
  }, [apiSafes]);

  const isLoading = safesLoading;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [selectedSafeId, setSelectedSafeId] = useState<string | null>(null);

  // Set initial selected safe when data loads
  useEffect(() => {
    if (safes.length > 0 && !selectedSafeId) {
      setSelectedSafeId(safes[0].id.toString());
    }
  }, [safes, selectedSafeId]);

  const selectedSafe = useMemo(
    () => safes.find((s) => s.id.toString() === selectedSafeId),
    [safes, selectedSafeId],
  );
  const selectedSafeName = selectedSafe?.name || "غير محدد";

  const openingBalance = useMemo(() => {
    if (!selectedSafe) return 0;
    const safeId = selectedSafe.id.toString();
    
    // Receipt vouchers (incoming)
    const receiptsBefore = receiptVouchers
      .filter(
        (v) =>
          v.paymentMethod === "safe" &&
          v.safeOrBankId === selectedSafe.id &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Payment vouchers (outgoing)
    const paymentsBefore = paymentVouchers
      .filter(
        (v) =>
          v.paymentMethod === "safe" &&
          v.safeOrBankId === selectedSafe.id &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Sales invoices (cash payments to safe) - incoming
    const salesInvoicesBefore = (apiSalesInvoices as any[])
      .filter(
        (inv) =>
          inv.paymentMethod === "cash" &&
          inv.paymentTargetType === "safe" &&
          inv.paymentTargetId === safeId &&
          new Date(inv.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Purchase invoices (cash payments from safe) - outgoing
    const purchaseInvoicesBefore = (apiPurchaseInvoices as any[])
      .filter(
        (inv) =>
          inv.paymentMethod === "cash" &&
          inv.paymentTargetType === "safe" &&
          inv.paymentTargetId === safeId &&
          new Date(inv.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    
    // Sales returns (cash payments from safe) - outgoing
    const salesReturnsBefore = (apiSalesReturns as any[])
      .filter(
        (ret) =>
          ret.paymentMethod === "cash" &&
          ret.paymentTargetType === "safe" &&
          ret.paymentTargetId === safeId &&
          new Date(ret.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, ret) => sum + (ret.total || 0), 0);
    
    // Purchase returns (cash payments to safe) - incoming
    const purchaseReturnsBefore = (apiPurchaseReturns as any[])
      .filter(
        (ret) =>
          ret.paymentMethod === "cash" &&
          ret.paymentTargetType === "safe" &&
          ret.paymentTargetId === safeId &&
          new Date(ret.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, ret) => sum + (ret.total || 0), 0);
    
    // Internal transfers before startDate
    const outgoingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) =>
          t.fromType === "safe" &&
          t.fromSafeId === safeId &&
          new Date(t.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const incomingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) =>
          t.toType === "safe" &&
          t.toSafeId === safeId &&
          new Date(t.date).toISOString().substring(0, 10) < startDate,
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Opening balance = initial + incoming - outgoing
    return selectedSafe.openingBalance 
      + receiptsBefore 
      + salesInvoicesBefore 
      + purchaseReturnsBefore 
      + incomingBefore
      - paymentsBefore 
      - purchaseInvoicesBefore 
      - salesReturnsBefore 
      - outgoingBefore;
  }, [selectedSafe, receiptVouchers, paymentVouchers, apiInternalTransfers, apiSalesInvoices, apiPurchaseInvoices, apiSalesReturns, apiPurchaseReturns, startDate]);

  const reportData = useMemo(() => {
    if (!selectedSafeId) return [];
    const safeId = selectedSafeId.toString();

    const transactions: {
      date: string;
      description: string;
      ref: string;
      debit: number;
      credit: number;
    }[] = [];

    // Receipt Vouchers (incoming) - Debit
    receiptVouchers.forEach((v: any) => {
      if (
        v.paymentMethod === "safe" &&
        v.safeOrBankId?.toString() === safeId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند قبض من ${v.entity.name}`,
          ref: v.code || v.id,
          debit: v.amount,
          credit: 0,
        });
      }
    });

    // Sales Invoices (cash payments to safe) - Debit (incoming)
    (apiSalesInvoices as any[]).forEach((inv) => {
      const invoiceDate = new Date(inv.date).toISOString().substring(0, 10);
      if (
        inv.paymentMethod === "cash" &&
        inv.paymentTargetType === "safe" &&
        inv.paymentTargetId === safeId &&
        invoiceDate >= startDate &&
        invoiceDate <= endDate
      ) {
        transactions.push({
          date: invoiceDate,
          description: `فاتورة مبيعات - ${inv.customerOrSupplier?.name || "عميل"}`,
          ref: inv.code || inv.id,
          debit: inv.total || 0,
          credit: 0,
        });
      }
    });

    // Purchase Returns (cash payments to safe) - Debit (incoming)
    (apiPurchaseReturns as any[]).forEach((ret) => {
      const returnDate = new Date(ret.date).toISOString().substring(0, 10);
      if (
        ret.paymentMethod === "cash" &&
        ret.paymentTargetType === "safe" &&
        ret.paymentTargetId === safeId &&
        returnDate >= startDate &&
        returnDate <= endDate
      ) {
        transactions.push({
          date: returnDate,
          description: `مرتجع مشتريات - ${ret.customerOrSupplier?.name || "مورد"}`,
          ref: ret.code || ret.id,
          debit: ret.total || 0,
          credit: 0,
        });
      }
    });

    // Transfer to Cashier (incoming) - Debit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = new Date(t.date).toISOString().substring(0, 10);
      if (
        t.toType === "safe" &&
        t.toSafeId === safeId &&
        transferDate >= startDate &&
        transferDate <= endDate
      ) {
        const fromAccountName =
          t.fromType === "safe" ? t.fromSafe?.name : t.fromBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل إلى الخزينة من ${fromAccountName}`,
          ref: t.code,
          debit: t.amount,
          credit: 0,
        });
      }
    });

    // Purchase Invoices (cash payments from safe) - Credit (outgoing)
    (apiPurchaseInvoices as any[]).forEach((inv) => {
      const invoiceDate = new Date(inv.date).toISOString().substring(0, 10);
      if (
        inv.paymentMethod === "cash" &&
        inv.paymentTargetType === "safe" &&
        inv.paymentTargetId === safeId &&
        invoiceDate >= startDate &&
        invoiceDate <= endDate
      ) {
        transactions.push({
          date: invoiceDate,
          description: `فاتورة مشتريات - ${inv.customerOrSupplier?.name || "مورد"}`,
          ref: inv.code || inv.id,
          debit: 0,
          credit: inv.total || 0,
        });
      }
    });

    // Sales Returns (cash payments from safe) - Credit (outgoing)
    (apiSalesReturns as any[]).forEach((ret) => {
      const returnDate = new Date(ret.date).toISOString().substring(0, 10);
      if (
        ret.paymentMethod === "cash" &&
        ret.paymentTargetType === "safe" &&
        ret.paymentTargetId === safeId &&
        returnDate >= startDate &&
        returnDate <= endDate
      ) {
        transactions.push({
          date: returnDate,
          description: `مرتجع مبيعات - ${ret.customerOrSupplier?.name || "عميل"}`,
          ref: ret.code || ret.id,
          debit: 0,
          credit: ret.total || 0,
        });
      }
    });

    // Payment Vouchers (outgoing) - Credit
    paymentVouchers.forEach((v: any) => {
      if (
        v.paymentMethod === "safe" &&
        v.safeOrBankId?.toString() === safeId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند صرف إلى ${v.entity.name}`,
          ref: v.code || v.id,
          debit: 0,
          credit: v.amount,
        });
      }
    });

    // Transfer from Cashier (outgoing) - Credit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = new Date(t.date).toISOString().substring(0, 10);
      if (
        t.fromType === "safe" &&
        t.fromSafeId === safeId &&
        transferDate >= startDate &&
        transferDate <= endDate
      ) {
        const toAccountName =
          t.toType === "safe" ? t.toSafe?.name : t.toBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل من الخزينة إلى ${toAccountName}`,
          ref: t.code,
          debit: 0,
          credit: t.amount,
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
    selectedSafeId,
    receiptVouchers,
    paymentVouchers,
    apiInternalTransfers,
    apiSalesInvoices,
    apiPurchaseInvoices,
    apiSalesReturns,
    apiPurchaseReturns,
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
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
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
                <span className="text-brand-blue">الخزينة:</span> {selectedSafeName}
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
          <div className="flex items-center gap-4">
            <select
              className={inputStyle}
              value={selectedSafeId || ""}
              onChange={(e) => setSelectedSafeId(e.target.value)}
            >
              <option value="">اختر الخزينة...</option>
              {safes.map((s) => (
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  مدين (وارد)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  دائن (صادر)
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
                  <td className="px-6 py-4 w-36">{item.date.substring(0, 10)}</td>
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

export default SafeStatementReport;
