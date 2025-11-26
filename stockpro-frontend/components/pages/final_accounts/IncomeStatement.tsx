import React, { useState, useMemo } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import {
  formatNumber,
  getNegativeNumberClass,
  exportToExcel,
  exportToPdf,
} from "../../../utils/formatting";
import { useIncomeStatement } from "../../hook/useIncomeStatement";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useGetExpenseTypesQuery } from "../../store/slices/expense/expenseApiSlice";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

type StatementRow = {
  statement: string;
  partial?: number | null;
  total?: number | null;
};

const asNegative = (value: number): number => (value === 0 ? 0 : -Math.abs(value));

const IncomeStatement: React.FC = () => {
  const title = "قائمة الدخل";
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const {
    data: financialData,
    companyInfo,
    isLoading,
    error,
  } = useIncomeStatement(startDate, endDate);

  // Fetch expense types to display dynamically
  const { data: expenseTypes = [] } = useGetExpenseTypesQuery();

  // Define the original order of expense types as they were hardcoded
  const expenseTypeOrder = [
    'مصروفات تشغيلية',
    'مصروفات تسويقية',
    'مصروفات إدارية',
    'مصروفات عمومية',
    'مصروفات أخري',
  ];

  // Get expense types in the same order as they were originally displayed
  // Only include expense types that match the expenseTypeOrder array
  const sortedExpenseTypes = useMemo(() => {
    const getOrderIndex = (name: string): number => {
      // Normalize name for comparison (handle both spellings)
      const normalizedName = name
        .replace(/[إا]دارية/g, 'ادارية')
        .replace(/[أا]خري/g, 'اخري');
      
      // Try exact match first
      for (let i = 0; i < expenseTypeOrder.length; i++) {
        const normalizedOrder = expenseTypeOrder[i]
          .replace(/[إا]دارية/g, 'ادارية')
          .replace(/[أا]خري/g, 'اخري');
        if (normalizedName === normalizedOrder || name === expenseTypeOrder[i]) {
          return i;
        }
      }
      
      // Try partial match (includes check)
      for (let i = 0; i < expenseTypeOrder.length; i++) {
        const normalizedOrder = expenseTypeOrder[i]
          .replace(/[إا]دارية/g, 'ادارية')
          .replace(/[أا]خري/g, 'اخري');
        if (normalizedName.includes(normalizedOrder) || normalizedOrder.includes(normalizedName)) {
          return i;
        }
      }
      
      return -1; // Not found in order list
    };
    
    // Filter to only include expense types that match the order list
    return [...expenseTypes]
      .filter((expenseType) => getOrderIndex(expenseType.name) !== -1)
      .sort((a, b) => {
        const indexA = getOrderIndex(a.name);
        const indexB = getOrderIndex(b.name);
        
        // Sort by their position in the order list
        return indexA - indexB;
      });
  }, [expenseTypes]);

  const statementRows = useMemo<StatementRow[]>(() => {
    if (!financialData) return [];

    const rows: StatementRow[] = [];
    const addRow = (
      statement: string,
      partial?: number | null,
      total?: number | null,
    ) => rows.push({ statement, partial, total });

    addRow("الإيرادات");
    addRow("إجمالي المبيعات", financialData.totalSales);
    addRow("(-) مرتجع المبيعات", asNegative(financialData.totalSalesReturns));
    addRow("صافي المبيعات", undefined, financialData.netSales);

    addRow("تكلفة البضاعة المباعة");
    addRow("رصيد مخزون أول المدة", financialData.beginningInventory);
    addRow("(+) صافي المشتريات", financialData.netPurchases);
    addRow(
      "(-) رصيد مخزون آخر المدة",
      asNegative(financialData.endingInventory),
    );
    addRow(
      "تكلفة البضاعة المباعة",
      undefined,
      asNegative(financialData.cogs),
    );

    addRow("مجمل الربح", undefined, financialData.grossProfit);

    addRow("المصروفات");
    sortedExpenseTypes.forEach((expenseType) => {
      const expenseAmount =
        financialData.expensesByType?.[expenseType.name] || 0;
      addRow(expenseType.name, asNegative(expenseAmount));
    });

    addRow(
      "إجمالي المصروفات",
      undefined,
      asNegative(financialData.totalExpenses),
    );

    addRow("صافي الربح / (الخسارة)", undefined, financialData.netProfit);

    return rows;
  }, [financialData, sortedExpenseTypes]);

  const formatExportValue = (value?: number | null): string => {
    if (value === null || value === undefined) return "";
    const absolute = formatNumber(Math.abs(value));
    return value < 0 ? `(${absolute})` : absolute;
  };

  const exportFileName = useMemo(
    () => `قائمة-الدخل-${startDate}-الى-${endDate}`.replace(/\s+/g, "-"),
    [startDate, endDate],
  );

  const handleExcelExport = () => {
    if (!statementRows.length) return;
    const data = statementRows.map((row) => ({
      البيان: row.statement,
      جزئي: formatExportValue(row.partial),
      كلي: formatExportValue(row.total),
    }));
    exportToExcel(data, exportFileName);
  };

  const handlePdfExport = async () => {
    if (!statementRows.length || !companyInfo) return;
    const head = [["البيان", "جزئي", "كلي"]];
    const body = statementRows.map((row) => [
      row.statement,
      formatExportValue(row.partial),
      formatExportValue(row.total),
    ]);
    const pdfTitle = `${title} (${startDate} - ${endDate})`;
    await exportToPdf(pdfTitle, head, body, exportFileName, companyInfo);
  };

  const handlePrint = () => {
    const reportContent = document.getElementById("printable-area-income");
    if (!reportContent) return;
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow?.document.write("<html><head><title>طباعة التقرير</title>");
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(
      `<style>body { font-family: "Cairo", sans-serif; direction: rtl; } @media print { body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } .no-print { display: none !important; } table { width: 100%; border-collapse: collapse; } .bg-brand-blue { background-color: #1E40AF !important; } .text-white { color: white !important; } .bg-gray-100 { background-color: #F9FAFB !important; } .bg-blue-100 { background-color: #DBEAFE !important; } .bg-green-100 { background-color: #D1FAE5 !important; } .bg-brand-green { background-color: #16A34A !important; } .text-green-800 { color: #166534 !important; } .bg-red-600 { background-color: #DC2626 !important; } }</style>`,
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

  const inputStyle =
    "p-1.5 border border-brand-blue rounded bg-brand-blue-bg focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm";
  const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
    children,
    className,
    ...props
  }) => (
    <td className={`px-2 py-2 text-sm ${className || ""}`} {...props}>
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
  if (error || !financialData || !companyInfo) {
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
      <div id="printable-area-income">
        <ReportHeader title={title} />

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4">
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
          </div>
          <div className="flex items-center gap-2">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.INCOME_STATEMENT,
                Actions.READ,
              )}
            >
              <button
                onClick={handleExcelExport}
                title="تصدير Excel"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <ExcelIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.INCOME_STATEMENT,
                Actions.READ,
              )}
            >
              <button
                onClick={handlePdfExport}
                title="تصدير PDF"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PdfIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.INCOME_STATEMENT,
                Actions.READ,
              )}
            >
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

        <div className="overflow-x-auto border border-brand-blue rounded-lg mt-3">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-blue-bg text-sm">
                <th className="px-2 py-2 text-right font-semibold text-brand-dark w-3/5">
                  البيان
                </th>
                <th className="px-2 py-2 text-left font-semibold text-brand-dark">
                  جزئي
                </th>
                <th className="px-2 py-2 text-left font-semibold text-brand-dark">
                  كلي
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              <tr className="bg-blue-100 font-bold text-brand-dark">
                <Td colSpan={3} className="text-lg">
                  الإيرادات
                </Td>
              </tr>
              <tr>
                <Td>إجمالي المبيعات</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.totalSales)}`}>
                  {formatNumber(financialData.totalSales)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) مرتجع المبيعات</Td>
                <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(financialData.totalSalesReturns)}`}>
                  ({formatNumber(financialData.totalSalesReturns)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>صافي المبيعات</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg ${getNegativeNumberClass(financialData.netSales)}`}>
                  {formatNumber(financialData.netSales)}
                </Td>
              </tr>

              <tr className="bg-blue-100 font-bold text-brand-dark">
                <Td colSpan={3} className="text-lg">
                  تكلفة البضاعة المباعة
                </Td>
              </tr>
              <tr>
                <Td>رصيد مخزون أول المدة</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.beginningInventory)}`}>
                  {formatNumber(financialData.beginningInventory)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td>(+) صافي المشتريات</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.netPurchases)}`}>
                  {formatNumber(financialData.netPurchases)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) رصيد مخزون آخر المدة</Td>
                <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(financialData.endingInventory)}`}>
                  ({formatNumber(financialData.endingInventory)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>تكلفة البضاعة المباعة</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg text-red-600 ${getNegativeNumberClass(financialData.cogs)}`}>
                  ({formatNumber(financialData.cogs)})
                </Td>
              </tr>

              <tr className="font-bold text-xl bg-green-100 text-green-800">
                <Td>مجمل الربح</Td>
                <Td></Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.grossProfit)}`}>
                  {formatNumber(financialData.grossProfit)}
                </Td>
              </tr>

              <tr className="bg-blue-100 font-bold text-brand-dark">
                <Td colSpan={3} className="text-lg">
                  المصروفات
                </Td>
              </tr>
              {sortedExpenseTypes.map((expenseType) => {
                const expenseAmount =
                  financialData?.expensesByType?.[expenseType.name] || 0;
                return (
                  <tr key={expenseType.id}>
                    <Td>{expenseType.name}</Td>
                    <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(expenseAmount)}`}>
                      ({formatNumber(expenseAmount)})
                    </Td>
                    <Td></Td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-gray-100">
                <Td>إجمالي المصروفات</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg text-red-600 ${getNegativeNumberClass(financialData.totalExpenses)}`}>
                  ({formatNumber(financialData.totalExpenses)})
                </Td>
              </tr>

              <tr
                className={`font-bold text-2xl text-white ${financialData.netProfit >= 0 ? "bg-brand-green" : "bg-red-200"}`}
              >
                <Td>صافي الربح / (الخسارة)</Td>
                <Td></Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.netProfit)}`}>
                  {formatNumber(financialData.netProfit)}
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
