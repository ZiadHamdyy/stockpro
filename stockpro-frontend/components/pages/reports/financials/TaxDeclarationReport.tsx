import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { CompanyInfo, Branch, User, Invoice } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";

interface TaxDeclarationReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const TaxDeclarationReport: React.FC<TaxDeclarationReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  // API hooks
  const { data: apiSalesInvoices = [], isLoading: salesInvoicesLoading } =
    useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } =
    useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [], isLoading: purchaseReturnsLoading } =
    useGetPurchaseReturnsQuery(undefined);
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);

  // Transform API data to match expected format
  const salesInvoices = useMemo(() => {
    return (apiSalesInvoices as any[]).map((invoice) => ({
      ...invoice,
      // Transform nested customer data
      customerOrSupplier: invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiSalesInvoices]);

  const salesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested customer data
      customerOrSupplier: returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiSalesReturns]);

  const purchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      // Transform nested supplier data
      customerOrSupplier: invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiPurchaseInvoices]);

  const purchaseReturns = useMemo(() => {
    return (apiPurchaseReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested supplier data
      customerOrSupplier: returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiPurchaseReturns]);

  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
      // Add any necessary transformations here
    }));
  }, [apiBranches]);

  const isLoading =
    salesInvoicesLoading ||
    salesReturnsLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    branchesLoading;
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
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    const salesTax = filteredSales.reduce(
      (sum, inv) => sum + (inv.tax || 0),
      0,
    );

    const returnsSubtotal = filteredReturns.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    const returnsTax = filteredReturns.reduce(
      (sum, inv) => sum + (inv.tax || 0),
      0,
    );

    const purchasesSubtotal = filteredPurchases.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    const purchasesTax = filteredPurchases.reduce(
      (sum, inv) => sum + (inv.tax || 0),
      0,
    );

    const purchaseReturnsSubtotal = filteredPurchaseReturns.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    const purchaseReturnsTax = filteredPurchaseReturns.reduce(
      (sum, inv) => sum + (inv.tax || 0),
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
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.salesSubtotal)}`}>
                  {formatNumber(reportData.salesSubtotal)}
                </td>
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.salesTax)}`}>
                  {formatNumber(reportData.salesTax)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">2</td>
                <td className="px-4 py-3">مرتجعات المبيعات</td>
                <td className={`px-4 py-3 text-red-600 ${getNegativeNumberClass(reportData.returnsSubtotal)}`}>
                  ({formatNumber(reportData.returnsSubtotal)})
                </td>
                <td className={`px-4 py-3 text-red-600 ${getNegativeNumberClass(reportData.returnsTax)}`}>
                  ({formatNumber(reportData.returnsTax)})
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="px-4 py-2 text-right">
                  إجمالي ضريبة المخرجات
                </td>
                <td className={`px-4 py-2 text-green-600 ${getNegativeNumberClass(reportData.outputVat)}`}>
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
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.purchasesSubtotal)}`}>
                  {formatNumber(reportData.purchasesSubtotal)}
                </td>
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.purchasesTax)}`}>
                  {formatNumber(reportData.purchasesTax)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-center">4</td>
                <td className="px-4 py-3">مرتجعات المشتريات</td>
                <td className={`px-4 py-3 text-red-600 ${getNegativeNumberClass(reportData.purchaseReturnsSubtotal)}`}>
                  ({formatNumber(reportData.purchaseReturnsSubtotal)})
                </td>
                <td className={`px-4 py-3 text-red-600 ${getNegativeNumberClass(reportData.purchaseReturnsTax)}`}>
                  ({formatNumber(reportData.purchaseReturnsTax)})
                </td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td colSpan={3} className="px-4 py-2 text-right">
                  إجمالي ضريبة المدخلات
                </td>
                <td className={`px-4 py-2 text-red-600 ${getNegativeNumberClass(reportData.inputVat)}`}>
                  {formatNumber(reportData.inputVat)}
                </td>
              </tr>

              <tr className="bg-brand-blue text-white font-bold text-lg">
                <td colSpan={3} className="px-4 py-3 text-right">
                  ثالثاً: صافي الضريبة المستحقة
                </td>
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.netVat)}`}>
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
