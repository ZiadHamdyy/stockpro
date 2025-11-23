import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyInfo, Bank, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetBanksQuery } from "../../../store/slices/bank/bankApiSlice";
import { useGetInternalTransfersQuery } from "../../../store/slices/internalTransferApiSlice";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";

const resolveRecordAmount = (record: any): number => {
  if (!record) return 0;
  const totals = record.totals;
  const rawAmount =
    (totals &&
      (totals.net ??
        totals.total ??
        totals.amount ??
        totals.debit ??
        totals.credit)) ??
    record.net ??
    record.total ??
    record.amount ??
    record.debit ??
    record.credit ??
    0;
  const amountNumber = Number(rawAmount);
  return Number.isFinite(amountNumber) ? amountNumber : 0;
};

interface BankStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const BankStatementReport: React.FC<BankStatementReportProps> = ({
  title,
  companyInfo,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
  currentUser,
}) => {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;

  // API hooks
  const { data: apiBanks = [], isLoading: banksLoading } =
    useGetBanksQuery(undefined);
  const { data: apiInternalTransfers = [] } = useGetInternalTransfersQuery();
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery(undefined);
  const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery(undefined);
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery(undefined);
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

  // Transform API data to match expected format
  const banks = useMemo(() => {
    return (apiBanks as any[]).map((bank) => ({
      ...bank,
      // Add any necessary transformations here
    }));
  }, [apiBanks]);

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
        createdAt: voucher.createdAt || voucher.date,
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
        createdAt: voucher.createdAt || voucher.date,
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawPaymentVouchers, normalizeDate]);

  const isLoading = banksLoading || receiptVouchersLoading || paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Set initial selected bank when data loads
  useEffect(() => {
    if (banks.length > 0 && !selectedBankId) {
      setSelectedBankId(banks[0].id.toString());
    }
  }, [banks, selectedBankId]);

  const selectedBank = useMemo(
    () => banks.find((b) => b.id.toString() === selectedBankId),
    [banks, selectedBankId],
  );
  const selectedBankName = selectedBank?.name || "غير محدد";

  const openingBalance = useMemo(() => {
    if (!selectedBank) return 0;
    const bankId = selectedBank.id.toString();
    
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

    // Receipt vouchers (incoming)
    const receiptsBefore = receiptVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId === selectedBank.id &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Payment vouchers (outgoing)
    const paymentsBefore = paymentVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId === selectedBank.id &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Sales invoices (cash payments to bank) - incoming
    const salesInvoicesBefore = (apiSalesInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < normalizedStartDate;
        }
      )
      .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);
    
    // Purchase invoices (cash payments from bank) - outgoing
    const purchaseInvoicesBefore = (apiPurchaseInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < normalizedStartDate;
        }
      )
      .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);
    
    // Sales returns (cash payments from bank) - outgoing
    const salesReturnsBefore = (apiSalesReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < normalizedStartDate;
        }
      )
      .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);
    
    // Purchase returns (cash payments to bank) - incoming
    const purchaseReturnsBefore = (apiPurchaseReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < normalizedStartDate;
        }
      )
      .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);
    
    // Internal transfers before startDate
    const outgoingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "bank" &&
            t.fromBankId === bankId &&
            tDate < normalizedStartDate;
        }
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const incomingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "bank" &&
            t.toBankId === bankId &&
            tDate < normalizedStartDate;
        }
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Opening balance = initial + incoming - outgoing
    return selectedBank.openingBalance 
      + receiptsBefore 
      + salesInvoicesBefore 
      + purchaseReturnsBefore 
      + incomingBefore
      - paymentsBefore 
      - purchaseInvoicesBefore 
      - salesReturnsBefore 
      - outgoingBefore;
  }, [selectedBank, receiptVouchers, paymentVouchers, apiInternalTransfers, apiSalesInvoices, apiPurchaseInvoices, apiSalesReturns, apiPurchaseReturns, startDate, endDate]);

  const reportData = useMemo(() => {
    if (!selectedBankId) return [];
    const bankId = selectedBankId.toString();

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

    const transactions: {
      date: string;
      description: string;
      ref: string;
      refId: string;
      debit: number;
      credit: number;
      link: { page: string; label: string } | null;
      sortKey: number;
    }[] = [];

    const buildSortKey = (record: any) => {
      // Sort by date field (transaction date) for chronological ordering
      const dateValue = record?.date;
      if (dateValue) {
        const time = new Date(dateValue).getTime();
        if (Number.isFinite(time) && time > 0) {
          return time;
        }
      }
      // Fallback to createdAt if date is not available
      const createdAt = record?.createdAt || record?.created_at;
      if (createdAt) {
        const time = new Date(createdAt).getTime();
        if (Number.isFinite(time) && time > 0) {
          return time;
        }
      }
      return 0;
    };

    // Receipt Vouchers (incoming) - Debit
    receiptVouchers.forEach((v: any) => {
      const vDate = normalizeDate(v.date);
      if (
        v.paymentMethod === "bank" &&
        v.safeOrBankId?.toString() === bankId &&
        vDate >= normalizedStartDate &&
        vDate <= normalizedEndDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند قبض من ${v.entity.name}`,
          ref: v.code || v.id,
          refId: v.id,
          debit: v.amount,
          credit: 0,
          link: { page: "receipt_voucher", label: "سند قبض" },
          sortKey: buildSortKey(v),
        });
      }
    });

    // Sales Invoices (cash payments to bank) - Debit (incoming)
    (apiSalesInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        inv.paymentTargetType === "bank" &&
        inv.paymentTargetId === bankId &&
        invoiceDate >= normalizedStartDate &&
        invoiceDate <= normalizedEndDate
      ) {
        const amount = resolveRecordAmount(inv);
        transactions.push({
          date: invoiceDate,
          description: `فاتورة مبيعات - ${inv.customerOrSupplier?.name || "عميل"}`,
          ref: inv.code || inv.id,
          refId: inv.id,
          debit: amount,
          credit: 0,
          link: { page: "sales_invoice", label: "فاتورة مبيعات" },
          sortKey: buildSortKey(inv),
        });
      }
    });

    // Purchase Returns (cash payments to bank) - Debit (incoming)
    (apiPurchaseReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        ret.paymentTargetType === "bank" &&
        ret.paymentTargetId === bankId &&
        returnDate >= normalizedStartDate &&
        returnDate <= normalizedEndDate
      ) {
        const amount = resolveRecordAmount(ret);
        transactions.push({
          date: returnDate,
          description: `مرتجع مشتريات - ${ret.customerOrSupplier?.name || "مورد"}`,
          ref: ret.code || ret.id,
          refId: ret.id,
          debit: amount,
          credit: 0,
          link: { page: "purchase_return", label: "مرتجع مشتريات" },
          sortKey: buildSortKey(ret),
        });
      }
    });

    // Bank Transfer (incoming) - Debit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = normalizeDate(t.date);
      if (
        t.toType === "bank" &&
        t.toBankId === bankId &&
        transferDate >= normalizedStartDate &&
        transferDate <= normalizedEndDate
      ) {
        const fromAccountName =
          t.fromType === "safe" ? t.fromSafe?.name : t.fromBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل إلى البنك من ${fromAccountName}`,
          ref: t.code,
          refId: t.id,
          debit: t.amount,
          credit: 0,
          link: { page: "internal_transfer", label: "تحويل داخلي" },
          sortKey: buildSortKey(t),
        });
      }
    });

    // Purchase Invoices (cash payments from bank) - Credit (outgoing)
    (apiPurchaseInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        inv.paymentTargetType === "bank" &&
        inv.paymentTargetId === bankId &&
        invoiceDate >= normalizedStartDate &&
        invoiceDate <= normalizedEndDate
      ) {
        const amount = resolveRecordAmount(inv);
        transactions.push({
          date: invoiceDate,
          description: `فاتورة مشتريات - ${inv.customerOrSupplier?.name || "مورد"}`,
          ref: inv.code || inv.id,
          refId: inv.id,
          debit: 0,
          credit: amount,
          link: { page: "purchase_invoice", label: "فاتورة مشتريات" },
          sortKey: buildSortKey(inv),
        });
      }
    });

    // Sales Returns (cash payments from bank) - Credit (outgoing)
    (apiSalesReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        ret.paymentTargetType === "bank" &&
        ret.paymentTargetId === bankId &&
        returnDate >= normalizedStartDate &&
        returnDate <= normalizedEndDate
      ) {
        const amount = resolveRecordAmount(ret);
        transactions.push({
          date: returnDate,
          description: `مرتجع مبيعات - ${ret.customerOrSupplier?.name || "عميل"}`,
          ref: ret.code || ret.id,
          refId: ret.id,
          debit: 0,
          credit: amount,
          link: { page: "sales_return", label: "مرتجع مبيعات" },
          sortKey: buildSortKey(ret),
        });
      }
    });

    // Payment Vouchers (outgoing) - Credit
    paymentVouchers.forEach((v: any) => {
      const vDate = normalizeDate(v.date);
      if (
        v.paymentMethod === "bank" &&
        v.safeOrBankId?.toString() === bankId &&
        vDate >= normalizedStartDate &&
        vDate <= normalizedEndDate
      ) {
        transactions.push({
          date: v.date,
          description: `سند صرف إلى ${v.entity.name}`,
          ref: v.code || v.id,
          refId: v.id,
          debit: 0,
          credit: v.amount,
          link: { page: "payment_voucher", label: "سند صرف" },
          sortKey: buildSortKey(v),
        });
      }
    });

    // Bank Transfer (outgoing) - Credit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = normalizeDate(t.date);
      if (
        t.fromType === "bank" &&
        t.fromBankId === bankId &&
        transferDate >= normalizedStartDate &&
        transferDate <= normalizedEndDate
      ) {
        const toAccountName =
          t.toType === "safe" ? t.toSafe?.name : t.toBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل من البنك إلى ${toAccountName}`,
          ref: t.code,
          refId: t.id,
          debit: 0,
          credit: t.amount,
          link: { page: "internal_transfer", label: "تحويل داخلي" },
          sortKey: buildSortKey(t),
        });
      }
    });

    // Sort ascending to compute running balance correctly
    transactions.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));

    let balance = openingBalance;
    const withBalance = transactions.map((t) => {
      balance = balance + t.debit - t.credit;
      return { ...t, balance };
    });

    // Return data in ascending order (oldest first) without the helper sort key
    return withBalance.map(({ sortKey, ...rest }) => rest);
  }, [
    selectedBankId,
    receiptVouchers,
    paymentVouchers,
    apiInternalTransfers,
    apiSalesInvoices,
    apiPurchaseInvoices,
    apiSalesReturns,
    apiPurchaseReturns,
    startDate,
    endDate,
    openingBalance,
  ]);

  const totalDebit = reportData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = reportData.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance =
    selectedBank?.currentBalance !== undefined &&
    selectedBank?.currentBalance !== null
      ? selectedBank.currentBalance
      : openingBalance + totalDebit - totalCredit;

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

  const handleLinkedNavigation = (
    page: string,
    id?: string | number | null,
  ) => {
    if (!id) {
      console.error("Record ID is missing for navigation");
      return;
    }
    const encodedId = encodeURIComponent(String(id));

    if (page === "receipt_voucher" || page === "payment_voucher") {
      const url =
        page === "receipt_voucher"
          ? `/financials/receipt-voucher?voucherId=${encodedId}`
          : `/financials/payment-voucher?voucherId=${encodedId}`;
      window.location.href = url;
      return;
    }

    if (page === "sales_invoice") {
      navigate(`/sales/invoice?invoiceId=${encodedId}`);
      return;
    }
    if (page === "sales_return") {
      navigate(`/sales/return?returnId=${encodedId}`);
      return;
    }
    if (page === "purchase_invoice") {
      navigate(`/purchases/invoice?invoiceId=${encodedId}`);
      return;
    }
    if (page === "purchase_return") {
      navigate(`/purchases/return?returnId=${encodedId}`);
      return;
    }
    if (page === "internal_transfer") {
      window.location.href = `/financials/internal-transfers?transferId=${encodedId}`;
    }
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
                <span className="text-brand-blue">البنك:</span> {selectedBankName}
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
          <div className="flex items-center gap-4">
            <select
              className={inputStyle}
              value={selectedBankId || ""}
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              <option value="">اختر البنك...</option>
              {banks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
            <button className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
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
                  مدين (إيداع)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  دائن (سحب)
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
                            handleLinkedNavigation(item.link.page, item.refId);
                          }}
                          className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                          title={`فتح ${item.link.label}`}
                        >
                          {item.ref}
                        </button>
                        <span className="print:inline hidden">{item.ref}</span>
                      </>
                    ) : (
                      item.ref
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

export default BankStatementReport;
