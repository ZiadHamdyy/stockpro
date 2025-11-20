import React, { useState, useMemo } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import { formatNumber } from "../../../utils/formatting";
import { useIncomeStatement } from "../../hook/useIncomeStatement";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useGetExpenseTypesQuery } from "../../store/slices/expense/expenseApiSlice";

const IncomeStatement: React.FC = () => {
  const title = "قائمة الدخل";
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

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
    'مصروفات ادارية', // Handle both spellings (إ vs ا)
    'مصروفات عمومية',
    'مصروفات أخري',
    'مصروفات اخري', // Handle both spellings
  ];

  // Get expense types in the same order as they were originally displayed
  const sortedExpenseTypes = useMemo(() => {
    return [...expenseTypes].sort((a, b) => {
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
        
        return 999; // Not found in order list, put at end
      };
      
      const indexA = getOrderIndex(a.name);
      const indexB = getOrderIndex(b.name);
      
      // Sort by their position in the order list
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      
      // If same order position, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [expenseTypes]);

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
    "p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg focus:outline-none focus:ring-2 focus:ring-brand-blue";
  const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
    children,
    className,
    ...props
  }) => (
    <td className={`p-3 ${className || ""}`} {...props}>
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
        <ReportHeader title={title} companyInfo={companyInfo} />

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
            <PermissionWrapper requiredPermission="income_statement:read">
              <button
                title="تصدير Excel"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <ExcelIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper requiredPermission="income_statement:read">
              <button
                title="تصدير PDF"
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PdfIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
            <PermissionWrapper requiredPermission="income_statement:read">
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

        <div className="overflow-x-auto border-2 border-brand-blue rounded-lg mt-4">
          <table className="min-w-full text-base">
            <thead>
              <tr className="bg-brand-blue-bg">
                <th className="p-3 text-right font-bold text-brand-dark w-3/5">
                  البيان
                </th>
                <th className="p-3 text-left font-bold text-brand-dark">
                  جزئي
                </th>
                <th className="p-3 text-left font-bold text-brand-dark">كلي</th>
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
                <Td className="font-mono text-left">
                  {formatNumber(financialData.totalSales)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) مرتجع المبيعات</Td>
                <Td className="font-mono text-left text-red-600">
                  ({formatNumber(financialData.totalSalesReturns)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>صافي المبيعات</Td>
                <Td></Td>
                <Td className="font-mono text-left text-lg">
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
                <Td className="font-mono text-left">
                  {formatNumber(financialData.beginningInventory)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td>(+) صافي المشتريات</Td>
                <Td className="font-mono text-left">
                  {formatNumber(financialData.netPurchases)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) رصيد مخزون آخر المدة</Td>
                <Td className="font-mono text-left text-red-600">
                  ({formatNumber(financialData.endingInventory)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>تكلفة البضاعة المباعة</Td>
                <Td></Td>
                <Td className="font-mono text-left text-lg text-red-600">
                  ({formatNumber(financialData.cogs)})
                </Td>
              </tr>

              <tr className="font-bold text-xl bg-green-100 text-green-800">
                <Td>مجمل الربح</Td>
                <Td></Td>
                <Td className="font-mono text-left">
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
                    <Td className="font-mono text-left text-red-600">
                      ({formatNumber(expenseAmount)})
                    </Td>
                    <Td></Td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-gray-100">
                <Td>إجمالي المصروفات</Td>
                <Td></Td>
                <Td className="font-mono text-left text-lg text-red-600">
                  ({formatNumber(financialData.totalExpenses)})
                </Td>
              </tr>

              <tr
                className={`font-bold text-2xl text-white ${financialData.netProfit >= 0 ? "bg-brand-green" : "bg-red-600"}`}
              >
                <Td>صافي الربح / (الخسارة)</Td>
                <Td></Td>
                <Td className="font-mono text-left">
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
