import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CompanyInfo,
  Supplier,
  User,
  Invoice,
  Voucher,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetSuppliersQuery } from "../../../store/slices/supplier/supplierApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";

interface SupplierStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  onNavigate: (
    pageKey: string,
    pageLabel: string,
    recordId: string | number,
  ) => void;
  currentUser: User | null;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
}

const SupplierStatementReport: React.FC<SupplierStatementReportProps> = ({
  title,
  companyInfo,
  onNavigate,
  currentUser,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
}) => {
  const navigate = useNavigate();
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

  const isLoading =
    suppliersLoading || purchaseInvoicesLoading || purchaseReturnsLoading || receiptVouchersLoading || paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const supplierRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  const filteredSuppliers = supplierQuery
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierQuery.toLowerCase()),
      )
    : suppliers;

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id.toString() === selectedSupplierId),
    [suppliers, selectedSupplierId],
  );
  const selectedSupplierName = selectedSupplier?.name || "غير محدد";

  const handleSelectSupplier = (supplier: any) => {
    setSelectedSupplierId(supplier.id.toString());
    setSupplierQuery(supplier.name);
    setIsSupplierDropdownOpen(false);
  };

  // Update supplier query when selected supplier changes (only if supplier is selected and query doesn't match)
  useEffect(() => {
    if (selectedSupplier) {
      const expectedQuery = selectedSupplier.name;
      // Only update if the current query doesn't match the selected supplier
      // This prevents overwriting user input when they're typing
      if (supplierQuery !== expectedQuery) {
        setSupplierQuery(expectedQuery);
      }
    }
  }, [selectedSupplier, supplierQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleViewReport = useCallback(() => {
    if (!selectedSupplier) {
      setReportData([]);
      setOpeningBalance(0);
      return;
    }

    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    const supplierId = selectedSupplier.id;
    const supplierIdStr = supplierId.toString();

    const purchasesBefore = purchaseInvoices
      .filter(
        (i) => {
          const invDate = normalizeDate(i.date);
          const invSupplierId = i.customerOrSupplier?.id?.toString() || 
                               i.supplierId?.toString() || 
                               (i.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && invDate < normalizedStartDate;
        }
      )
      .reduce((sum, i) => sum + (i.totals?.net || i.net || 0), 0); // Credit
    const returnsBefore = purchaseReturns
      .filter(
        (i) => {
          const invDate = normalizeDate(i.date);
          const invSupplierId = i.customerOrSupplier?.id?.toString() || 
                               i.supplierId?.toString() || 
                               (i.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && invDate < normalizedStartDate;
        }
      )
      .reduce((sum, i) => sum + (i.totals?.net || i.net || 0), 0); // Debit
    const paymentsBefore = paymentVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0); // Debit
    const receiptsBefore = receiptVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0); // Debit

    const currentOpeningBalance =
      selectedSupplier.openingBalance +
      paymentsBefore +
      returnsBefore +
      receiptsBefore -
      purchasesBefore;
    setOpeningBalance(currentOpeningBalance);

    const transactions: {
      date: string;
      description: string;
      ref: string;
      voucherCode: string;
      debit: number;
      credit: number;
      link: { page: string; label: string } | null;
    }[] = [];

    // Credit (Increases what we owe)
    purchaseInvoices.forEach((inv) => {
      const invDate = normalizeDate(inv.date);
      const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                           inv.supplierId?.toString() || 
                           (inv.supplier?.id?.toString());
      if (
        (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
        invDate >= normalizedStartDate &&
        invDate <= normalizedEndDate
      ) {
        const netAmount = inv.totals?.net || inv.net || 0;
        const isCash = inv.paymentMethod === "cash";
        transactions.push({
          date: inv.date,
          description: "فاتورة مشتريات",
          ref: inv.id,
          voucherCode: inv.code || inv.id,
          debit: isCash ? netAmount : 0,
          credit: isCash ? netAmount : netAmount,
          link: { page: "purchase_invoice", label: "فاتورة مشتريات" },
        });
      }
    });

    // Debit (Decreases what we owe)
    receiptVouchers.forEach((v) => {
      // Receipt from supplier (refund)
      const vDate = normalizeDate(v.date);
      const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
      if (
        v.entity?.type === "supplier" &&
        (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
        vDate >= normalizedStartDate &&
        vDate <= normalizedEndDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند قبض (رد مبلغ)",
          ref: v.id,
          voucherCode: v.code || v.id,
          debit: v.amount,
          credit: 0,
          link: { page: "receipt_voucher", label: "سند قبض" },
        });
      }
    });
    purchaseReturns.forEach((inv) => {
      const invDate = normalizeDate(inv.date);
      const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                           inv.supplierId?.toString() || 
                           (inv.supplier?.id?.toString());
      if (
        (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
        invDate >= normalizedStartDate &&
        invDate <= normalizedEndDate
      ) {
        const netAmount = inv.totals?.net || inv.net || 0;
        const isCash = inv.paymentMethod === "cash";
        transactions.push({
          date: inv.date,
          description: "مرتجع مشتريات",
          ref: inv.id,
          voucherCode: inv.code || inv.id,
          debit: netAmount,
          credit: isCash ? netAmount : 0,
          link: { page: "purchase_return", label: "مرتجع مشتريات" },
        });
      }
    });
    paymentVouchers.forEach((v) => {
      const vDate = normalizeDate(v.date);
      const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
      if (
        v.entity?.type === "supplier" &&
        (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
        vDate >= normalizedStartDate &&
        vDate <= normalizedEndDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند صرف",
          ref: v.id,
          voucherCode: v.code || v.id,
          debit: v.amount,
          credit: 0,
          link: { page: "payment_voucher", label: "سند صرف" },
        });
      }
    });

    // Sort all transactions by date field from oldest to newest (ascending order)
    transactions.sort((a, b) => {
      // Sort by date field (transaction date)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // If dates are equal, use ref as secondary sort to maintain consistent order
      if (dateA === dateB) {
        return String(a.ref).localeCompare(String(b.ref));
      }
      
      // Sort ascending: older dates first (oldest to newest)
      return dateA - dateB;
    });

    let balance = currentOpeningBalance;
    const finalData = transactions.map((t) => {
      balance = balance + t.debit - t.credit;
      return { ...t, balance };
    });

    setReportData(finalData);
  }, [
    selectedSupplier,
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

  const totalDebit = reportData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = reportData.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance = openingBalance + totalDebit - totalCredit;

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

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
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
                    th { font-size: 13px !important; font-weight: bold !important; }
                    td { font-size: 13px !important; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-dark { color: #1F2937 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-red-600 { color: #DC2626 !important; }
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
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-blue">المورد:</span> {selectedSupplierName}
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
            <div className="relative w-48" ref={supplierRef}>
              <input
                type="text"
                placeholder="اختر المورد..."
                className={inputStyle + " w-full"}
                value={supplierQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSupplierQuery(value);
                  setIsSupplierDropdownOpen(true);
                  // Clear selection when user types or clears the input
                  if (value === "" || !selectedSupplier || !value.includes(selectedSupplier.name)) {
                    setSelectedSupplierId(null);
                  }
                }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
              />
              {isSupplierDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        onClick={() => handleSelectSupplier(supplier)}
                        className="p-2 cursor-pointer hover:bg-brand-blue-bg"
                      >
                        {supplier.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 text-center">
                      لا توجد نتائج
                    </div>
                  )}
                </div>
              )}
            </div>
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-green-200 uppercase">
                  مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-36">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.link ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const page = item.link.page;
                            const id = item.ref;
                            
                            // For vouchers, always use window.location.href to force full page reload
                            // For invoices/returns, use onNavigate if available, otherwise navigate()
                            if (page === "receipt_voucher" || page === "payment_voucher") {
                              if (id) {
                                const url = page === "receipt_voucher" 
                                  ? `/financials/receipt-voucher?voucherId=${encodeURIComponent(id)}`
                                  : `/financials/payment-voucher?voucherId=${encodeURIComponent(id)}`;
                                // Use window.location to ensure URL updates and full page reload
                                window.location.href = url;
                              } else {
                                console.error("Voucher ID is missing:", item);
                              }
                            } else if (onNavigate && typeof onNavigate === "function") {
                              onNavigate(
                                page,
                                `${item.link.label} #${id}`,
                                id,
                              );
                            } else {
                              // Handle navigation directly for invoices/returns
                              if (page === "purchase_invoice" && id) {
                                navigate(`/purchases/invoice?invoiceId=${id}`);
                              } else if (page === "purchase_return" && id) {
                                navigate(`/purchases/return?returnId=${id}`);
                              }
                            }
                          }}
                          className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                          title={`فتح ${item.link.label}`}
                        >
                          {item.voucherCode}
                        </button>
                        <span className="print:inline hidden">{item.voucherCode}</span>
                      </>
                    ) : (
                      item.voucherCode
                    )}
                  </td>
                  <td className={`px-6 py-4 text-green-600 ${getNegativeNumberClass(item.debit)}`}>
                    {formatNumber(item.debit)}
                  </td>
                  <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(item.credit)}`}>
                    {formatNumber(item.credit)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold text-white">
                <td colSpan={3} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalDebit) || "text-green-200"}`}>
                  {formatNumber(totalDebit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalCredit) || "text-red-200"}`}>
                  {formatNumber(totalCredit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(finalBalance)}`}>
                  {formatNumber(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierStatementReport;
