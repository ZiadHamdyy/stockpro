import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { CompanyInfo, Branch, User, Invoice } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber } from "../../../../utils/formatting";

interface TaxDeclarationReportProps {
  title: string;
  companyInfo: CompanyInfo;
  salesInvoices: Invoice[];
  salesReturns: Invoice[];
  purchaseInvoices: Invoice[];
  purchaseReturns: Invoice[];
  branches: Branch[];
  currentUser: User | null;
}

const TaxDeclarationReport: React.FC<TaxDeclarationReportProps> = ({
  title,
  companyInfo,
  salesInvoices,
  salesReturns,
  purchaseInvoices,
  purchaseReturns,
  branches,
  currentUser,
}) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [reportData, setReportData] = useState({
    salesSubtotal: 0,
    salesTax: 0,
    returnsSubtotal: 0,
    returnsTax: 0,
    purchasesSubtotal: 0,
    purchasesTax: 0,
    purchaseReturnsSubtotal: 0,
    purchaseReturnsTax: 0,
    outputVat: 0,
    inputVat: 0,
    netVat: 0,
  });

  const handleViewReport = useCallback(() => {
    const filterByBranch = (inv: Invoice) =>
      selectedBranch === "all" || inv.branchName === selectedBranch;
    const filterByDate = (inv: Invoice) =>
      inv.date >= startDate && inv.date <= endDate;

    const filteredSales = salesInvoices
      .filter(filterByDate)
      .filter(filterByBranch);
    const filteredReturns = salesReturns
      .filter(filterByDate)
      .filter(filterByBranch);
    const filteredPurchases = purchaseInvoices
      .filter(filterByDate)
      .filter(filterByBranch);
    const filteredPurchaseReturns = purchaseReturns
      .filter(filterByDate)
      .filter(filterByBranch);

    const salesSubtotal = filteredSales.reduce(
      (sum, inv) => sum + inv.totals.subtotal,
      0,
    );
    const salesTax = filteredSales.reduce(
      (sum, inv) => sum + inv.totals.tax,
      0,
    );

    const returnsSubtotal = filteredReturns.reduce(
      (sum, inv) => sum + inv.totals.subtotal,
      0,
    );
    const returnsTax = filteredReturns.reduce(
      (sum, inv) => sum + inv.totals.tax,
      0,
    );

    const purchasesSubtotal = filteredPurchases.reduce(
      (sum, inv) => sum + inv.totals.subtotal,
      0,
    );
    const purchasesTax = filteredPurchases.reduce(
      (sum, inv) => sum + inv.totals.tax,
      0,
    );

    const purchaseReturnsSubtotal = filteredPurchaseReturns.reduce(
      (sum, inv) => sum + inv.totals.subtotal,
      0,
    );
    const purchaseReturnsTax = filteredPurchaseReturns.reduce(
      (sum, inv) => sum + inv.totals.tax,
      0,
    );

    const outputVat = salesTax - returnsTax;
    const inputVat = purchasesTax - purchaseReturnsTax;
    const netVat = outputVat - inputVat;

    setReportData({
      salesSubtotal,
      salesTax,
      returnsSubtotal,
      returnsTax,
      purchasesSubtotal,
      purchasesTax,
      purchaseReturnsSubtotal,
      purchaseReturnsTax,
      outputVat,
      inputVat,
      netVat,
    });
  }, [
    selectedBranch,
    startDate,
    endDate,
    salesInvoices,
    salesReturns,
    purchaseInvoices,
    purchaseReturns,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

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
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>الفرع:</strong>{" "}
            {selectedBranch === "all" ? "جميع الفروع" : selectedBranch}
          </p>
          <p>
            <strong>الفترة من:</strong> {startDate} <strong>إلى:</strong>{" "}
            {endDate}
          </p>
          <p>
            <strong>فرع الطباعة:</strong> {currentUser?.branch}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
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
          <table className="min-w-full divide-y-2 divide-brand-blue text-sm md:text-base">
            <thead className="bg-brand-blue text-white">
              <tr>
                <th className="px-4 py-3 text-right font-semibold uppercase w-12">
                  الرقم
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase w-2/4">
                  البيان
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase">
                  القيمة (SAR)
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase">
                  ضريبة القيمة المضافة (SAR)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="bg-green-100 font-bold">
                <td colSpan={4} className="px-4 py-2">
                  أولاً: ضريبة المخرجات (المبيعات)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">1</td>
                <td className="px-4 py-3">المبيعات الخاضعة للنسبة الأساسية</td>
                <td className="px-4 py-3">
                  {formatNumber(reportData.salesSubtotal)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(reportData.salesTax)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">2</td>
                <td className="px-4 py-3">مرتجعات المبيعات</td>
                <td className="px-4 py-3 text-red-600">
                  ({formatNumber(reportData.returnsSubtotal)})
                </td>
                <td className="px-4 py-3 text-red-600">
                  ({formatNumber(reportData.returnsTax)})
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="px-4 py-2 text-right">
                  إجمالي ضريبة المخرجات
                </td>
                <td className="px-4 py-2 text-green-600">
                  {formatNumber(reportData.outputVat)}
                </td>
              </tr>

              <tr className="bg-red-100 font-bold">
                <td colSpan={4} className="px-4 py-2">
                  ثانياً: ضريبة المدخلات (المشتريات)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">3</td>
                <td className="px-4 py-3">المشتريات الخاضعة للنسبة الأساسية</td>
                <td className="px-4 py-3">
                  {formatNumber(reportData.purchasesSubtotal)}
                </td>
                <td className="px-4 py-3">
                  {formatNumber(reportData.purchasesTax)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">4</td>
                <td className="px-4 py-3">مرتجعات المشتريات</td>
                <td className="px-4 py-3 text-red-600">
                  ({formatNumber(reportData.purchaseReturnsSubtotal)})
                </td>
                <td className="px-4 py-3 text-red-600">
                  ({formatNumber(reportData.purchaseReturnsTax)})
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="px-4 py-2 text-right">
                  إجمالي ضريبة المدخلات
                </td>
                <td className="px-4 py-2 text-red-600">
                  {formatNumber(reportData.inputVat)}
                </td>
              </tr>

              <tr className="bg-brand-blue text-white font-bold text-lg">
                <td colSpan={3} className="px-4 py-3 text-right">
                  ثالثاً: صافي الضريبة المستحقة
                </td>
                <td
                  className={`px-4 py-3 ${reportData.netVat >= 0 ? "text-green-300" : "text-red-300"}`}
                >
                  {formatNumber(reportData.netVat)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxDeclarationReport;
