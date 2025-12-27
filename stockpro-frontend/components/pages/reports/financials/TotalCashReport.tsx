import React, { useMemo, useState, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Safe,
  Bank,
  Voucher,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal } from "../../../../utils/formatting";
import { useGetSafesQuery } from "../../../store/slices/safe/safeApiSlice";
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

interface TotalCashReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const TotalCashReport: React.FC<TotalCashReportProps> = ({
  title,
  companyInfo,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  const skip = !isAuthed;

  // API hooks
  const { data: apiSafes = [], isLoading: safesLoading } =
    useGetSafesQuery(undefined);
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

  // Transform API data to match expected format
  const safes = useMemo(() => {
    return (apiSafes as any[]).map((safe) => ({
      ...safe,
    }));
  }, [apiSafes]);

  const banks = useMemo(() => {
    return (apiBanks as any[]).map((bank) => ({
      ...bank,
    }));
  }, [apiBanks]);

  // Helper function to normalize dates to YYYY-MM-DD format
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
      } catch (e) {
        // Ignore parsing errors
      }
      return "";
    };
  }, []);

  // Transform vouchers to match expected structure
  const receiptVouchers = useMemo(() => {
    return rawReceiptVouchers.map((voucher: any) => {
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
    safesLoading ||
    banksLoading ||
    receiptVouchersLoading ||
    paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [filterType, setFilterType] = useState<"safes" | "banks" | "all">("all");
  const [reportData, setReportData] = useState<any[]>([]);

  const handleViewReport = useCallback(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    // Calculate balance for a safe
    const calculateSafeBalance = (safe: Safe) => {
      const safeId = safe.id?.toString() || "";
      const matchesSafeValue = (value: any) => value?.toString() === safeId;
      const branchId = safe.branchId?.toString() || "";
      const matchesBranchValue = (value: any) =>
        branchId && value?.toString() === branchId;
      const matchesSafeRecord = (record: any) => {
        if (!record) return false;
        if (matchesSafeValue(record.safeId)) return true;
        if (
          record.paymentMethod === "cash" &&
          record.paymentTargetType === "safe" &&
          (matchesBranchValue(record.paymentTargetId) ||
            matchesSafeValue(record.paymentTargetId))
        ) {
          return true;
        }
        return false;
      };

      // Calculate transactions BEFORE start date for opening balance
      const receiptsBeforeStart = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < normalizedStartDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBeforeStart = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < normalizedStartDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesBeforeStart = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesBeforeStart = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const purchaseInvoicesBeforeStart = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesBeforeStart = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const salesReturnsBeforeStart = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsBeforeStart = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const purchaseReturnsBeforeStart = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsBeforeStart = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const outgoingBeforeStart = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "safe" &&
            matchesSafeValue(t.fromSafeId) &&
            tDate < normalizedStartDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingBeforeStart = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "safe" &&
            matchesSafeValue(t.toSafeId) &&
            tDate < normalizedStartDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate transactions BETWEEN start and end date for period
      const receiptsInPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsInPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesInPeriod = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return invDate >= normalizedStartDate && invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesInPeriod = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const purchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          if (
            inv.paymentMethod !== "cash" ||
            inv.isSplitPayment === true ||
            inv.paymentTargetType !== "safe" ||
            !matchesSafeRecord(inv)
          ) {
            return false;
          }
          return invDate >= normalizedStartDate && invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const salesReturnsInPeriod = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return retDate >= normalizedStartDate && retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsInPeriod = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const purchaseReturnsInPeriod = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          if (
            ret.paymentMethod !== "cash" ||
            ret.isSplitPayment === true ||
            ret.paymentTargetType !== "safe" ||
            !matchesSafeRecord(ret)
          ) {
            return false;
          }
          return retDate >= normalizedStartDate && retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsInPeriod = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const outgoingInPeriod = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "safe" &&
            matchesSafeValue(t.fromSafeId) &&
            tDate >= normalizedStartDate &&
            tDate <= normalizedEndDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingInPeriod = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "safe" &&
            matchesSafeValue(t.toSafeId) &&
            tDate >= normalizedStartDate &&
            tDate <= normalizedEndDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Opening Balance = base opening balance + transactions before start date
      const openingDebitBefore = receiptsBeforeStart 
        + salesInvoicesBeforeStart 
        + splitSalesInvoicesBeforeStart
        + purchaseReturnsBeforeStart 
        + splitPurchaseReturnsBeforeStart
        + incomingBeforeStart;

      const openingCreditBefore = paymentsBeforeStart 
        + purchaseInvoicesBeforeStart 
        + splitPurchaseInvoicesBeforeStart
        + salesReturnsBeforeStart 
        + splitSalesReturnsBeforeStart
        + outgoingBeforeStart;

      const opening = (safe.openingBalance || 0) + openingDebitBefore - openingCreditBefore;

      // Period Debit: all incoming transactions between start and end date
      const periodDebit = receiptsInPeriod 
        + salesInvoicesInPeriod 
        + splitSalesInvoicesInPeriod
        + purchaseReturnsInPeriod 
        + splitPurchaseReturnsInPeriod
        + incomingInPeriod;

      // Period Credit: all outgoing transactions between start and end date
      const periodCredit = paymentsInPeriod 
        + purchaseInvoicesInPeriod 
        + splitPurchaseInvoicesInPeriod
        + salesReturnsInPeriod 
        + splitSalesReturnsInPeriod
        + outgoingInPeriod;

      // Current Balance = Opening Balance + Period Debit - Period Credit
      const currentBalance = opening + periodDebit - periodCredit;

      return {
        id: safe.id,
        code: safe.code || "",
        name: safe.name,
        type: "safe" as const,
        opening,
        debit: periodDebit,
        credit: periodCredit,
        balance: currentBalance,
      };
    };

    // Calculate balance for a bank
    const calculateBankBalance = (bank: Bank) => {
      const bankId = bank.id.toString();

      // Calculate transactions BEFORE start date for opening balance
      const receiptsBeforeStart = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate < normalizedStartDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBeforeStart = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate < normalizedStartDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesBeforeStart = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesBeforeStart = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const purchaseInvoicesBeforeStart = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesBeforeStart = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate < normalizedStartDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const salesReturnsBeforeStart = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsBeforeStart = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const purchaseReturnsBeforeStart = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsBeforeStart = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate < normalizedStartDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const outgoingBeforeStart = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "bank" &&
            t.fromBankId === bankId &&
            tDate < normalizedStartDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingBeforeStart = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "bank" &&
            t.toBankId === bankId &&
            tDate < normalizedStartDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate transactions BETWEEN start and end date for period
      const receiptsInPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsInPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesInPeriod = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesInPeriod = (apiSalesInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const purchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate >= normalizedStartDate &&
            invDate <= normalizedEndDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const salesReturnsInPeriod = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsInPeriod = (apiSalesReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const purchaseReturnsInPeriod = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsInPeriod = (apiPurchaseReturns as any[])
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate >= normalizedStartDate &&
            retDate <= normalizedEndDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const outgoingInPeriod = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "bank" &&
            t.fromBankId === bankId &&
            tDate >= normalizedStartDate &&
            tDate <= normalizedEndDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingInPeriod = (apiInternalTransfers as any[])
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "bank" &&
            t.toBankId === bankId &&
            tDate >= normalizedStartDate &&
            tDate <= normalizedEndDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Opening Balance = base opening balance + transactions before start date
      const openingDebitBefore = receiptsBeforeStart 
        + salesInvoicesBeforeStart 
        + splitSalesInvoicesBeforeStart
        + purchaseReturnsBeforeStart 
        + splitPurchaseReturnsBeforeStart
        + incomingBeforeStart;

      const openingCreditBefore = paymentsBeforeStart 
        + purchaseInvoicesBeforeStart 
        + splitPurchaseInvoicesBeforeStart
        + salesReturnsBeforeStart 
        + splitSalesReturnsBeforeStart
        + outgoingBeforeStart;

      const opening = (bank.openingBalance || 0) + openingDebitBefore - openingCreditBefore;

      // Period Debit: all incoming transactions between start and end date
      const periodDebit = receiptsInPeriod 
        + salesInvoicesInPeriod 
        + splitSalesInvoicesInPeriod
        + purchaseReturnsInPeriod 
        + splitPurchaseReturnsInPeriod
        + incomingInPeriod;

      // Period Credit: all outgoing transactions between start and end date
      const periodCredit = paymentsInPeriod 
        + purchaseInvoicesInPeriod 
        + splitPurchaseInvoicesInPeriod
        + salesReturnsInPeriod 
        + splitSalesReturnsInPeriod
        + outgoingInPeriod;

      // Current Balance = Opening Balance + Period Debit - Period Credit
      const currentBalance = opening + periodDebit - periodCredit;

      return {
        id: bank.id,
        code: bank.code || "",
        name: bank.name,
        type: "bank" as const,
        opening,
        debit: periodDebit,
        credit: periodCredit,
        balance: currentBalance,
      };
    };

    // Build report data based on filter
    const data: any[] = [];
    
    if (filterType === "safes" || filterType === "all") {
      safes.forEach((safe) => {
        data.push(calculateSafeBalance(safe));
      });
    }
    
    if (filterType === "banks" || filterType === "all") {
      banks.forEach((bank) => {
        data.push(calculateBankBalance(bank));
      });
    }

    setReportData(data);
  }, [
    safes,
    banks,
    receiptVouchers,
    paymentVouchers,
    apiInternalTransfers,
    apiSalesInvoices,
    apiPurchaseInvoices,
    apiSalesReturns,
    apiPurchaseReturns,
    startDate,
    endDate,
    filterType,
    normalizeDate,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const filteredReportData = useMemo(() => {
    return reportData;
  }, [reportData]);

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
            <label className="font-semibold">النوع:</label>
            <select
              className={inputStyle}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as "safes" | "banks" | "all")}
            >
              <option value="all">الكل</option>
              <option value="safes">خزائن</option>
              <option value="banks">بنوك</option>
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
              Resources.TOTAL_CASH_REPORT,
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-64">
                  الاسم
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
                <tr key={`${item.type}-${item.id}`} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-64">
                    {item.name} {item.type === "safe" ? "(خزينة)" : "(بنك)"}
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
            <tfoot className="bg-brand-blue text-white">
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

export default TotalCashReport;

