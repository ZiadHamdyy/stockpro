import React, { useState } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import {
  formatNumber,
  exportToExcel,
  exportToPdf,
} from "../../../utils/formatting";
import { useBalanceSheet } from "../../hook/useBalanceSheet";
import PermissionWrapper from "../../common/PermissionWrapper";

const BalanceSheet: React.FC = () => {
  const title = "قائمة المركز المالي";
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const {
    data: balanceSheetData,
    companyInfo,
    isLoading,
    error,
  } = useBalanceSheet(endDate);

  const handlePrint = () => {
    const reportContent = document.getElementById(
      "printable-area-balance-sheet",
    );
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
                    @page { size: A4 portrait; margin: 1cm; }
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    table { width: 100%; border-collapse: collapse; }
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

  const handleExcelExport = () => {
    if (!balanceSheetData) return;
    const data = [
      { Item: "الأصول", Value: "" },
      { Item: "  النقدية بالخزن", Value: balanceSheetData.cashInSafes },
      { Item: "  النقدية بالبنوك", Value: balanceSheetData.cashInBanks },
      {
        Item: "  الذمم المدينة (العملاء)",
        Value: balanceSheetData.receivables,
      },
      { Item: "  المخزون", Value: balanceSheetData.inventory },
      { Item: "إجمالي الأصول", Value: balanceSheetData.totalAssets },
      { Item: "", Value: "" }, // Spacer
      { Item: "الالتزامات", Value: "" },
      {
        Item: "  الموردون (ذمم دائنة)",
        Value: balanceSheetData.payables,
      },
      {
        Item: "  ضريبة القيمة المضافة المستحقة",
        Value: balanceSheetData.vatPayable,
      },
      { Item: "إجمالي الالتزامات", Value: balanceSheetData.totalLiabilities },
      { Item: "", Value: "" }, // Spacer
      { Item: "حقوق الملكية", Value: "" },
      { Item: "  رأس المال", Value: balanceSheetData.capital },
      { Item: "  جاري الشركاء", Value: balanceSheetData.partnersBalance },
      {
        Item: "  الأرباح المحتجزة (أرباح الفترة)",
        Value: balanceSheetData.retainedEarnings,
      },
      { Item: "إجمالي حقوق الملكية", Value: balanceSheetData.totalEquity },
      { Item: "", Value: "" }, // Spacer
      {
        Item: "إجمالي الالتزامات وحقوق الملكية",
        Value: balanceSheetData.totalLiabilitiesAndEquity,
      },
    ];
    exportToExcel(data, "قائمة-المركز-المالي");
  };

  const handlePdfExport = () => {
    if (!balanceSheetData) return;
    const head = [["المبلغ", "البيان"]];
    const body = [
      [
        {
          content: "الأصول",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#2563EB",
            textColor: "#FFFFFF",
          },
        },
      ],
      [formatNumber(balanceSheetData.cashInSafes), "النقدية بالخزن"],
      [formatNumber(balanceSheetData.cashInBanks), "النقدية بالبنوك"],
      [formatNumber(balanceSheetData.receivables), "الذمم المدينة (العملاء)"],
      [formatNumber(balanceSheetData.inventory), "المخزون"],
      [
        {
          content: formatNumber(balanceSheetData.totalAssets),
          styles: { fontStyle: "bold", fillColor: "#DBEAFE" },
        },
        {
          content: "إجمالي الأصول",
          styles: { fontStyle: "bold", fillColor: "#DBEAFE" },
        },
      ],

      [
        {
          content: "الالتزامات",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#DC2626",
            textColor: "#FFFFFF",
          },
        },
      ],
      [formatNumber(balanceSheetData.payables), "الموردون (ذمم دائنة)"],
      [
        formatNumber(balanceSheetData.vatPayable),
        "ضريبة القيمة المضافة المستحقة",
      ],
      [
        {
          content: formatNumber(balanceSheetData.totalLiabilities),
          styles: { fontStyle: "bold", fillColor: "#FEE2E2" },
        },
        {
          content: "إجمالي الالتزامات",
          styles: { fontStyle: "bold", fillColor: "#FEE2E2" },
        },
      ],

      [
        {
          content: "حقوق الملكية",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#16A34A",
            textColor: "#FFFFFF",
          },
        },
      ],
      [formatNumber(balanceSheetData.capital), "رأس المال"],
      [formatNumber(balanceSheetData.partnersBalance), "جاري الشركاء"],
      [
        formatNumber(balanceSheetData.retainedEarnings),
        "الأرباح المحتجزة (أرباح الفترة)",
      ],
      [
        {
          content: formatNumber(balanceSheetData.totalEquity),
          styles: { fontStyle: "bold", fillColor: "#D1FAE5" },
        },
        {
          content: "إجمالي حقوق الملكية",
          styles: { fontStyle: "bold", fillColor: "#D1FAE5" },
        },
      ],

      [
        {
          content: formatNumber(balanceSheetData.totalLiabilitiesAndEquity),
          styles: {
            fontStyle: "bold",
            fillColor: "#4B5563",
            textColor: "#FFFFFF",
          },
        },
        {
          content: "إجمالي الالتزامات وحقوق الملكية",
          styles: {
            fontStyle: "bold",
            fillColor: "#4B5563",
            textColor: "#FFFFFF",
          },
        },
      ],
    ];
    exportToPdf(title, head, body, "قائمة-المركز-المالي", companyInfo!);
  };

  const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
    children,
    className,
    ...props
  }) => (
    <td className={`px-4 py-3 ${className || ""}`} {...props}>
      {children}
    </td>
  );

  // Show loading state
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

  // Show error state
  if (error || !balanceSheetData || !companyInfo) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-red-600">
            <p>حدث خطأ أثناء تحميل البيانات</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area-balance-sheet">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>التقرير حتى تاريخ:</strong> {endDate}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold">حتى تاريخ:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <PermissionWrapper requiredPermission="balance_sheet:read">
              <button
                onClick={handleExcelExport}
                title="تصدير Excel"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <ExcelIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper requiredPermission="balance_sheet:read">
              <button
                onClick={handlePdfExport}
                title="تصدير PDF"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PdfIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper requiredPermission="balance_sheet:read">
              <button
                onClick={handlePrint}
                title="طباعة"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PrintIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-gray-300 rounded-lg mt-4">
          <table className="min-w-full text-base">
            <tbody className="divide-y divide-gray-200">
              {/* Assets */}
              <tr className="bg-blue-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  الأصول
                </Td>
              </tr>
              <tr>
                <Td>النقدية بالخزن</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.cashInSafes)}
                </Td>
              </tr>
              <tr>
                <Td>النقدية بالبنوك</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.cashInBanks)}
                </Td>
              </tr>
              <tr>
                <Td>الذمم المدينة (العملاء)</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.receivables)}
                </Td>
              </tr>
              <tr>
                <Td>المخزون</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.inventory)}
                </Td>
              </tr>
              <tr className="font-bold bg-blue-100 text-brand-dark">
                <Td>إجمالي الأصول</Td>
                <Td className="text-left font-mono text-lg">
                  {formatNumber(balanceSheetData.totalAssets)}
                </Td>
              </tr>

              {/* Liabilities */}
              <tr className="bg-red-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  الالتزامات
                </Td>
              </tr>
              <tr>
                <Td>الموردون (ذمم دائنة)</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.payables)}
                </Td>
              </tr>
              <tr>
                <Td>ضريبة القيمة المضافة المستحقة</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.vatPayable)}
                </Td>
              </tr>
              <tr className="font-bold bg-red-100 text-red-800">
                <Td>إجمالي الالتزامات</Td>
                <Td className="text-left font-mono text-lg">
                  {formatNumber(balanceSheetData.totalLiabilities)}
                </Td>
              </tr>

              {/* Equity */}
              <tr className="bg-green-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  حقوق الملكية
                </Td>
              </tr>
              <tr>
                <Td>رأس المال</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.capital)}
                </Td>
              </tr>
              <tr>
                <Td>جاري الشركاء</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.partnersBalance)}
                </Td>
              </tr>
              <tr>
                <Td>الأرباح المحتجزة (أرباح الفترة)</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.retainedEarnings)}
                </Td>
              </tr>
              <tr className="font-bold bg-green-100 text-green-800">
                <Td>إجمالي حقوق الملكية</Td>
                <Td className="text-left font-mono text-lg">
                  {formatNumber(balanceSheetData.totalEquity)}
                </Td>
              </tr>

              {/* Total Liabilities & Equity */}
              <tr className="font-bold bg-gray-700 text-white text-lg">
                <Td>إجمالي الالتزامات وحقوق الملكية</Td>
                <Td className="text-left font-mono">
                  {formatNumber(balanceSheetData.totalLiabilitiesAndEquity)}
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
