import React, { useMemo, useState } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import {
  formatNumber,
  exportToExcel,
  exportToPdf,
  getNegativeNumberClass,
} from "../../../utils/formatting";
import { useBalanceSheet } from "../../hook/useBalanceSheet";
import PermissionWrapper from "../../common/PermissionWrapper";

const flipSign = (value: number) => (value === 0 ? 0 : value * -1);

const BalanceSheet: React.FC = () => {
  const title = "قائمة المركز المالي";
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const {
    data: balanceSheetData,
    companyInfo,
    isLoading,
    error,
  } = useBalanceSheet(startDate, endDate);

  const displayData = useMemo(() => {
    if (!balanceSheetData) {
      return null;
    }

    const payables = flipSign(balanceSheetData.payables);
    const otherPayables = flipSign(balanceSheetData.otherPayables);
    const vatPayable = flipSign(balanceSheetData.vatPayable);
    const partnersBalance = flipSign(balanceSheetData.partnersBalance);
    const retainedEarnings = flipSign(balanceSheetData.retainedEarnings);

    const totalLiabilities = payables + otherPayables + vatPayable;
    const totalEquity =
      balanceSheetData.capital + partnersBalance + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      ...balanceSheetData,
      payables,
      otherPayables,
      vatPayable,
      partnersBalance,
      retainedEarnings,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
    };
  }, [balanceSheetData]);

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
    if (!displayData) return;
    const data = [
      { Item: "الأصول", Value: "" },
      { Item: "  النقدية بالخزن", Value: displayData.cashInSafes },
      { Item: "  النقدية بالبنوك", Value: displayData.cashInBanks },
      {
        Item: "  الذمم المدينة (العملاء)",
        Value: displayData.receivables,
      },
      {
        Item: "  أرصدة مدينة اخري",
        Value: displayData.otherReceivables,
      },
      { Item: "  المخزون", Value: displayData.inventory },
      { Item: "إجمالي الأصول", Value: displayData.totalAssets },
      { Item: "", Value: "" }, // Spacer
      { Item: "الالتزامات", Value: "" },
      {
        Item: "  الموردون (ذمم دائنة)",
        Value: displayData.payables,
      },
      {
        Item: "  أرصدة دائنة اخري",
        Value: displayData.otherPayables,
      },
      {
        Item: "  ضريبة القيمة المضافة المستحقة",
        Value: displayData.vatPayable,
      },
      { Item: "إجمالي الالتزامات", Value: displayData.totalLiabilities },
      { Item: "", Value: "" }, // Spacer
      { Item: "حقوق الملكية", Value: "" },
      { Item: "  رأس المال", Value: displayData.capital },
      { Item: "  جاري الشركاء", Value: displayData.partnersBalance },
      {
        Item: "  الأرباح المحتجزة (أرباح الفترة)",
        Value: displayData.retainedEarnings,
      },
      { Item: "إجمالي حقوق الملكية", Value: displayData.totalEquity },
      { Item: "", Value: "" }, // Spacer
      {
        Item: "إجمالي الالتزامات وحقوق الملكية",
        Value: displayData.totalLiabilitiesAndEquity,
      },
    ];
    exportToExcel(data, "قائمة-المركز-المالي");
  };

  const handlePdfExport = () => {
    if (!displayData) return;
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
      [
        {
          content: formatNumber(displayData.cashInSafes),
          styles: {
            textColor: displayData.cashInSafes < 0 ? "#DC2626" : "#000000",
          },
        },
        "النقدية بالخزن",
      ],
      [
        {
          content: formatNumber(displayData.cashInBanks),
          styles: {
            textColor: displayData.cashInBanks < 0 ? "#DC2626" : "#000000",
          },
        },
        "النقدية بالبنوك",
      ],
      [
        {
          content: formatNumber(displayData.receivables),
          styles: {
            textColor: displayData.receivables < 0 ? "#DC2626" : "#000000",
          },
        },
        "الذمم المدينة (العملاء)",
      ],
      [
        {
          content: formatNumber(displayData.otherReceivables),
          styles: {
            textColor: displayData.otherReceivables < 0 ? "#DC2626" : "#000000",
          },
        },
        "أرصدة مدينة اخري",
      ],
      [
        {
          content: formatNumber(displayData.inventory),
          styles: {
            textColor: displayData.inventory < 0 ? "#DC2626" : "#000000",
          },
        },
        "المخزون",
      ],
      [
        {
          content: formatNumber(displayData.totalAssets),
          styles: {
            fontStyle: "bold",
            fillColor: "#DBEAFE",
            textColor: displayData.totalAssets < 0 ? "#DC2626" : "#000000",
          },
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
      [
        {
          content: formatNumber(displayData.payables),
          styles: {
            textColor: displayData.payables < 0 ? "#DC2626" : "#000000",
          },
        },
        "الموردون (ذمم دائنة)",
      ],
      [
        {
          content: formatNumber(displayData.otherPayables),
          styles: {
            textColor: displayData.otherPayables < 0 ? "#DC2626" : "#000000",
          },
        },
        "أرصدة دائنة اخري",
      ],
      [
        {
          content: formatNumber(displayData.vatPayable),
          styles: {
            textColor: displayData.vatPayable < 0 ? "#DC2626" : "#000000",
          },
        },
        "ضريبة القيمة المضافة المستحقة",
      ],
      [
        {
          content: formatNumber(displayData.totalLiabilities),
          styles: {
            fontStyle: "bold",
            fillColor: "#FEE2E2",
            textColor: displayData.totalLiabilities < 0 ? "#DC2626" : "#000000",
          },
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
      [
        {
          content: formatNumber(displayData.capital),
          styles: {
            textColor: displayData.capital < 0 ? "#DC2626" : "#000000",
          },
        },
        "رأس المال",
      ],
      [
        {
          content: formatNumber(displayData.partnersBalance),
          styles: {
            textColor: displayData.partnersBalance < 0 ? "#DC2626" : "#000000",
          },
        },
        "جاري الشركاء",
      ],
      [
        {
          content: formatNumber(displayData.retainedEarnings),
          styles: {
            textColor: displayData.retainedEarnings < 0 ? "#DC2626" : "#000000",
          },
        },
        "الأرباح المحتجزة (أرباح الفترة)",
      ],
      [
        {
          content: formatNumber(displayData.totalEquity),
          styles: {
            fontStyle: "bold",
            fillColor: "#D1FAE5",
            textColor: displayData.totalEquity < 0 ? "#DC2626" : "#000000",
          },
        },
        {
          content: "إجمالي حقوق الملكية",
          styles: { fontStyle: "bold", fillColor: "#D1FAE5" },
        },
      ],

      [
        {
          content: formatNumber(displayData.totalLiabilitiesAndEquity),
          styles: {
            fontStyle: "bold",
            fillColor: "#4B5563",
            textColor: displayData.totalLiabilitiesAndEquity < 0
              ? "#FCA5A5"
              : "#FFFFFF",
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
  if (error || !displayData || !companyInfo) {
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

  // Calculate balance discrepancy
  // Ensure proper subtraction regardless of signs
  const assets = displayData.totalAssets;
  const liabilitiesAndEquity = displayData.totalLiabilitiesAndEquity;
  const discrepancy = Math.abs(assets - liabilitiesAndEquity);
  const hasDiscrepancy = discrepancy > 0.01; // Allow for small rounding differences

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area-balance-sheet">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>التقرير من:</strong> {startDate} <strong>إلى:</strong> {endDate}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
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

        {/* Balance Discrepancy Warning */}
        {hasDiscrepancy && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg no-print">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-bold text-yellow-800">
                  تحذير: عدم توازن في قائمة المركز المالي
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  الفرق بين إجمالي الأصول وإجمالي الالتزامات وحقوق الملكية:{" "}
                  {formatNumber(discrepancy)}
                </p>
                <p className="text-sm text-yellow-700">
                  إجمالي الأصول: {formatNumber(displayData.totalAssets)} |{" "}
                  إجمالي الالتزامات وحقوق الملكية:{" "}
                  {formatNumber(displayData.totalLiabilitiesAndEquity)}
                </p>
              </div>
            </div>
          </div>
        )}

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
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.cashInSafes)}`}>
                  {formatNumber(displayData.cashInSafes)}
                </Td>
              </tr>
              <tr>
                <Td>النقدية بالبنوك</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.cashInBanks)}`}>
                  {formatNumber(displayData.cashInBanks)}
                </Td>
              </tr>
              <tr>
                <Td>الذمم المدينة (العملاء)</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.receivables)}`}>
                  {formatNumber(displayData.receivables)}
                </Td>
              </tr>
              <tr>
                <Td>أرصدة مدينة اخري</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.otherReceivables)}`}>
                  {formatNumber(displayData.otherReceivables)}
                </Td>
              </tr>
              <tr>
                <Td>المخزون</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.inventory)}`}>
                  {formatNumber(displayData.inventory)}
                </Td>
              </tr>
              <tr
                className={`font-bold text-brand-dark ${
                  hasDiscrepancy ? "bg-yellow-100" : "bg-blue-100"
                }`}
              >
                <Td>إجمالي الأصول</Td>
                <Td className={`text-left font-mono text-lg ${getNegativeNumberClass(displayData.totalAssets)}`}>
                  {formatNumber(displayData.totalAssets)}
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
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.payables)}`}>
                  {formatNumber(displayData.payables)}
                </Td>
              </tr>
              <tr>
                <Td>أرصدة دائنة اخري</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.otherPayables)}`}>
                  {formatNumber(displayData.otherPayables)}
                </Td>
              </tr>
              <tr>
                <Td>ضريبة القيمة المضافة المستحقة</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.vatPayable)}`}>
                  {formatNumber(displayData.vatPayable)}
                </Td>
              </tr>
              <tr className="font-bold bg-red-100 text-red-800">
                <Td>إجمالي الالتزامات</Td>
                <Td className={`text-left font-mono text-lg ${getNegativeNumberClass(displayData.totalLiabilities)}`}>
                  {formatNumber(displayData.totalLiabilities)}
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
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.capital)}`}>
                  {formatNumber(displayData.capital)}
                </Td>
              </tr>
              <tr>
                <Td>جاري الشركاء</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.partnersBalance)}`}>
                  {formatNumber(displayData.partnersBalance)}
                </Td>
              </tr>
              <tr>
                <Td>الأرباح المحتجزة (أرباح الفترة)</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.retainedEarnings)}`}>
                  {formatNumber(displayData.retainedEarnings)}
                </Td>
              </tr>
              <tr className="font-bold bg-green-100 text-green-800">
                <Td>إجمالي حقوق الملكية</Td>
                <Td className={`text-left font-mono text-lg ${getNegativeNumberClass(displayData.totalEquity)}`}>
                  {formatNumber(displayData.totalEquity)}
                </Td>
              </tr>

              {/* Total Liabilities & Equity */}
              <tr
                className={`font-bold text-white text-lg ${
                  hasDiscrepancy ? "bg-yellow-600" : "bg-gray-700"
                }`}
              >
                <Td>إجمالي الالتزامات وحقوق الملكية</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.totalLiabilitiesAndEquity)}`}>
                  {formatNumber(displayData.totalLiabilitiesAndEquity)}
                </Td>
              </tr>
              {/* Balance Check Row */}
              {hasDiscrepancy && (
                <tr className="bg-red-100">
                  <Td className="text-red-800 font-bold">
                    ⚠️ الفرق (عدم التوازن)
                  </Td>
                  <Td className="text-left font-mono text-red-800 font-bold">
                    {formatNumber(discrepancy)}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;