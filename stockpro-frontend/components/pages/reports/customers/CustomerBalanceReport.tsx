import React, { useMemo, useState, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Customer,
  Invoice,
  Voucher,
  Branch,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber } from "../../../../utils/formatting";

interface CustomerBalanceReportProps {
  title: string;
  companyInfo: CompanyInfo;
  customers: Customer[];
  salesInvoices: Invoice[];
  salesReturns: Invoice[];
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  branches: Branch[];
  currentUser: User | null;
}

const CustomerBalanceReport: React.FC<CustomerBalanceReportProps> = ({
  title,
  companyInfo,
  customers,
  salesInvoices,
  salesReturns,
  receiptVouchers,
  paymentVouchers,
  branches,
  currentUser,
}) => {
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [reportData, setReportData] = useState<any[]>([]);

  const handleViewReport = useCallback(() => {
    const customerBalanceData = customers.map((customer) => {
      const customerIdStr = customer.id.toString();
      const customerId = customer.id;

      const sales = salesInvoices
        .filter(
          (inv) =>
            inv.customerOrSupplier?.id === customerIdStr && inv.date <= endDate,
        )
        .reduce((sum, inv) => sum + inv.totals.net, 0);

      const returns = salesReturns
        .filter(
          (inv) =>
            inv.customerOrSupplier?.id === customerIdStr && inv.date <= endDate,
        )
        .reduce((sum, inv) => sum + inv.totals.net, 0);

      const receipts = receiptVouchers
        .filter(
          (v) =>
            v.entity.type === "customer" &&
            v.entity.id == customerId &&
            v.date <= endDate,
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const payments = paymentVouchers // Refunds to customer are a debit
        .filter(
          (v) =>
            v.entity.type === "customer" &&
            v.entity.id == customerId &&
            v.date <= endDate,
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const opening = customer.openingBalance;
      const totalDebit = sales + payments;
      const totalCredit = returns + receipts;
      const balance = opening + totalDebit - totalCredit;

      return {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        opening: opening,
        debit: totalDebit,
        credit: totalCredit,
        balance: balance,
      };
    });
    setReportData(customerBalanceData);
  }, [
    customers,
    salesInvoices,
    salesReturns,
    receiptVouchers,
    paymentVouchers,
    endDate,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totals = reportData.reduce(
    (acc, item) => {
      acc.opening += item.opening;
      acc.debit += item.debit;
      acc.credit += item.credit;
      acc.balance += item.balance;
      return acc;
    },
    { opening: 0, debit: 0, credit: 0, balance: 0 },
  );

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2">
          <p>
            <strong>فرع الطباعة:</strong> {currentUser?.branch}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold">الفرع:</label>
            <select className={inputStyle}>
              <option value="all">جميع الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">الرصيد حتى تاريخ:</label>
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
                  كود العميل
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  اسم العميل
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رصيد أول المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد الحالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">{formatNumber(item.opening)}</td>
                  <td className="px-6 py-4 text-red-600">
                    {formatNumber(item.debit)}
                  </td>
                  <td className="px-6 py-4 text-green-600">
                    {formatNumber(item.credit)}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td colSpan={2} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right">
                  {formatNumber(totals.opening)}
                </td>
                <td className="px-6 py-3 text-right">
                  {formatNumber(totals.debit)}
                </td>
                <td className="px-6 py-3 text-right">
                  {formatNumber(totals.credit)}
                </td>
                <td className="px-6 py-3 text-right">
                  {formatNumber(totals.balance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerBalanceReport;
