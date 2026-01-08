import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyInfo, Safe, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from '../../../common/PermissionWrapper';
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal, exportToExcel } from "../../../../utils/formatting";
import { useGetSafesQuery } from "../../../store/slices/safe/safeApiSlice";
import { useGetInternalTransfersQuery } from "../../../store/slices/internalTransferApiSlice";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";

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

interface SafeStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const SafeStatementReport: React.FC<SafeStatementReportProps> = ({
  title,
  companyInfo,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
  currentUser,
}) => {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const skip = !isAuthed;
  // API hooks
  const { data: apiSafes = [], isLoading: safesLoading } =
    useGetSafesQuery(undefined);
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

  const rawReceiptVouchers = isAuthed
    ? apiReceiptVouchers
    : (propReceiptVouchers || []);
  const rawPaymentVouchers = isAuthed
    ? apiPaymentVouchers
    : (propPaymentVouchers || []);

  const normalizeDate = useMemo(() => {
    return (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch (error) {
        // Ignore parsing errors
      }
      return "";
    };
  }, []);

  const receiptVouchers = useMemo(() => {
    return rawReceiptVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id:
          voucher.customerId ||
          voucher.supplierId ||
          voucher.currentAccountId ||
          "",
        name: voucher.entityName || "",
      };

      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawReceiptVouchers, normalizeDate]);

  const paymentVouchers = useMemo(() => {
    return rawPaymentVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id:
          voucher.customerId ||
          voucher.supplierId ||
          voucher.currentAccountId ||
          "",
        name: voucher.entityName || "",
      };

      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawPaymentVouchers, normalizeDate]);

  // Helper function to get user's branch ID
  const getUserBranchId = (user: any): string | null => {
    if (!user) return null;
    if (user.branchId) return user.branchId?.toString() || null;
    const branch = user?.branch;
    if (typeof branch === "string") return branch;
    if (branch && typeof branch === "object") return branch.id?.toString() || null;
    return null;
  };

  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);

  // Transform API data to match expected format (show all safes)
  const safes = useMemo(() => {
    return (apiSafes as any[]).map((safe) => ({
      ...safe,
      // Add any necessary transformations here
    }));
  }, [apiSafes]);

  const isLoading =
    safesLoading || receiptVouchersLoading || paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedSafeId, setSelectedSafeId] = useState<string | null>(null);

  // Set initial selected safe when data loads (prefer first safe from current branch)
  useEffect(() => {
    if (safes.length > 0 && !selectedSafeId) {
      // Try to find first safe from current branch
      if (userBranchId) {
        const branchSafe = safes.find((safe) => safe.branchId?.toString() === userBranchId);
        if (branchSafe) {
          setSelectedSafeId(branchSafe.id.toString());
          return;
        }
      }
      // Fall back to first safe if no branch safe found
      setSelectedSafeId(safes[0].id.toString());
    }
  }, [safes, selectedSafeId, userBranchId]);

  const selectedSafe = useMemo(
    () => safes.find((s) => s.id.toString() === selectedSafeId),
    [safes, selectedSafeId],
  );
  const selectedSafeName = selectedSafe?.name || "غير محدد";

  const openingBalance = useMemo(() => {
    if (!selectedSafe) return 0;
    const safeId = selectedSafe.id?.toString() || "";
    const matchesSafeValue = (value: any) => value?.toString() === safeId;
    const matchesSafeRecord = (record: any) => {
      if (!record) return false;
      // Match by explicit safeId only - invoices have safeId field that links to the specific safe
      if (matchesSafeValue(record.safeId)) return true;

      // For split payments, check splitSafeId
      if (record.isSplitPayment === true && matchesSafeValue(record.splitSafeId)) {
        return true;
      }

      return false;
    };
    
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

    // Receipt vouchers (incoming) - always explicitly linked to safe/bank
    const receiptsBefore = receiptVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Payment vouchers (outgoing)
    const paymentsBefore = paymentVouchers
      .filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < normalizedStartDate;
        }
      )
      .reduce((sum, v) => sum + v.amount, 0);
    
    // Sales invoices (cash payments to safe) - incoming
    // Regular payments
    const salesInvoicesBefore = (apiSalesInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          // Only cash invoices that actually pay to a safe (not split payments)
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return (
            invDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);
    
    // Split payment sales invoices (safe portion) - incoming
    const splitSalesInvoicesBefore = (apiSalesInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < normalizedStartDate;
        }
      )
      .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);
    
    // Purchase invoices (cash payments from safe) - outgoing
    // Regular payments
    const purchaseInvoicesBefore = (apiPurchaseInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          // Only cash invoices that actually pay from a safe (not split payments)
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return (
            invDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);
    
    // Split payment purchase invoices (safe portion) - outgoing
    const splitPurchaseInvoicesBefore = (apiPurchaseInvoices as any[])
      .filter(
        (inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < normalizedStartDate;
        }
      )
      .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);
    
    // Sales returns (cash payments from safe) - outgoing
    // Regular payments
    const salesReturnsBefore = (apiSalesReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          // Only cash returns that actually pay from a safe (not split payments)
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return (
            retDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);
    
    // Split payment sales returns (safe portion) - outgoing
    const splitSalesReturnsBefore = (apiSalesReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < normalizedStartDate;
        }
      )
      .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);
    
    // Purchase returns (cash payments to safe) - incoming
    // Regular payments
    const purchaseReturnsBefore = (apiPurchaseReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          // Only cash returns that actually pay to a safe (not split payments)
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return (
            retDate < normalizedStartDate
          );
        }
      )
      .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);
    
    // Split payment purchase returns (safe portion) - incoming
    const splitPurchaseReturnsBefore = (apiPurchaseReturns as any[])
      .filter(
        (ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < normalizedStartDate;
        }
      )
      .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);
    
    // Internal transfers before startDate
    const outgoingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "safe" &&
            matchesSafeValue(t.fromSafeId) &&
            tDate < normalizedStartDate;
        }
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const incomingBefore = (apiInternalTransfers as any[])
      .filter(
        (t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "safe" &&
            matchesSafeValue(t.toSafeId) &&
            tDate < normalizedStartDate;
        }
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Opening balance = initial + incoming - outgoing
    return selectedSafe.openingBalance 
      + receiptsBefore 
      + salesInvoicesBefore 
      + splitSalesInvoicesBefore
      + purchaseReturnsBefore 
      + splitPurchaseReturnsBefore
      + incomingBefore
      - paymentsBefore 
      - purchaseInvoicesBefore 
      - splitPurchaseInvoicesBefore
      - salesReturnsBefore 
      - splitSalesReturnsBefore
      - outgoingBefore;
  }, [selectedSafe, receiptVouchers, paymentVouchers, apiInternalTransfers, apiSalesInvoices, apiPurchaseInvoices, apiSalesReturns, apiPurchaseReturns, startDate, endDate]);

  const reportData = useMemo(() => {
    if (!selectedSafeId) return [];
    const safeId = selectedSafeId.toString();
    const matchesSafeValue = (value: any) => value?.toString() === safeId;
    const matchesSafeRecord = (record: any) => {
      if (!record) return false;
      // Match by explicit safeId only - invoices have safeId field that links to the specific safe
      if (matchesSafeValue(record.safeId)) return true;

      // For split payments, check splitSafeId
      if (record.isSplitPayment === true && matchesSafeValue(record.splitSafeId)) {
        return true;
      }

      return false;
    };

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
      return 0;
    };

    // Receipt Vouchers (incoming) - Debit
    receiptVouchers.forEach((v: any) => {
      const vDate = normalizeDate(v.date);
      if (
        v.paymentMethod === "safe" &&
        matchesSafeValue(v.safeOrBankId) &&
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

    // Sales Invoices (cash payments to safe) - Debit (incoming)
    // Regular payments
    (apiSalesInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        !inv.isSplitPayment &&
        inv.paymentTargetType === "safe" &&
        matchesSafeRecord(inv) &&
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

    // Split payment sales invoices (safe portion) - Debit (incoming)
    (apiSalesInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        inv.isSplitPayment === true &&
        matchesSafeValue(inv.splitSafeId) &&
        invoiceDate >= normalizedStartDate &&
        invoiceDate <= normalizedEndDate
      ) {
        const amount = Number(inv.splitCashAmount) || 0;
        if (amount > 0) {
          transactions.push({
            date: invoiceDate,
            description: `فاتورة مبيعات (جزء من دفع مجزأ) - ${inv.customerOrSupplier?.name || "عميل"}`,
            ref: inv.code || inv.id,
            refId: inv.id,
            debit: amount,
            credit: 0,
            link: { page: "sales_invoice", label: "فاتورة مبيعات" },
            sortKey: buildSortKey(inv),
          });
        }
      }
    });

    // Purchase Returns (cash payments to safe) - Debit (incoming)
    // Regular payments
    (apiPurchaseReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        !ret.isSplitPayment &&
        ret.paymentTargetType === "safe" &&
        matchesSafeRecord(ret) &&
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

    // Split payment purchase returns (safe portion) - Debit (incoming)
    (apiPurchaseReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        ret.isSplitPayment === true &&
        matchesSafeValue(ret.splitSafeId) &&
        returnDate >= normalizedStartDate &&
        returnDate <= normalizedEndDate
      ) {
        const amount = Number(ret.splitCashAmount) || 0;
        if (amount > 0) {
          transactions.push({
            date: returnDate,
            description: `مرتجع مشتريات (جزء من دفع مجزأ) - ${ret.customerOrSupplier?.name || "مورد"}`,
            ref: ret.code || ret.id,
            refId: ret.id,
            debit: amount,
            credit: 0,
            link: { page: "purchase_return", label: "مرتجع مشتريات" },
            sortKey: buildSortKey(ret),
          });
        }
      }
    });

    // Transfer to Cashier (incoming) - Debit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = normalizeDate(t.date);
      if (
        t.toType === "safe" &&
        matchesSafeValue(t.toSafeId) &&
        transferDate >= normalizedStartDate &&
        transferDate <= normalizedEndDate
      ) {
        const fromAccountName =
          t.fromType === "safe" ? t.fromSafe?.name : t.fromBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل إلى الخزينة من ${fromAccountName}`,
          ref: t.code,
          refId: t.id,
          debit: t.amount,
          credit: 0,
          link: { page: "internal_transfer", label: "تحويل داخلي" },
          sortKey: buildSortKey(t),
        });
      }
    });

    // Purchase Invoices (cash payments from safe) - Credit (outgoing)
    // Regular payments
    (apiPurchaseInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        !inv.isSplitPayment &&
        inv.paymentTargetType === "safe" &&
        matchesSafeRecord(inv) &&
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

    // Split payment purchase invoices (safe portion) - Credit (outgoing)
    (apiPurchaseInvoices as any[]).forEach((inv) => {
      const invoiceDate = normalizeDate(inv.date);
      if (
        inv.paymentMethod === "cash" &&
        inv.isSplitPayment === true &&
        matchesSafeValue(inv.splitSafeId) &&
        invoiceDate >= normalizedStartDate &&
        invoiceDate <= normalizedEndDate
      ) {
        const amount = Number(inv.splitCashAmount) || 0;
        if (amount > 0) {
          transactions.push({
            date: invoiceDate,
            description: `فاتورة مشتريات (جزء من دفع مجزأ) - ${inv.customerOrSupplier?.name || "مورد"}`,
            ref: inv.code || inv.id,
            refId: inv.id,
            debit: 0,
            credit: amount,
            link: { page: "purchase_invoice", label: "فاتورة مشتريات" },
            sortKey: buildSortKey(inv),
          });
        }
      }
    });

    // Sales Returns (cash payments from safe) - Credit (outgoing)
    // Regular payments
    (apiSalesReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        !ret.isSplitPayment &&
        ret.paymentTargetType === "safe" &&
        matchesSafeRecord(ret) &&
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

    // Split payment sales returns (safe portion) - Credit (outgoing)
    (apiSalesReturns as any[]).forEach((ret) => {
      const returnDate = normalizeDate(ret.date);
      if (
        ret.paymentMethod === "cash" &&
        ret.isSplitPayment === true &&
        matchesSafeValue(ret.splitSafeId) &&
        returnDate >= normalizedStartDate &&
        returnDate <= normalizedEndDate
      ) {
        const amount = Number(ret.splitCashAmount) || 0;
        if (amount > 0) {
          transactions.push({
            date: returnDate,
            description: `مرتجع مبيعات (جزء من دفع مجزأ) - ${ret.customerOrSupplier?.name || "عميل"}`,
            ref: ret.code || ret.id,
            refId: ret.id,
            debit: 0,
            credit: amount,
            link: { page: "sales_return", label: "مرتجع مبيعات" },
            sortKey: buildSortKey(ret),
          });
        }
      }
    });

    // Payment Vouchers (outgoing) - Credit
    paymentVouchers.forEach((v: any) => {
      const vDate = normalizeDate(v.date);
      if (
        v.paymentMethod === "safe" &&
        matchesSafeValue(v.safeOrBankId) &&
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

    // Transfer from Cashier (outgoing) - Credit
    (apiInternalTransfers as any[]).forEach((t) => {
      const transferDate = normalizeDate(t.date);
      if (
        t.fromType === "safe" &&
        matchesSafeValue(t.fromSafeId) &&
        transferDate >= normalizedStartDate &&
        transferDate <= normalizedEndDate
      ) {
        const toAccountName =
          t.toType === "safe" ? t.toSafe?.name : t.toBank?.name || "حساب";
        transactions.push({
          date: transferDate,
          description: `تحويل من الخزينة إلى ${toAccountName}`,
          ref: t.code,
          refId: t.id,
          debit: 0,
          credit: t.amount,
          link: { page: "internal_transfer", label: "تحويل داخلي" },
          sortKey: buildSortKey(t),
        });
      }
    });


    // Sort ascending by date field to compute running balance correctly
    // sortKey contains the date timestamp, so simple numeric comparison is sufficient
    transactions.sort((a, b) => (a.sortKey || 0) - (b.sortKey || 0));

    let balance = openingBalance;
    const withBalance = transactions.map((t) => {
      balance = balance + t.debit - t.credit;
      return { ...t, balance };
    });

    // Return data in ascending order (oldest first) without the helper sort key
    return withBalance.map(({ sortKey, ...rest }) => rest);
  }, [
    selectedSafeId,
    selectedSafe,
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

  // Final balance is recalculated purely from opening balance and movements in this report
  // (do NOT rely on selectedSafe.currentBalance, which may use different business rules).
  const finalBalance =
    reportData.length > 0
      ? reportData[reportData.length - 1].balance
      : openingBalance;

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

  const handleExcelExport = () => {
    if (!selectedSafeId) {
      return;
    }
    const dataToExport = [
      {
        التاريخ: "رصيد أول المدة",
        البيان: "",
        المرجع: "",
        "مدين (وارد)": "",
        "دائن (صادر)": "",
        الرصيد: formatNumber(openingBalance),
      },
      ...reportData.map((item) => ({
        التاريخ: item.date.substring(0, 10),
        البيان: item.description,
        المرجع: item.ref,
        "مدين (وارد)": formatNumber(item.debit),
        "دائن (صادر)": formatNumber(item.credit),
        الرصيد: formatNumber(item.balance),
      })),
      {
        التاريخ: "الإجمالي",
        البيان: "",
        المرجع: "",
        "مدين (وارد)": formatNumber(totalDebit),
        "دائن (صادر)": formatNumber(totalCredit),
        الرصيد: formatNumber(finalBalance),
      },
    ];
    exportToExcel(dataToExport, `كشف_حساب_خزينة_${selectedSafe?.name || "جميع_الخزائن"}`);
  };

  const handlePrint = () => {
    if (!selectedSafeId) {
      return;
    }
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
                <span className="text-brand-blue">الخزينة:</span> {selectedSafeName}
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
          <div className="flex items-center gap-4 flex-wrap no-print">
            <select
              className={inputStyle}
              value={selectedSafeId || ""}
              onChange={(e) => setSelectedSafeId(e.target.value)}
              required
            >
              {safes.map((s) => (
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
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.SAFE_STATEMENT_REPORT,
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

        {!selectedSafeId ? (
          <div className="flex justify-center items-center h-64 border-2 border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center">
              <p className="text-lg text-gray-600 font-semibold">يرجى اختيار الخزينة لعرض التقرير</p>
            </div>
          </div>
        ) : (
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
                  مدين (وارد)
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  دائن (صادر)
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
                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totalDebit) || "text-green-200"}`}>
                  {formatNumber(totalDebit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totalCredit) || "text-red-200"}`}>
                  {formatNumber(totalCredit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(finalBalance)}`}>
                  {formatNumber(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafeStatementReport;
