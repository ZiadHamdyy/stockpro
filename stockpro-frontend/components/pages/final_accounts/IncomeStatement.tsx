import React, { useState, useMemo, useCallback } from "react";
import type {
  CompanyInfo,
  Invoice,
  Item,
  Voucher,
  ExpenseCode,
  StoreReceiptVoucher,
  StoreIssueVoucher,
} from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import { formatNumber } from "../../../utils/formatting";

interface IncomeStatementProps {
  title: string;
  companyInfo: CompanyInfo;
  salesInvoices: Invoice[];
  salesReturns: Invoice[];
  purchaseInvoices: Invoice[];
  purchaseReturns: Invoice[];
  items: Item[];
  paymentVouchers: Voucher[];
  expenseCodes: ExpenseCode[];
  storeReceiptVouchers: StoreReceiptVoucher[];
  storeIssueVouchers: StoreIssueVoucher[];
}

const IncomeStatement: React.FC<IncomeStatementProps> = (props) => {
  const {
    title,
    companyInfo,
    salesInvoices,
    salesReturns,
    purchaseInvoices,
    purchaseReturns,
    items,
    paymentVouchers,
    expenseCodes,
    storeReceiptVouchers,
    storeIssueVouchers,
  } = props;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const getPreviousDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  };

  const calculateInventoryValue = useCallback(
    (targetDate: string): number => {
      if (!targetDate) return 0;
      let totalValue = 0;

      items.forEach((item) => {
        let balance = item.stock; // This is the opening stock at the beginning of the system's life.

        const allTransactions: any[] = [
          ...purchaseInvoices,
          ...salesReturns,
          ...storeReceiptVouchers,
          ...salesInvoices,
          ...purchaseReturns,
          ...storeIssueVouchers,
        ];

        const relevantTransactions = allTransactions.filter(
          (tx) =>
            tx.date < item.stock_date_placeholder && tx.date <= targetDate,
        );

        let stockChange = 0;
        relevantTransactions.forEach((tx) => {
          const factor =
            tx.type === "purchase_invoice" ||
            tx.type === "sales_return" ||
            tx.type === "store_receipt"
              ? 1
              : -1;
          (tx.items || []).forEach((txItem: any) => {
            if (txItem.id === item.code) {
              stockChange += txItem.qty * factor;
            }
          });
        });

        const finalBalance = balance + stockChange;
        totalValue += finalBalance * item.purchasePrice;
      });

      return totalValue > 0 ? totalValue : 0;
    },
    [
      items,
      purchaseInvoices,
      salesReturns,
      storeReceiptVouchers,
      salesInvoices,
      purchaseReturns,
      storeIssueVouchers,
    ],
  );

  const financialData = useMemo(() => {
    const filterByPeriod = (i: { date: string }) =>
      i.date >= startDate && i.date <= endDate;

    const totalSales = salesInvoices
      .filter(filterByPeriod)
      .reduce((sum, inv) => sum + inv.totals.subtotal, 0);
    const totalSalesReturns = salesReturns
      .filter(filterByPeriod)
      .reduce((sum, inv) => sum + inv.totals.subtotal, 0);
    const netSales = totalSales - totalSalesReturns;

    const beginningInventory = calculateInventoryValue(
      getPreviousDay(startDate),
    );
    const endingInventory = calculateInventoryValue(endDate);

    const totalPurchases = purchaseInvoices
      .filter(filterByPeriod)
      .reduce((sum, inv) => sum + inv.totals.subtotal, 0);
    const totalPurchaseReturns = purchaseReturns
      .filter(filterByPeriod)
      .reduce((sum, inv) => sum + inv.totals.subtotal, 0);
    const netPurchases = totalPurchases - totalPurchaseReturns;

    const cogs = beginningInventory + netPurchases - endingInventory;

    const grossProfit = netSales - cogs;

    const expenseVouchersInPeriod = paymentVouchers.filter(
      (v) => v.entity.type === "expense" && filterByPeriod(v),
    );

    const expensesByType = expenseVouchersInPeriod.reduce(
      (acc, voucher) => {
        const code = expenseCodes.find((c) => c.id == voucher.entity.id);
        const type = code?.type || "غير مصنف";
        acc[type] = (acc[type] || 0) + voucher.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const operatingExpenses = expensesByType["مصاريف تشغيلية"] || 0;
    const marketingExpenses = expensesByType["مصاريف تسويقية"] || 0;
    const adminAndGeneralExpenses =
      (expensesByType["مصاريف إدارية"] || 0) +
      (expensesByType["مصاريف عمومية"] || 0);
    const totalExpenses =
      operatingExpenses + marketingExpenses + adminAndGeneralExpenses;

    const netProfit = grossProfit - totalExpenses;

    return {
      totalSales,
      totalSalesReturns,
      netSales,
      beginningInventory,
      netPurchases,
      endingInventory,
      cogs,
      grossProfit,
      operatingExpenses,
      marketingExpenses,
      adminAndGeneralExpenses,
      totalExpenses,
      netProfit,
    };
  }, [
    startDate,
    endDate,
    salesInvoices,
    salesReturns,
    purchaseInvoices,
    purchaseReturns,
    paymentVouchers,
    expenseCodes,
    calculateInventoryValue,
  ]);

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
      `<style>body { font-family: "Cairo", sans-serif; direction: rtl; } @media print { body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } .no-print { display: none !important; } table { width: 100%; border-collapse: collapse; } .bg-brand-blue { background-color: #1E40AF !important; } .text-white { color: white !important; } .bg-gray-100 { background-color: #F9FAFB !important; } .bg-blue-100 { background-color: #DBEAFE !important; } .bg-green-100 { background-color: #D1FAE5 !important; } .bg-brand-green { background-color: #16A34A !important; } .bg-red-600 { background-color: #DC2626 !important; } }</style>`,
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
              <tr>
                <Td>مصروفات تشغيلية</Td>
                <Td className="font-mono text-left text-red-600">
                  ({formatNumber(financialData.operatingExpenses)})
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td>مصروفات تسويقية</Td>
                <Td className="font-mono text-left text-red-600">
                  ({formatNumber(financialData.marketingExpenses)})
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td>مصروفات إدارية وعمومية</Td>
                <Td className="font-mono text-left text-red-600">
                  ({formatNumber(financialData.adminAndGeneralExpenses)})
                </Td>
                <Td></Td>
              </tr>
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
