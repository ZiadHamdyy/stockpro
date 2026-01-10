import React, { useMemo, useState, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Supplier,
  Invoice,
  Voucher,
  Branch,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal, exportToExcel } from "../../../../utils/formatting";
import { useGetSuppliersQuery } from "../../../store/slices/supplier/supplierApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange, formatDate } from "../dateUtils";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";

interface SupplierBalanceReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const SupplierBalanceReport: React.FC<SupplierBalanceReportProps> = ({
  title,
  companyInfo,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;

  // API hooks
  const { data: apiSuppliers = [], isLoading: suppliersLoading } =
    useGetSuppliersQuery(undefined);
  const { data: apiPurchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [], isLoading: purchaseReturnsLoading } =
    useGetPurchaseReturnsQuery(undefined);
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { 
    data: apiReceiptVouchers = [], 
    isLoading: receiptVouchersLoading,
  } = useGetReceiptVouchersQuery(undefined, { skip });
  const { 
    data: apiPaymentVouchers = [], 
    isLoading: paymentVouchersLoading,
  } = useGetPaymentVouchersQuery(undefined, { skip });
  
  // Use API vouchers if authenticated and API is being used, otherwise fall back to props
  const rawReceiptVouchers = isAuthed ? apiReceiptVouchers : (propReceiptVouchers || []);
  const rawPaymentVouchers = isAuthed ? apiPaymentVouchers : (propPaymentVouchers || []);

  // Transform API data to match expected format
  const suppliers = useMemo(() => {
    return (apiSuppliers as any[]).map((supplier) => ({
      ...supplier,
      // Add any necessary transformations here
    }));
  }, [apiSuppliers]);

  const purchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      // Transform nested supplier data - API uses 'supplier' field
      customerOrSupplier: invoice.supplier
        ? {
            id: invoice.supplier.id.toString(),
            name: invoice.supplier.name,
          }
        : invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
      // Transform totals structure - API uses direct fields, not nested totals object
      totals: invoice.totals || {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
    }));
  }, [apiPurchaseInvoices]);

  const purchaseReturns = useMemo(() => {
    return (apiPurchaseReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested supplier data - API uses 'supplier' field
      customerOrSupplier: returnInvoice.supplier
        ? {
            id: returnInvoice.supplier.id.toString(),
            name: returnInvoice.supplier.name,
          }
        : returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
      // Transform totals structure - API uses direct fields, not nested totals object
      totals: returnInvoice.totals || {
        subtotal: returnInvoice.subtotal || 0,
        discount: returnInvoice.discount || 0,
        tax: returnInvoice.tax || 0,
        net: returnInvoice.net || 0,
      },
    }));
  }, [apiPurchaseReturns]);

  // Helper function to normalize dates to YYYY-MM-DD format
  const normalizeDate = useMemo(() => {
    return (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // If it's an ISO string, extract the date part
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // Try to parse as Date if it's a string that looks like a date
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return "";
    };
  }, []);

  // Transform vouchers to match expected structure
  const receiptVouchers = useMemo(() => {
    return rawReceiptVouchers.map((voucher: any) => {
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName || "",
      };
      
      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawReceiptVouchers, normalizeDate]);

  const paymentVouchers = useMemo(() => {
    return rawPaymentVouchers.map((voucher: any) => {
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName || "",
      };
      
      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawPaymentVouchers, normalizeDate]);

  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
      // Add any necessary transformations here
    }));
  }, [apiBranches]);

  const isLoading =
    suppliersLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    branchesLoading ||
    receiptVouchersLoading ||
    paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reportData, setReportData] = useState<any[]>([]);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const handleViewReport = useCallback(() => {
    const toNumber = (value: any): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    
    const supplierBalanceData = suppliers.map((supplier) => {
      const supplierIdStr = supplier.id.toString();
      const supplierId = supplier.id;

      // Calculate opening balance up to start date
      const openingPurchases = purchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < startDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingCashPurchases = purchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < startDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingReturns = purchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < startDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingCashReturns = purchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < startDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingPayments = paymentVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate < startDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const openingReceipts = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate < startDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = supplier.openingBalance + openingDebit - openingCredit
      // Debit (decreases what we owe): cash purchases, all purchase returns, payment vouchers
      // Credit (increases what we owe): all purchase invoices, cash purchase returns, receipt vouchers (refunds from supplier)
      const openingDebit = openingCashPurchases + openingReturns + openingPayments;
      const openingCredit = openingPurchases + openingCashReturns + openingReceipts;
      const opening = (supplier.openingBalance || 0) + openingDebit - openingCredit;

      // Calculate period transactions (between start and end date)
      const periodPurchases = purchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= startDate && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodCashPurchases = purchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= startDate && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodReturns = purchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= startDate && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodCashReturns = purchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= startDate && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodPayments = paymentVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate >= startDate && vDate <= endDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const periodReceipts = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate >= startDate && vDate <= endDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      // Period Debit: cash purchases, all purchase returns, payment vouchers (all decrease what we owe)
      const totalDebit = periodCashPurchases + periodReturns + periodPayments;
      // Period Credit: all purchase invoices, cash purchase returns, receipt vouchers (all increase what we owe)
      const totalCredit = periodPurchases + periodCashReturns + periodReceipts;
      // Balance = Opening Balance (at start date) + Period Debit - Period Credit
      const balance = opening + totalDebit - totalCredit;

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        opening,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      };
    });
    setReportData(supplierBalanceData);
  }, [
    suppliers,
    purchaseInvoices,
    purchaseReturns,
    paymentVouchers,
    receiptVouchers,
    startDate,
    endDate,
    normalizeDate,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const filteredReportData = useMemo(() => {
    if (hideZeroBalance) {
      return reportData.filter((item) => Math.abs(item.balance) > 0.01);
    }
    return reportData;
  }, [reportData, hideZeroBalance]);

  const totals = filteredReportData.reduce(
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
    "p-2 bg-brand-green-bg border-2 border-brand-green rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green";

  const handleExcelExport = () => {
    const dataToExport = [
      ...filteredReportData.map((item) => ({
        "كود المورد": item.code,
        "اسم المورد": item.name,
        "رصيد أول المدة": formatNumber(item.opening),
        "إجمالي مدين": formatNumber(item.debit),
        "إجمالي دائن": formatNumber(item.credit),
        "الرصيد الحالي": formatNumber(item.balance),
      })),
      {
        "كود المورد": "الإجمالي",
        "اسم المورد": "",
        "رصيد أول المدة": formatNumber(totals.opening),
        "إجمالي مدين": formatNumber(totals.debit),
        "إجمالي دائن": formatNumber(totals.credit),
        "الرصيد الحالي": formatNumber(totals.balance),
      },
    ];
    exportToExcel(dataToExport, "تقرير_رصيد_الموردين");
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
                    .bg-brand-green { background-color: #059669 !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-green { color: #059669 !important; }
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

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
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
          <div className="space-y-2 text-right">
            <p className="text-base text-gray-700">
              <span className="font-semibold text-gray-800">تاريخ التقرير:</span> {formatDate(new Date())}
            </p>
            <p className="text-base text-gray-700">
              <span className="font-semibold text-gray-800">الفترة:</span> من {formatDate(startDate)} إلى {formatDate(endDate)}
            </p>
          </div>
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
            <label className="font-semibold">من تاريخ:</label>
            <input
              type="date"
              className={inputStyle}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">الرصيد حتى تاريخ:</label>
            <input
              type="date"
              className={inputStyle}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              onClick={handleViewReport}
              className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideZeroBalance}
                onChange={(e) => setHideZeroBalance(e.target.checked)}
                className="w-4 h-4 text-brand-green border-2 border-gray-300 rounded focus:ring-2 focus:ring-brand-green"
              />
              <span className="font-semibold text-gray-700">إخفاء الموردين برصيد صفر</span>
            </label>
          </div>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SUPPLIER_BALANCE_REPORT,
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

        <div className="overflow-x-auto border-2 border-brand-green rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-green">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود المورد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-64">
                  اسم المورد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رصيد أول المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-green-200 uppercase">
                  إجمالي مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  إجمالي دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد الحالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReportData.map((item) => (
                <tr key={item.id} className="hover:bg-brand-green-bg">
                  <td className="px-6 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-64">
                    {item.name}
                  </td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.opening)}`}>
                    {formatNumber(item.opening)}
                  </td>
                  <td className="px-6 py-4 text-green-600">
                    {formatNumber(item.debit)}
                  </td>
                  <td className="px-6 py-4 text-red-600">
                    {item.credit > 0 ? formatNumber(item.credit) : "0.00"}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-green text-white">
              <tr className="font-bold">
                <td colSpan={2} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totals.opening)}`}>
                  {formatNumber(totals.opening)}
                </td>
                <td className="px-6 py-3 text-right text-green-200">
                  {formatNumber(totals.debit)}
                </td>
                <td className="px-6 py-3 text-right text-red-200">
                  {formatNumber(totals.credit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totals.balance)}`}>
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

export default SupplierBalanceReport;
