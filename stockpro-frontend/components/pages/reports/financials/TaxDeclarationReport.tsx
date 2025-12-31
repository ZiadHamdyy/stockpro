import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { CompanyInfo, Branch, User, Invoice } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import { formatNumber, getNegativeNumberClass, exportToExcel } from "../../../../utils/formatting";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { getCurrentYearRange } from "../dateUtils";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";
import { useUserPermissions } from "../../../hook/usePermissions";

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

// Helper function to get quarter dates
const getQuarterDates = (quarter: string, year: number): { start: string; end: string } => {
  switch (quarter) {
    case "Q1":
      return {
        start: `${year}-01-01`,
        end: `${year}-03-31`,
      };
    case "Q2":
      return {
        start: `${year}-04-01`,
        end: `${year}-06-30`,
      };
    case "Q3":
      return {
        start: `${year}-07-01`,
        end: `${year}-09-30`,
      };
    case "Q4":
      return {
        start: `${year}-10-01`,
        end: `${year}-12-31`,
      };
    default:
      return {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      };
  }
};

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
  const { hasPermission } = useUserPermissions();
  
  // Check if user has SEARCH permission to view all branches
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.TAX_DECLARATION_REPORT, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
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
  const { data: apiPaymentVouchers = [], isLoading: paymentVouchersLoading } =
    useGetPaymentVouchersQuery(undefined);

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
  
  // Get current user's branch ID
  const userBranchId = useMemo(() => getUserBranchId(currentUser), [currentUser]);
  
  // Get user's branch name
  const userBranchName = useMemo(() => {
    if (!userBranchId) return "";
    return branches.find(b => b.id === userBranchId)?.name || "";
  }, [userBranchId, branches]);

  const isLoading =
    salesInvoicesLoading ||
    salesReturnsLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    branchesLoading ||
    paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  // Quarter selection state
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  
  // Branch filter state - default based on permission
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    // Compute initial value based on permission check
    const hasSearchPermission = hasPermission(
      buildPermission(Resources.TAX_DECLARATION_REPORT, Actions.SEARCH),
    );
    return hasSearchPermission ? "" : "";
  });
  
  // Sync selectedBranch when permission changes or branches load
  useEffect(() => {
    if (!canSearchAllBranches && branches.length > 0 && userBranchName) {
      // If user doesn't have permission, always set to current branch name
      if (selectedBranch !== userBranchName) {
        setSelectedBranch(userBranchName);
      }
    } else if (!canSearchAllBranches && !userBranchName && selectedBranch !== "") {
      setSelectedBranch("");
    }
  }, [canSearchAllBranches, userBranchName, selectedBranch, branches]);

  // Update dates when quarter is selected
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    if (selectedQuarter) {
      const quarterDates = getQuarterDates(selectedQuarter, currentYear);
      setStartDate(quarterDates.start);
      setEndDate(quarterDates.end);
    } else {
      // Reset to full year when no quarter is selected
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
    }
  }, [selectedQuarter]);
  const [reportData, setReportData] = useState({
    salesSubtotal: 0,
    salesTax: 0,
    returnsSubtotal: 0,
    returnsTax: 0,
    purchasesSubtotal: 0,
    purchasesTax: 0,
    purchasesValue: 0,
    purchaseReturnsSubtotal: 0,
    purchaseReturnsTax: 0,
    outputVat: 0,
    inputVat: 0,
    netVat: 0,
  });

  const handleViewReport = useCallback(() => {
    // Helper function to normalize dates to YYYY-MM-DD format
    const normalizeDate = (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().substring(0, 10);
      }
      return "";
    };

    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const filterByBranch = (inv: Invoice) =>
      !selectedBranch || inv.branchName === selectedBranch;
    const filterByDate = (inv: Invoice) => {
      const invDate = normalizeDate(inv.date);
      return invDate >= normalizedStartDate && invDate <= normalizedEndDate;
    };

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

    // Filter payment vouchers (expense-Type only) by date and branch
    // Only include "expense-Type" vouchers, exclude regular "expense" vouchers
    const filteredExpenses = (apiPaymentVouchers as any[])
      .filter((v) => {
        const voucherDate = new Date(v.date).toISOString().substring(0, 10);
        const dateMatch = voucherDate >= startDate && voucherDate <= endDate;
        const branchMatch = !selectedBranch || 
          (v.branch?.name === selectedBranch) ||
          (branches.find((b) => b.id === v.branchId)?.name === selectedBranch);
        // Only include "expense-Type" payment vouchers with expense codes
        return dateMatch && branchMatch && v.entityType === "expense-Type" && v.expenseCodeId;
      });

    // Get VAT settings from company info
    const isVatEnabled = companyInfo.isVatEnabled || false;
    const vatRate = isVatEnabled && companyInfo.vatRate ? companyInfo.vatRate / 100 : 0;

    const salesSubtotal = filteredSales.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    // Calculate tax as: VAT rate * sales subtotal (only if VAT is enabled)
    const salesTax = isVatEnabled ? salesSubtotal * vatRate : 0;

    const returnsSubtotal = filteredReturns.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    // Calculate tax as: VAT rate * returns subtotal (only if VAT is enabled)
    const returnsTax = isVatEnabled ? returnsSubtotal * vatRate : 0;

    // 1. Purchase invoices subtotal (before tax) from search date
    const purchasesSubtotal = filteredPurchases.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );

    // 2. Total tax from purchase invoices (actual recorded VAT)
    const purchaseInvoicesTax = filteredPurchases.reduce(
      (sum, inv) => sum + (inv.tax || 0),
      0,
    );

    // 3. Total taxable expenses (payment vouchers tagged with expense codes)
    // Use priceBeforeTax if available (for expense-Type vouchers), otherwise use amount
    const taxableExpensesTotal = filteredExpenses.reduce(
      (sum, v) => sum + ((v.priceBeforeTax ?? v.amount) || 0),
      0,
    );
    
    // 4. Calculate expense tax (taxPrice from vouchers, or amount - priceBeforeTax if taxPrice not available)
    const expenseTax = filteredExpenses.reduce(
      (sum, v) => {
        if (v.taxPrice !== null && v.taxPrice !== undefined) {
          return sum + (v.taxPrice || 0);
        }
        // Fallback: calculate tax as amount - priceBeforeTax if taxPrice is not available
        const amount = v.amount || 0;
        const priceBeforeTax = v.priceBeforeTax ?? amount;
        return sum + (amount - priceBeforeTax);
      },
      0,
    );
    
    // 5. Purchase tax column = invoice VAT + expense tax
    const purchasesTax = purchaseInvoicesTax + expenseTax;
    
    // 6. Calculate purchases value: Purchases before tax + Taxable expenses
    const purchasesValue = purchasesSubtotal + taxableExpensesTotal;

    // 7. Purchase returns subtotal (before tax) from search date
    const purchaseReturnsSubtotal = filteredPurchaseReturns.reduce(
      (sum, inv) => sum + (inv.subtotal || 0),
      0,
    );
    
    // 8. Calculate purchase returns tax as: VAT rate * purchase returns subtotal
    const purchaseReturnsTax = purchaseReturnsSubtotal * vatRate;

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
      purchasesValue,
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
    apiPaymentVouchers,
    branches,
    companyInfo,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const handleExcelExport = () => {
    const dataToExport = [
      {
        البند: "المبيعات",
        "القيمة بدون ضريبة": formatNumber(reportData.salesSubtotal),
        "قيمة الضريبة": formatNumber(reportData.salesTax),
      },
      {
        البند: "مرتجعات المبيعات",
        "القيمة بدون ضريبة": formatNumber(reportData.returnsSubtotal),
        "قيمة الضريبة": formatNumber(reportData.returnsTax),
      },
      {
        البند: "المشتريات",
        "القيمة بدون ضريبة": formatNumber(reportData.purchasesSubtotal),
        "قيمة الضريبة": formatNumber(reportData.purchasesTax),
      },
      {
        البند: "مرتجعات المشتريات",
        "القيمة بدون ضريبة": formatNumber(reportData.purchaseReturnsSubtotal),
        "قيمة الضريبة": formatNumber(reportData.purchaseReturnsTax),
      },
      {
        البند: "ضريبة المخرجات (المبيعات)",
        "القيمة بدون ضريبة": "",
        "قيمة الضريبة": formatNumber(reportData.outputVat),
      },
      {
        البند: "ضريبة المدخلات (المشتريات)",
        "القيمة بدون ضريبة": "",
        "قيمة الضريبة": formatNumber(reportData.inputVat),
      },
      {
        البند: "صافي الضريبة المستحقة",
        "القيمة بدون ضريبة": "",
        "قيمة الضريبة": formatNumber(reportData.netVat),
      },
    ];
    exportToExcel(dataToExport, "إقرار_ضريبي");
  };

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
                body { font-family: "Cairo", sans-serif; direction: rtl; font-size: 14px; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                table { font-size: 13px; }
                th { font-size: 13px; font-weight: bold; }
                td { font-size: 13px; }
                @page {
                    @bottom-center {
                        content: counter(page) " / " counter(pages);
                        font-family: "Cairo", sans-serif;
                        font-size: 12px;
                        color: #1F2937;
                    }
                }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-row-group !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
                    th { font-size: 13px !important; font-weight: bold !important; padding: 6px 8px !important; }
                    td { font-size: 13px !important; padding: 6px 8px !important; }
                    tbody tr:first-child { background: #FFFFFF !important; }
                    tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
                    tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
                    tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-red-600 { color: #DC2626 !important; }
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
                    .justify-end { justify-content: flex-end !important; }
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
        <ReportHeader title={title} />
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranch || "جميع الفروع"}
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
          <div className="flex items-center gap-4 flex-wrap">
            <select
              className={inputStyle}
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
            >
              <option value="">اختر الربع</option>
              <option value="Q1">الربع الأول</option>
              <option value="Q2">الربع الثاني</option>
              <option value="Q3">الربع الثالث</option>
              <option value="Q4">الربع الرابع</option>
            </select>
            <select
              className={inputStyle}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!canSearchAllBranches}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
              {!canSearchAllBranches && !branches.find(b => b.name === selectedBranch) && userBranchName && (
                <option value={userBranchName}>
                  {userBranchName}
                </option>
              )}
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
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.TAX_DECLARATION_REPORT,
              Actions.PRINT,
            )}
            fallback={
              <div className="no-print flex items-center gap-2">
            <button
              title="تصدير Excel"
              disabled
              className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
            <button
              title="تصدير PDF"
              disabled
              className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
            <button
              title="طباعة"
              disabled
              className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
              </div>
            }
          >
            <div className="no-print flex items-center gap-2">
              <button
                onClick={handleExcelExport}
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
          </PermissionWrapper>
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
                  القيمة
                </th>
                <th className="px-4 py-3 text-right font-semibold uppercase">
                  ضريبة القيمة المضافة ({companyInfo.vatRate || 0}%)
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
                <td className={`px-4 py-3 ${getNegativeNumberClass(reportData.purchasesValue)}`}>
                  {formatNumber(reportData.purchasesValue)}
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
