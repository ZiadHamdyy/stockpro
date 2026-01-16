import React, { useState, useMemo, useCallback } from 'react';
import { useAuditTrial } from '../../hook/useAuditTrial';
import PermissionWrapper from '../../common/PermissionWrapper';
import {
  Resources,
  Actions,
  buildPermission,
} from '../../../enums/permissions.enum';
import { calculateCompanyInventoryValuation } from '../../../utils/inventoryValuation';
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetPurchaseReturnsQuery } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetStoreReceiptVouchersQuery } from '../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi';
import { useGetStoreIssueVouchersQuery } from '../../store/slices/storeIssueVoucher/storeIssueVoucherApi';
import { useGetStoreTransferVouchersQuery } from '../../store/slices/storeTransferVoucher/storeTransferVoucherApi';
import { useGetStoresQuery, useGetAllStoreItemsQuery } from '../../store/slices/store/storeApi';
import { useGetFinancialSettingsQuery } from '../../store/slices/financialSettings/financialSettingsApi';
import { ValuationMethod } from '../../pages/settings/financial-system/types';
import { useGetCustomersQuery } from '../../store/slices/customer/customerApiSlice';
import { useGetSuppliersQuery } from '../../store/slices/supplier/supplierApiSlice';
import { useGetReceivableAccountsQuery } from '../../store/slices/receivableAccounts/receivableAccountsApi';
import { useGetPayableAccountsQuery } from '../../store/slices/payableAccounts/payableAccountsApi';
import { useGetReceiptVouchersQuery } from '../../store/slices/receiptVoucherApiSlice';
import { useGetPaymentVouchersQuery } from '../../store/slices/paymentVoucherApiSlice';
import { useGetSafesQuery } from '../../store/slices/safe/safeApiSlice';
import { useGetBanksQuery } from '../../store/slices/bank/bankApiSlice';
import { useGetInternalTransfersQuery } from '../../store/slices/internalTransferApiSlice';
import { useAuth } from '../../hook/Auth';

interface TrialBalanceEntry {
  id: string;
  accountCode: string;
  accountName: string;
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingBalanceDebit: number;
  openingBalanceCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingBalanceDebit: number;
  closingBalanceCredit: number;
}

interface FinancialSummary {
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
}

const AuditTrial: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);
  const [reportDate] = useState(new Date().toISOString().split('T')[0]);

  const {
    data: auditTrialData,
    companyInfo,
    isLoading,
    error,
  } = useAuditTrial(fromDate, toDate);

  // Fetch data for inventory calculation
  const { data: apiItems = [] } = useGetItemsQuery(undefined);
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery(undefined);
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
  const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);
  const { data: stores = [] } = useGetStoresQuery(undefined);
  const { data: allStoreItems = [] } = useGetAllStoreItemsQuery();
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  
  // Fetch data for customer balance calculation
  const { isAuthed } = useAuth();
  const skip = !isAuthed;
  const { data: apiCustomers = [] } = useGetCustomersQuery(undefined);
  const { data: apiSuppliers = [] } = useGetSuppliersQuery(undefined);
  const { data: apiReceivableAccounts = [] } = useGetReceivableAccountsQuery(undefined);
  const { data: apiPayableAccounts = [] } = useGetPayableAccountsQuery(undefined);
  const { data: apiReceiptVouchers = [] } = useGetReceiptVouchersQuery(undefined, { skip });
  const { data: apiPaymentVouchers = [] } = useGetPaymentVouchersQuery(undefined, { skip });
  
  // Fetch data for safe and bank balance calculations
  const { data: apiSafes = [] } = useGetSafesQuery(undefined);
  const { data: apiBanks = [] } = useGetBanksQuery(undefined);
  const { data: apiInternalTransfers = [] } = useGetInternalTransfersQuery();

  // Map inventory valuation method to valuation method string
  const inventoryValuationMethod = useMemo(() => {
    if (!financialSettings?.inventoryValuationMethod) {
      return "averageCost"; // Default
    }
    
    if (financialSettings.inventoryValuationMethod === ValuationMethod.WEIGHTED_AVERAGE) {
      return "averageCost";
    }
    
    if (financialSettings.inventoryValuationMethod === ValuationMethod.FIFO || 
        financialSettings.inventoryValuationMethod === ValuationMethod.LAST_PURCHASE_PRICE) {
      return "purchasePrice";
    }
    
    return "averageCost"; // Default fallback
  }, [financialSettings?.inventoryValuationMethod]);

  // Helper to normalize date to YYYY-MM-DD
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
      } catch {
        // ignore
      }
      return "";
    };
  }, []);

  // Safely convert any numeric-like value to a finite number
  const toNumber = useCallback((value: any): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  // Helper function to resolve record amount (matching SafeStatementReport and BankStatementReport)
  const resolveRecordAmount = useCallback((record: any): number => {
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
  }, []);

  // Aggregate opening balances from all StoreItems across all stores/branches
  const aggregatedOpeningBalances = useMemo(() => {
    const balanceMap: Record<string, number> = {};
    
    (allStoreItems as any[]).forEach((storeItem) => {
      const itemCode = storeItem.item?.code;
      if (itemCode) {
        balanceMap[itemCode] = (balanceMap[itemCode] || 0) + toNumber(storeItem.openingBalance || 0);
      }
    });
    
    return balanceMap;
  }, [allStoreItems, toNumber]);

  // Transform items to filter out services
  const transformedItems = useMemo(() => {
    return (apiItems as any[])
      .filter((item) => {
        const itemType = (item.type || item.itemType || "").toUpperCase();
        return itemType !== "SERVICE";
      })
      .map((item) => ({
        ...item,
        unit: item.unit?.name || "",
        group: item.group?.name || "",
      }));
  }, [apiItems]);

  // Transform transactions for inventory calculation
  const transformedSalesInvoices = useMemo(() => {
    return (apiSalesInvoices as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      customerOrSupplier: invoice.customer
        ? {
            id: invoice.customer.id.toString(),
            name: invoice.customer.name,
          }
        : invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
      totals: invoice.totals || {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiSalesInvoices]);

  const transformedSalesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      customerOrSupplier: invoice.customer
        ? {
            id: invoice.customer.id.toString(),
            name: invoice.customer.name,
          }
        : invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
      totals: invoice.totals || {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiSalesReturns]);

  const transformedPurchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
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
      totals: invoice.totals || {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiPurchaseInvoices]);

  const transformedPurchaseReturns = useMemo(() => {
    return (apiPurchaseReturns as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiPurchaseReturns]);

  const transformedStoreReceiptVouchers = useMemo(() => {
    return (storeReceiptVouchers as any[]).map((voucher) => ({
      ...voucher,
      branch: voucher.store?.branch?.name || "",
      items: voucher.items.map((item) => ({
        ...item,
        id: item.item?.code || item.itemId,
        name: item.item?.name || "",
        unit: item.item?.unit?.name || "",
        qty: item.quantity,
      })),
    }));
  }, [storeReceiptVouchers]);

  const transformedStoreIssueVouchers = useMemo(() => {
    return (storeIssueVouchers as any[]).map((voucher) => ({
      ...voucher,
      branch: voucher.store?.branch?.name || "",
      items: voucher.items.map((item) => ({
        ...item,
        id: item.item?.code || item.itemId,
        name: item.item?.name || "",
        unit: item.item?.unit?.name || "",
        qty: item.quantity,
      })),
    }));
  }, [storeIssueVouchers]);

  const transformedStoreTransferVouchers = useMemo(() => {
    return (storeTransferVouchers as any[])
      .filter((v) => v.status === 'ACCEPTED')
      .map((voucher) => ({
        ...voucher,
        fromStore: voucher.fromStore?.name || "",
        toStore: voucher.toStore?.name || "",
        items: voucher.items.map((item) => ({
          ...item,
          id: item.item?.code || item.itemId,
          name: item.item?.name || "",
          unit: item.item?.unit?.name || "",
          qty: item.quantity,
        })),
      }));
  }, [storeTransferVouchers]);

  // Transform vouchers for customer balance calculation (matching CustomerBalanceReport format)
  const receiptVouchers = useMemo(() => {
    return apiReceiptVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || voucher.receivableAccountId || voucher.payableAccountId || "",
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
  }, [apiReceiptVouchers, normalizeDate]);

  const paymentVouchers = useMemo(() => {
    return apiPaymentVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || voucher.receivableAccountId || voucher.payableAccountId || "",
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
  }, [apiPaymentVouchers, normalizeDate]);

  // Helper function to get last purchase price before or on a reference date
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const relevantInvoices = transformedPurchaseInvoices
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.date) || normalizeDate(a.invoiceDate) || "";
        const dateB = normalizeDate(b.date) || normalizeDate(b.invoiceDate) || "";
        return dateB.localeCompare(dateA); // Descending order
      });

    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null;
  }, [transformedPurchaseInvoices, normalizeDate]);

  // Helper function to calculate weighted average cost
  const calculateWeightedAverageCost = useCallback((item: any, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const itemCode = item.code;
    const openingBalance = aggregatedOpeningBalances[itemCode] || 0;
    const initialPurchasePrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);

    const relevantInvoices = transformedPurchaseInvoices
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      });

    let totalCost = openingBalance > 0 ? openingBalance * initialPurchasePrice : 0;
    let totalQty = openingBalance;

    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.total && invItem.qty) {
          totalCost += toNumber(invItem.total);
          totalQty += toNumber(invItem.qty);
        }
      }
    }

    if (totalQty === 0) {
      return initialPurchasePrice > 0 ? initialPurchasePrice : null;
    }
    
    return totalCost / totalQty;
  }, [transformedPurchaseInvoices, normalizeDate, toNumber, aggregatedOpeningBalances]);

  // Calculate inventory value using shared utility
  const calculatedInventoryValue = useMemo(() => {
    const { totalValue } = calculateCompanyInventoryValuation({
      items: transformedItems,
      aggregatedOpeningBalances,
      purchaseInvoices: transformedPurchaseInvoices,
      salesInvoices: transformedSalesInvoices,
      purchaseReturns: transformedPurchaseReturns,
      salesReturns: transformedSalesReturns,
      storeReceiptVouchers: transformedStoreReceiptVouchers,
      storeIssueVouchers: transformedStoreIssueVouchers,
      storeTransferVouchers: transformedStoreTransferVouchers,
      stores,
      endDate: toDate,
      valuationMethod: inventoryValuationMethod,
      normalizeDate,
      toNumber,
      getLastPurchasePriceBeforeDate,
      calculateWeightedAverageCost,
    });
    return totalValue;
  }, [
    transformedItems,
    toDate,
    transformedSalesInvoices,
    transformedSalesReturns,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    transformedStoreReceiptVouchers,
    transformedStoreIssueVouchers,
    transformedStoreTransferVouchers,
    stores,
    normalizeDate,
    toNumber,
    getLastPurchasePriceBeforeDate,
    calculateWeightedAverageCost,
    inventoryValuationMethod,
    aggregatedOpeningBalances,
  ]);

  // Calculate beginning inventory for current period using current valuation method
  // This mirrors BalanceSheet: inventory as of the day before fromDate
  const calculatedBeginningInventory = useMemo(() => {
    const normalizedStartDate = normalizeDate(fromDate);
    if (!normalizedStartDate) return 0;

    const start = new Date(normalizedStartDate);
    if (Number.isNaN(start.getTime())) return 0;

    // Day before start date
    const dayBeforeStart = new Date(start);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const dayBeforeStartString = dayBeforeStart.toISOString().split('T')[0];

    const { totalValue } = calculateCompanyInventoryValuation({
      items: transformedItems,
      aggregatedOpeningBalances,
      purchaseInvoices: transformedPurchaseInvoices,
      salesInvoices: transformedSalesInvoices,
      purchaseReturns: transformedPurchaseReturns,
      salesReturns: transformedSalesReturns,
      storeReceiptVouchers: transformedStoreReceiptVouchers,
      storeIssueVouchers: transformedStoreIssueVouchers,
      storeTransferVouchers: transformedStoreTransferVouchers,
      stores,
      endDate: dayBeforeStartString,
      valuationMethod: inventoryValuationMethod,
      normalizeDate,
      toNumber,
      getLastPurchasePriceBeforeDate,
      calculateWeightedAverageCost,
    });

    return totalValue;
  }, [
    fromDate,
    transformedItems,
    aggregatedOpeningBalances,
    transformedPurchaseInvoices,
    transformedSalesInvoices,
    transformedPurchaseReturns,
    transformedSalesReturns,
    transformedStoreReceiptVouchers,
    transformedStoreIssueVouchers,
    transformedStoreTransferVouchers,
    stores,
    inventoryValuationMethod,
    normalizeDate,
    toNumber,
    getLastPurchasePriceBeforeDate,
    calculateWeightedAverageCost,
  ]);

  // Calculate customer balances using the same logic as CustomerBalanceReport
  const calculatedCustomerBalance = useMemo(() => {
    const customers = apiCustomers as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    customers.forEach((customer) => {
      const customerIdStr = customer.id.toString();
      const customerId = customer.id;

      // Calculate opening balance up to start date (matching CustomerBalanceReport logic)
      const openingSales = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return (invCustomerId === customerIdStr || invCustomerId == customerId) && invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingReturns = transformedSalesReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return (invCustomerId === customerIdStr || invCustomerId == customerId) && invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingCashReturns = transformedSalesReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invCustomerId === customerIdStr || invCustomerId == customerId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingCashInvoices = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invCustomerId === customerIdStr || invCustomerId == customerId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingReceipts = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "customer" &&
            (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const openingPayments = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "customer" &&
            (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = customer.openingBalance + openingDebit - openingCredit
      const customerOpeningDebit = openingSales + openingCashReturns + openingPayments;
      const customerOpeningCredit = openingCashInvoices + openingReturns + openingReceipts;
      const opening = customer.openingBalance + customerOpeningDebit - customerOpeningCredit;

      // Calculate period transactions (between start and end date)
      const periodSales = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return (invCustomerId === customerIdStr || invCustomerId == customerId) && 
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodReturns = transformedSalesReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return (invCustomerId === customerIdStr || invCustomerId == customerId) && 
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodCashReturns = transformedSalesReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invCustomerId === customerIdStr || invCustomerId == customerId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodCashInvoices = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invCustomerId === customerIdStr || invCustomerId == customerId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodReceipts = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "customer" &&
            (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const periodPayments = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "customer" &&
            (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Period Debit: all sales invoices, cash sales returns, payment vouchers
      const customerPeriodDebit = periodSales + periodCashReturns + periodPayments;
      // Period Credit: cash sales invoices, all sales returns, receipt vouchers
      const customerPeriodCredit = periodCashInvoices + periodReturns + periodReceipts;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += customerPeriodDebit;
      totalPeriodCredit += customerPeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiCustomers,
    transformedSalesInvoices,
    transformedSalesReturns,
    receiptVouchers,
    paymentVouchers,
    fromDate,
    toDate,
    normalizeDate,
    toNumber,
  ]);

  // Calculate supplier balances using the same logic as SupplierBalanceReport
  const calculatedSupplierBalance = useMemo(() => {
    const suppliers = apiSuppliers as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    suppliers.forEach((supplier) => {
      const supplierIdStr = supplier.id.toString();
      const supplierId = supplier.id;

      // Calculate opening balance up to start date (matching SupplierBalanceReport logic)
      const openingPurchases = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingCashPurchases = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingReturns = transformedPurchaseReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const openingCashReturns = transformedPurchaseReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingPayments = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const openingReceipts = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = supplier.openingBalance + openingDebit - openingCredit
      // Debit (decreases what we owe): cash purchases, all purchase returns, payment vouchers
      // Credit (increases what we owe): all purchase invoices, cash purchase returns, receipt vouchers (refunds from supplier)
      const supplierOpeningDebit = openingCashPurchases + openingReturns + openingPayments;
      const supplierOpeningCredit = openingPurchases + openingCashReturns + openingReceipts;
      const opening = (supplier.openingBalance || 0) + supplierOpeningDebit - supplierOpeningCredit;

      // Calculate period transactions (between start and end date)
      const periodPurchases = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodCashPurchases = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodReturns = transformedPurchaseReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const periodCashReturns = transformedPurchaseReturns
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          const invSupplierId = inv.customerOrSupplier?.id || inv.supplierId?.toString() || (inv.supplier?.id?.toString());
          return inv.paymentMethod === "cash" &&
            (invSupplierId === supplierIdStr || invSupplierId == supplierId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodPayments = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const periodReceipts = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
          return v.entity?.type === "supplier" &&
            (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Period Debit: cash purchases, all purchase returns, payment vouchers (all decrease what we owe)
      const supplierPeriodDebit = periodCashPurchases + periodReturns + periodPayments;
      // Period Credit: all purchase invoices, cash purchase returns, receipt vouchers (all increase what we owe)
      const supplierPeriodCredit = periodPurchases + periodCashReturns + periodReceipts;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += supplierPeriodDebit;
      totalPeriodCredit += supplierPeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiSuppliers,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    receiptVouchers,
    paymentVouchers,
    fromDate,
    toDate,
    normalizeDate,
    toNumber,
  ]);

  // Calculate safe balances using the same logic as SafeStatementReport (aggregated across all safes)
  const calculatedSafeBalance = useMemo(() => {
    const safes = apiSafes as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    safes.forEach((safe) => {
      const safeId = safe.id?.toString() || "";
      const matchesSafeValue = (value: any) => value?.toString() === safeId;
      const matchesSafeRecord = (record: any) => {
        if (!record) return false;
        if (matchesSafeValue(record.safeId)) return true;
        if (record.isSplitPayment === true && matchesSafeValue(record.splitSafeId)) {
          return true;
        }
        return false;
      };

      // Opening balance calculations (before fromDate)
      const receiptsBefore = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesBefore = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "safe" &&
            matchesSafeRecord(inv) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesBefore = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const purchaseInvoicesBefore = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "safe" &&
            matchesSafeRecord(inv) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesBefore = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const salesReturnsBefore = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "safe" &&
            matchesSafeRecord(ret) &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsBefore = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const purchaseReturnsBefore = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "safe" &&
            matchesSafeRecord(ret) &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsBefore = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const outgoingBefore = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "safe" &&
            matchesSafeValue(t.fromSafeId) &&
            tDate < fromDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingBefore = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "safe" &&
            matchesSafeValue(t.toSafeId) &&
            tDate < fromDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const opening = safe.openingBalance 
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

      // Period calculations (between fromDate and toDate)
      const receiptsPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "safe" &&
            matchesSafeValue(v.safeOrBankId) &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesPeriod = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "safe" &&
            matchesSafeRecord(inv) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesPeriod = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const purchaseInvoicesPeriod = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "safe" &&
            matchesSafeRecord(inv) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesPeriod = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            matchesSafeValue(inv.splitSafeId) &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

      const salesReturnsPeriod = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "safe" &&
            matchesSafeRecord(ret) &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsPeriod = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const purchaseReturnsPeriod = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "safe" &&
            matchesSafeRecord(ret) &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsPeriod = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            matchesSafeValue(ret.splitSafeId) &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

      const outgoingPeriod = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "safe" &&
            matchesSafeValue(t.fromSafeId) &&
            tDate >= fromDate && tDate <= toDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingPeriod = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "safe" &&
            matchesSafeValue(t.toSafeId) &&
            tDate >= fromDate && tDate <= toDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Period debit = incoming transactions
      const safePeriodDebit = receiptsPeriod 
        + salesInvoicesPeriod 
        + splitSalesInvoicesPeriod
        + purchaseReturnsPeriod 
        + splitPurchaseReturnsPeriod
        + incomingPeriod;

      // Period credit = outgoing transactions
      const safePeriodCredit = paymentsPeriod 
        + purchaseInvoicesPeriod 
        + splitPurchaseInvoicesPeriod
        + salesReturnsPeriod 
        + splitSalesReturnsPeriod
        + outgoingPeriod;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += safePeriodDebit;
      totalPeriodCredit += safePeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiSafes,
    receiptVouchers,
    paymentVouchers,
    transformedSalesInvoices,
    transformedPurchaseInvoices,
    transformedSalesReturns,
    transformedPurchaseReturns,
    apiInternalTransfers,
    fromDate,
    toDate,
    normalizeDate,
    resolveRecordAmount,
  ]);

  // Calculate bank balances using the same logic as BankStatementReport (aggregated across all banks)
  const calculatedBankBalance = useMemo(() => {
    const banks = apiBanks as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    banks.forEach((bank) => {
      const bankId = bank.id?.toString() || "";

      // Opening balance calculations (before fromDate)
      const receiptsBefore = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate < fromDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesBefore = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesBefore = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const purchaseInvoicesBefore = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesBefore = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate < fromDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const salesReturnsBefore = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsBefore = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const purchaseReturnsBefore = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsBefore = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate < fromDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const outgoingBefore = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "bank" &&
            t.fromBankId === bankId &&
            tDate < fromDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingBefore = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "bank" &&
            t.toBankId === bankId &&
            tDate < fromDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const opening = bank.openingBalance 
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

      // Period calculations (between fromDate and toDate)
      const receiptsPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          return v.paymentMethod === "bank" &&
            v.safeOrBankId?.toString() === bankId &&
            vDate >= fromDate && vDate <= toDate;
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const salesInvoicesPeriod = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitSalesInvoicesPeriod = transformedSalesInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const purchaseInvoicesPeriod = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            !inv.isSplitPayment &&
            inv.paymentTargetType === "bank" &&
            inv.paymentTargetId === bankId &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

      const splitPurchaseInvoicesPeriod = transformedPurchaseInvoices
        .filter((inv) => {
          const invDate = normalizeDate(inv.date);
          return inv.paymentMethod === "cash" &&
            inv.isSplitPayment === true &&
            inv.splitBankId?.toString() === bankId &&
            invDate >= fromDate && invDate <= toDate;
        })
        .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

      const salesReturnsPeriod = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitSalesReturnsPeriod = transformedSalesReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const purchaseReturnsPeriod = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            !ret.isSplitPayment &&
            ret.paymentTargetType === "bank" &&
            ret.paymentTargetId === bankId &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

      const splitPurchaseReturnsPeriod = transformedPurchaseReturns
        .filter((ret) => {
          const retDate = normalizeDate(ret.date);
          return ret.paymentMethod === "cash" &&
            ret.isSplitPayment === true &&
            ret.splitBankId?.toString() === bankId &&
            retDate >= fromDate && retDate <= toDate;
        })
        .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

      const outgoingPeriod = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.fromType === "bank" &&
            t.fromBankId === bankId &&
            tDate >= fromDate && tDate <= toDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const incomingPeriod = apiInternalTransfers
        .filter((t) => {
          const tDate = normalizeDate(t.date);
          return t.toType === "bank" &&
            t.toBankId === bankId &&
            tDate >= fromDate && tDate <= toDate;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Period debit = incoming transactions
      const bankPeriodDebit = receiptsPeriod 
        + salesInvoicesPeriod 
        + splitSalesInvoicesPeriod
        + purchaseReturnsPeriod 
        + splitPurchaseReturnsPeriod
        + incomingPeriod;

      // Period credit = outgoing transactions
      const bankPeriodCredit = paymentsPeriod 
        + purchaseInvoicesPeriod 
        + splitPurchaseInvoicesPeriod
        + salesReturnsPeriod 
        + splitSalesReturnsPeriod
        + outgoingPeriod;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += bankPeriodDebit;
      totalPeriodCredit += bankPeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiBanks,
    receiptVouchers,
    paymentVouchers,
    transformedSalesInvoices,
    transformedPurchaseInvoices,
    transformedSalesReturns,
    transformedPurchaseReturns,
    apiInternalTransfers,
    fromDate,
    toDate,
    normalizeDate,
    resolveRecordAmount,
  ]);

  // Calculate other receivables balances using the same logic as TotalReceivableAccountsReport
  const calculatedOtherReceivablesBalance = useMemo(() => {
    const receivableAccounts = apiReceivableAccounts as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    receivableAccounts.forEach((account) => {
      const accountId = account.id;
      const accountIdStr = accountId.toString();

      // Calculate transactions before start date for opening balance
      const receiptsBefore = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate < fromDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate < fromDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = base opening balance + payments before start date - receipts before start date
      const opening = (account.openingBalance || 0) + paymentsBefore - receiptsBefore;

      // Calculate transactions within date range
      const receiptsPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= fromDate && vDate <= toDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= fromDate && vDate <= toDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Period Debit = payment vouchers (increases receivable)
      // Period Credit = receipt vouchers (decreases receivable)
      const accountPeriodDebit = paymentsPeriod;
      const accountPeriodCredit = receiptsPeriod;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += accountPeriodDebit;
      totalPeriodCredit += accountPeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiReceivableAccounts,
    receiptVouchers,
    paymentVouchers,
    fromDate,
    toDate,
    normalizeDate,
  ]);

  // Calculate other payables balances using the same logic as TotalPayableAccountsReport
  const calculatedOtherPayablesBalance = useMemo(() => {
    const payableAccounts = apiPayableAccounts as any[];
    
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;

    payableAccounts.forEach((account) => {
      const accountId = account.id;
      const accountIdStr = accountId.toString();

      // Calculate transactions before start date for opening balance
      const receiptsBefore = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate < fromDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate < fromDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = base opening balance + payments before start date - receipts before start date
      const opening = (account.openingBalance || 0) + paymentsBefore - receiptsBefore;

      // Calculate transactions within date range
      const receiptsPeriod = receiptVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= fromDate && vDate <= toDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsPeriod = paymentVouchers
        .filter((v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= fromDate && vDate <= toDate
          );
        })
        .reduce((sum, v) => sum + v.amount, 0);

      // Period Debit = payment vouchers (decreases payable)
      // Period Credit = receipt vouchers (increases payable)
      const accountPeriodDebit = paymentsPeriod;
      const accountPeriodCredit = receiptsPeriod;

      // Aggregate totals
      if (opening > 0) {
        totalOpeningDebit += opening;
      } else {
        totalOpeningCredit += Math.abs(opening);
      }
      totalPeriodDebit += accountPeriodDebit;
      totalPeriodCredit += accountPeriodCredit;
    });

    // Calculate closing balance
    const netOpening = totalOpeningDebit - totalOpeningCredit;
    const netClosing = netOpening + totalPeriodDebit - totalPeriodCredit;
    const closingDebit = netClosing > 0 ? netClosing : 0;
    const closingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;

    return {
      openingBalanceDebit: totalOpeningDebit,
      openingBalanceCredit: totalOpeningCredit,
      periodDebit: totalPeriodDebit,
      periodCredit: totalPeriodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    apiPayableAccounts,
    receiptVouchers,
    paymentVouchers,
    fromDate,
    toDate,
    normalizeDate,
  ]);

  // Calculate other revenues balances using the same logic as TotalRevenueReport/backend
  // Revenue from receipt vouchers with revenueCodeId in period (period credit only, no opening balance)
  const calculatedOtherRevenuesBalance = useMemo(() => {
    // Filter receipt vouchers with revenueCodeId (entity?.type === 'revenue') in period
    const revenueVouchersPeriod = receiptVouchers.filter((v) => {
      const vDate = normalizeDate(v.date);
      return v.entity?.type === "revenue" &&
        vDate >= fromDate && vDate <= toDate;
    });

    const periodCredit = revenueVouchersPeriod.reduce((sum, v) => sum + (v.amount || 0), 0);

    return {
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: 0,
      periodCredit: periodCredit,
      closingBalanceDebit: 0,
      closingBalanceCredit: periodCredit,
    };
  }, [
    receiptVouchers,
    fromDate,
    toDate,
    normalizeDate,
  ]);

  // Calculate VAT payable balances using the same logic as backend and BalanceSheet
  // VAT = Sales Tax - Sales Returns Tax - Purchase Tax + Purchase Returns Tax
  // + VAT from Receipt Vouchers (debit) - VAT from Payment Vouchers (credit) - Expense-Type Tax (credit)
  const calculatedVatPayableBalance = useMemo(() => {
    // Opening VAT from invoices (before fromDate)
    const salesTaxBefore = transformedSalesInvoices
      .filter((inv) => normalizeDate(inv.date) < fromDate)
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const salesReturnsTaxBefore = transformedSalesReturns
      .filter((inv) => normalizeDate(inv.date) < fromDate)
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const purchaseTaxBefore = transformedPurchaseInvoices
      .filter((inv) => normalizeDate(inv.date) < fromDate)
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const purchaseReturnsTaxBefore = transformedPurchaseReturns
      .filter((inv) => normalizeDate(inv.date) < fromDate)
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    // Opening VAT from vouchers (before fromDate)
    // Receipt vouchers with entityType === 'vat' (debit - VAT collected)
    const receiptVatBefore = (apiReceiptVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'vat' && v.amount && v.amount > 0 && vDate < fromDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    // Payment vouchers with entityType === 'vat' (credit - VAT paid)
    const paymentVatBefore = (apiPaymentVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'vat' && v.amount && v.amount > 0 && vDate < fromDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    // Payment vouchers with entityType === 'expense-Type' and taxPrice > 0 (credit)
    const expenseTaxBefore = (apiPaymentVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'expense-Type' && v.taxPrice && v.taxPrice > 0 && vDate < fromDate;
      })
      .reduce((sum, v) => sum + (v.taxPrice || 0), 0);

    // Calculate opening balance following VATStatementReport convention:
    // Opening Debit (مدين) = Sales Tax + Purchase Returns Tax + Receipt VAT vouchers
    // Opening Credit (دائن) = Purchase Tax + Sales Returns Tax + Payment VAT vouchers + Expense-Type Tax
    // Opening Balance = Credit - Debit (positive = we owe VAT, negative = we're owed VAT)
    const openingDebit = salesTaxBefore + purchaseReturnsTaxBefore + receiptVatBefore;
    const openingCredit = purchaseTaxBefore + salesReturnsTaxBefore + paymentVatBefore + expenseTaxBefore;
    
    // Net opening VAT (positive = credit balance, negative = debit balance)
    const netOpeningVat = openingCredit - openingDebit;
    const finalOpeningDebit = netOpeningVat < 0 ? Math.abs(netOpeningVat) : 0;
    const finalOpeningCredit = netOpeningVat > 0 ? netOpeningVat : 0;

    // Period movements from invoices
    const salesTaxPeriod = transformedSalesInvoices
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const salesReturnsTaxPeriod = transformedSalesReturns
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const purchaseTaxPeriod = transformedPurchaseInvoices
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    const purchaseReturnsTaxPeriod = transformedPurchaseReturns
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + (inv.tax || inv.totals?.tax || 0), 0);

    // Period movements from vouchers
    // Receipt vouchers with entityType === 'vat' (debit - VAT collected, increases VAT payable)
    const receiptVatPeriod = (apiReceiptVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'vat' && v.amount && v.amount > 0 && vDate >= fromDate && vDate <= toDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    // Payment vouchers with entityType === 'vat' (credit - VAT paid, decreases VAT payable)
    const paymentVatPeriod = (apiPaymentVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'vat' && v.amount && v.amount > 0 && vDate >= fromDate && vDate <= toDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    // Payment vouchers with entityType === 'expense-Type' and taxPrice > 0 (credit - decreases VAT payable)
    const expenseTaxPeriod = (apiPaymentVouchers as any[])
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return v.entityType === 'expense-Type' && v.taxPrice && v.taxPrice > 0 && vDate >= fromDate && vDate <= toDate;
      })
      .reduce((sum, v) => sum + (v.taxPrice || 0), 0);

    // Following VATStatementReport convention:
    // Period Debit (مدين) = Sales Tax + Purchase Returns Tax + Receipt VAT vouchers (increases VAT payable)
    // Period Credit (دائن) = Purchase Tax + Sales Returns Tax + Payment VAT vouchers + Expense-Type Tax (decreases VAT payable)
    const periodDebit = salesTaxPeriod + purchaseReturnsTaxPeriod + receiptVatPeriod;
    const periodCredit = purchaseTaxPeriod + salesReturnsTaxPeriod + paymentVatPeriod + expenseTaxPeriod;

    // Calculate closing balance following VATStatementReport: closing = opening + credit - debit
    // Where opening is the net opening balance (credit - debit)
    const netOpening = finalOpeningCredit - finalOpeningDebit;
    const netClosing = netOpening + periodCredit - periodDebit;
    const closingDebit = netClosing < 0 ? Math.abs(netClosing) : 0;
    const closingCredit = netClosing > 0 ? netClosing : 0;

    return {
      openingBalanceDebit: finalOpeningDebit,
      openingBalanceCredit: finalOpeningCredit,
      periodDebit: periodDebit,
      periodCredit: periodCredit,
      closingBalanceDebit: closingDebit,
      closingBalanceCredit: closingCredit,
    };
  }, [
    transformedSalesInvoices,
    transformedSalesReturns,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    apiReceiptVouchers,
    apiPaymentVouchers,
    fromDate,
    toDate,
    normalizeDate,
  ]);

  // Calculate earned discount (خصم مكتسب) - Revenue category, Account code 4202
  // periodDebit: discounts from purchase invoices, periodCredit: discounts from purchase returns
  const calculatedEarnedDiscount = useMemo(() => {
    const purchaseInvoicesDiscount = transformedPurchaseInvoices
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + toNumber(inv.totals?.discount || inv.discount || 0), 0);

    const purchaseReturnsDiscount = transformedPurchaseReturns
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + toNumber(inv.totals?.discount || inv.discount || 0), 0);

    const periodDebit = purchaseInvoicesDiscount;
    const periodCredit = purchaseReturnsDiscount;
    const netClosing = periodCredit - periodDebit; // Revenue: credit - debit

    return {
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: periodDebit,
      periodCredit: periodCredit,
      closingBalanceDebit: netClosing < 0 ? Math.abs(netClosing) : 0,
      closingBalanceCredit: netClosing > 0 ? netClosing : 0,
    };
  }, [transformedPurchaseInvoices, transformedPurchaseReturns, fromDate, toDate, normalizeDate, toNumber]);

  // Calculate allowed discount (خصم مسموح به) - Expenses category, Account code 5205
  // periodDebit: discounts from sales invoices, periodCredit: discounts from sales returns
  const calculatedAllowedDiscount = useMemo(() => {
    const salesInvoicesDiscount = transformedSalesInvoices
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + toNumber(inv.totals?.discount || inv.discount || 0), 0);

    const salesReturnsDiscount = transformedSalesReturns
      .filter((inv) => {
        const invDate = normalizeDate(inv.date);
        return invDate >= fromDate && invDate <= toDate;
      })
      .reduce((sum, inv) => sum + toNumber(inv.totals?.discount || inv.discount || 0), 0);

    const periodDebit = salesInvoicesDiscount;
    const periodCredit = salesReturnsDiscount;
    const netClosing = periodDebit - periodCredit;

    return {
      openingBalanceDebit: 0,
      openingBalanceCredit: 0,
      periodDebit: periodDebit,
      periodCredit: periodCredit,
      closingBalanceDebit: netClosing > 0 ? netClosing : 0,
      closingBalanceCredit: netClosing < 0 ? Math.abs(netClosing) : 0,
    };
  }, [transformedSalesInvoices, transformedSalesReturns, fromDate, toDate, normalizeDate, toNumber]);

  // Process and verify entries with correct calculations
  // Based on backend logic:
  // - Assets/Expenses: closingDebit = openingDebit + periodDebit - periodCredit (if negative, becomes closingCredit)
  // - Liabilities/Equity/Revenue: closingCredit = openingCredit + periodCredit - periodDebit (if negative, becomes closingDebit)
  // For inventory account (1301 / مخزون البضاعة), override closing balance with calculated inventory value
  // For customer account (1201 / العملاء), override with calculated customer balance matching CustomerBalanceReport
  const processedData = useMemo(() => {
    return (auditTrialData?.entries || []).map((entry) => {
      // Check if this is the inventory account
      const isInventoryAccount = entry.accountCode === '1301' || entry.accountName === 'مخزون البضاعة';
      // Check if this is the customer account
      const isCustomerAccount = entry.accountCode === '1201' || entry.accountName === 'العملاء';
      // Check if this is the safe account
      const isSafeAccount = entry.accountCode === '1101' || entry.accountName === 'النقدية';
      // Check if this is the bank account
      const isBankAccount = entry.accountCode === '1102' || entry.accountName === 'البنوك';
      // Check if this is the supplier account
      const isSupplierAccount = entry.accountCode === '2101' || entry.accountName === 'الموردين';
      // Check if this is the other receivables account
      const isOtherReceivablesAccount = entry.accountCode === '1202' || entry.accountName === 'ارصدة مدينة اخري';
      // Check if this is the other payables account
      const isOtherPayablesAccount = entry.accountCode === '2102' || entry.accountName === 'ارصدة دائنة اخري';
      // Check if this is the other revenues account
      const isOtherRevenuesAccount = entry.accountCode === '4201' || entry.accountName === 'ايرادات اخري';
      // Check if this is the VAT payable account
      const isVatPayableAccount = entry.accountCode === '2201' || entry.accountName === 'ضريبة القيمة المضافة';
      // Check if this is the partners account
      const isPartnersAccount = entry.accountCode === '3201' || entry.accountName === 'جاري الشركاء';
      
      let calculatedClosingDebit = 0;
      let calculatedClosingCredit = 0;
      
      if (isInventoryAccount) {
        // Override inventory account closing balance with calculated inventory value
        // Inventory is an asset, so positive value goes to debit, negative to credit
        if (calculatedInventoryValue > 0) {
          calculatedClosingDebit = calculatedInventoryValue;
          calculatedClosingCredit = 0;
        } else {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = Math.abs(calculatedInventoryValue);
        }
      } else if (isCustomerAccount) {
        // Override customer account with calculated customer balance (matching CustomerBalanceReport)
        calculatedClosingDebit = calculatedCustomerBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedCustomerBalance.closingBalanceCredit;
      } else if (isSupplierAccount) {
        // Override supplier account with calculated supplier balance (matching SupplierBalanceReport)
        calculatedClosingDebit = calculatedSupplierBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedSupplierBalance.closingBalanceCredit;
      } else if (isOtherReceivablesAccount) {
        // Override other receivables account with calculated balance (matching TotalReceivableAccountsReport)
        calculatedClosingDebit = calculatedOtherReceivablesBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedOtherReceivablesBalance.closingBalanceCredit;
      } else if (isOtherPayablesAccount) {
        // Override other payables account with calculated balance (matching TotalPayableAccountsReport)
        calculatedClosingDebit = calculatedOtherPayablesBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedOtherPayablesBalance.closingBalanceCredit;
      } else if (isOtherRevenuesAccount) {
        // Override other revenues account with calculated balance (matching backend/TotalRevenueReport)
        calculatedClosingDebit = calculatedOtherRevenuesBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedOtherRevenuesBalance.closingBalanceCredit;
      } else if (isVatPayableAccount) {
        // Override VAT payable account with calculated balance (matching backend)
        calculatedClosingDebit = calculatedVatPayableBalance.closingBalanceDebit;
        calculatedClosingCredit = calculatedVatPayableBalance.closingBalanceCredit;
      } else if (isPartnersAccount) {
        // For partners account: calculate net balance and transform
        // Net = closingCredit - closingDebit (since it's Equity, credit is typically positive)
        // If positive → show in debit (مدين), if negative → show in credit (دائن)
        const netBalance = entry.closingBalanceCredit - entry.closingBalanceDebit;
        if (netBalance > 0) {
          calculatedClosingDebit = netBalance;
          calculatedClosingCredit = 0;
        } else {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = Math.abs(netBalance);
        }
      } else if (entry.category === 'Assets' || entry.category === 'Expenses') {
        // Assets and Expenses: closingDebit = openingDebit + periodDebit - periodCredit
        const closingDebit = entry.openingBalanceDebit + entry.periodDebit - entry.periodCredit;
        if (closingDebit > 0) {
          calculatedClosingDebit = closingDebit;
          calculatedClosingCredit = 0;
        } else {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = Math.abs(closingDebit);
        }
      } else {
        // Liabilities, Equity, Revenue: closingCredit = openingCredit + periodCredit - periodDebit
        const closingCredit = entry.openingBalanceCredit + entry.periodCredit - entry.periodDebit;
        if (closingCredit > 0) {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = closingCredit;
        } else {
          calculatedClosingDebit = Math.abs(closingCredit);
          calculatedClosingCredit = 0;
        }
      }
      
      // For customer, safe, and bank accounts, use calculated values for opening and period balances
      let transformedOpeningDebit: number;
      let transformedOpeningCredit: number;
      let transformedPeriodDebit: number;
      let transformedPeriodCredit: number;
      
      if (isCustomerAccount) {
        // For customer account opening balance: combine debit and credit, show total in one column
        // If positive → show in مدين (debit), if negative → show in دائن (credit)
        const netOpening = calculatedCustomerBalance.openingBalanceDebit - calculatedCustomerBalance.openingBalanceCredit;
        transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
        transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
        transformedPeriodDebit = calculatedCustomerBalance.periodDebit;
        transformedPeriodCredit = calculatedCustomerBalance.periodCredit;
      } else if (isSafeAccount) {
        // Use calculated safe balance values
        transformedOpeningDebit = calculatedSafeBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedSafeBalance.openingBalanceCredit;
        transformedPeriodDebit = calculatedSafeBalance.periodDebit;
        transformedPeriodCredit = calculatedSafeBalance.periodCredit;
      } else if (isBankAccount) {
        // Use calculated bank balance values
        transformedOpeningDebit = calculatedBankBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedBankBalance.openingBalanceCredit;
        transformedPeriodDebit = calculatedBankBalance.periodDebit;
        transformedPeriodCredit = calculatedBankBalance.periodCredit;
      } else if (isSupplierAccount) {
        // For supplier account opening balance: combine debit and credit, show total in one column
        // If positive → show in مدين (debit), if negative → show in دائن (credit)
        const netOpening = calculatedSupplierBalance.openingBalanceDebit - calculatedSupplierBalance.openingBalanceCredit;
        transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
        transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
        transformedPeriodDebit = calculatedSupplierBalance.periodDebit;
        transformedPeriodCredit = calculatedSupplierBalance.periodCredit;
      } else if (isOtherReceivablesAccount) {
        // Use calculated other receivables balance values
        transformedOpeningDebit = calculatedOtherReceivablesBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedOtherReceivablesBalance.openingBalanceCredit;
        transformedPeriodDebit = calculatedOtherReceivablesBalance.periodDebit;
        transformedPeriodCredit = calculatedOtherReceivablesBalance.periodCredit;
      } else if (isOtherPayablesAccount) {
        // Use calculated other payables balance values
        transformedOpeningDebit = calculatedOtherPayablesBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedOtherPayablesBalance.openingBalanceCredit;
        transformedPeriodDebit = calculatedOtherPayablesBalance.periodDebit;
        transformedPeriodCredit = calculatedOtherPayablesBalance.periodCredit;
      } else if (isOtherRevenuesAccount) {
        // Use calculated other revenues balance values
        transformedOpeningDebit = calculatedOtherRevenuesBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedOtherRevenuesBalance.openingBalanceCredit;
        transformedPeriodDebit = calculatedOtherRevenuesBalance.periodDebit;
        transformedPeriodCredit = calculatedOtherRevenuesBalance.periodCredit;
      } else if (isVatPayableAccount) {
        // Use calculated VAT payable balance values
        // Note: For VAT, the columns are reversed to match VATStatementReport convention:
        // Green column (مدين) shows credit transactions, Red column (دائن) shows debit transactions
        transformedOpeningDebit = calculatedVatPayableBalance.openingBalanceDebit;
        transformedOpeningCredit = calculatedVatPayableBalance.openingBalanceCredit;
        // Swap period movements to match VATStatementReport display convention
        transformedPeriodDebit = calculatedVatPayableBalance.periodCredit;
        transformedPeriodCredit = calculatedVatPayableBalance.periodDebit;
      } else if (isPartnersAccount) {
        // For partners account: transform based on sign
        // Opening: net = openingCredit - openingDebit, positive → debit, negative → credit
        const netOpening = entry.openingBalanceCredit - entry.openingBalanceDebit;
        transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
        transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
        // Period: net = periodCredit - periodDebit, positive → debit, negative → credit
        const netPeriod = entry.periodCredit - entry.periodDebit;
        transformedPeriodDebit = netPeriod > 0 ? netPeriod : 0;
        transformedPeriodCredit = netPeriod < 0 ? Math.abs(netPeriod) : 0;
      } else if (isInventoryAccount) {
        // For inventory account:
        // - Opening balance: use calculatedBeginningInventory (valuation-based, as of day before fromDate)
        // - Period movements: set to zero (inventory movement reflected only in closing balance)
        const netOpening = calculatedBeginningInventory;
        transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
        transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
        // Period movements are set to zero for inventory account
        transformedPeriodDebit = 0;
        transformedPeriodCredit = 0;
      } else {
        // Transform opening balance: calculate net balance and split positive to مدين, negative to دائن
        const netOpening = entry.openingBalanceDebit - entry.openingBalanceCredit;
        transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
        transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
        // periodDebit and periodCredit remain unchanged (already represent totals during the period)
        transformedPeriodDebit = entry.periodDebit;
        transformedPeriodCredit = entry.periodCredit;
      }
      
      // Transform closing balance: calculate net balance and split positive to مدين, negative to دائن
      // For partners account, the transformation is already done above, so use calculated values directly
      let transformedClosingDebit: number;
      let transformedClosingCredit: number;
      if (isPartnersAccount) {
        // Use the already transformed values from above
        transformedClosingDebit = calculatedClosingDebit;
        transformedClosingCredit = calculatedClosingCredit;
      } else if (isVatPayableAccount) {
        // For VAT account, swap closing balances to match VATStatementReport display convention
        // Green column (مدين) shows credit balance, Red column (دائن) shows debit balance
        transformedClosingDebit = calculatedClosingCredit;
        transformedClosingCredit = calculatedClosingDebit;
      } else {
        const netClosing = calculatedClosingDebit - calculatedClosingCredit;
        transformedClosingDebit = netClosing > 0 ? netClosing : 0;
        transformedClosingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;
      }
      
      // Return transformed values
      return {
        ...entry,
        openingBalanceDebit: transformedOpeningDebit,
        openingBalanceCredit: transformedOpeningCredit,
        periodDebit: transformedPeriodDebit,
        periodCredit: transformedPeriodCredit,
        closingBalanceDebit: transformedClosingDebit,
        closingBalanceCredit: transformedClosingCredit,
      };
    });
  }, [auditTrialData?.entries, calculatedInventoryValue, calculatedBeginningInventory, calculatedCustomerBalance, calculatedSafeBalance, calculatedBankBalance, calculatedSupplierBalance, calculatedOtherReceivablesBalance, calculatedOtherPayablesBalance, calculatedOtherRevenuesBalance, calculatedVatPayableBalance]);

  // Insert discount entries after their parent accounts
  const processedDataWithDiscounts = useMemo(() => {
    const result = [...processedData];
    
    // Find index of Other Revenues account (4201) to insert earned discount after it
    const otherRevenuesIndex = result.findIndex(
      (entry) => entry.accountCode === '4201' || entry.accountName === 'ايرادات اخري' || entry.accountName === 'الإيرادات الاخري'
    );

    // Find the last expense type entry (highest account code starting with 52) to insert allowed discount after it
    let lastExpenseTypeIndex = -1;
    let highestExpenseCode = -1;
    result.forEach((entry, index) => {
      const codeNum = parseInt(entry.accountCode, 10);
      if (codeNum >= 5201 && codeNum < 5300 && codeNum > highestExpenseCode) {
        highestExpenseCode = codeNum;
        lastExpenseTypeIndex = index;
      }
    });

    // Create earned discount entry (خصم مكتسب) - Account code 4202, Revenue category
    const earnedDiscountEntry: TrialBalanceEntry = {
      id: '4202',
      accountCode: '4202',
      accountName: 'خصم مكتسب',
      category: 'Revenue',
      openingBalanceDebit: calculatedEarnedDiscount.openingBalanceDebit,
      openingBalanceCredit: calculatedEarnedDiscount.openingBalanceCredit,
      periodDebit: calculatedEarnedDiscount.periodDebit,
      periodCredit: calculatedEarnedDiscount.periodCredit,
      closingBalanceDebit: calculatedEarnedDiscount.closingBalanceDebit,
      closingBalanceCredit: calculatedEarnedDiscount.closingBalanceCredit,
    };

    // Create allowed discount entry (خصم مسموح به) - Account code 5205, Expenses category
    const allowedDiscountEntry: TrialBalanceEntry = {
      id: '5205',
      accountCode: '5205',
      accountName: 'خصم مسموح به',
      category: 'Expenses',
      openingBalanceDebit: calculatedAllowedDiscount.openingBalanceDebit,
      openingBalanceCredit: calculatedAllowedDiscount.openingBalanceCredit,
      periodDebit: calculatedAllowedDiscount.periodDebit,
      periodCredit: calculatedAllowedDiscount.periodCredit,
      closingBalanceDebit: calculatedAllowedDiscount.closingBalanceDebit,
      closingBalanceCredit: calculatedAllowedDiscount.closingBalanceCredit,
    };

    // Insert earned discount after Other Revenues (4201)
    if (otherRevenuesIndex !== -1) {
      result.splice(otherRevenuesIndex + 1, 0, earnedDiscountEntry);
      // Adjust expense type index if Other Revenues comes before expense types
      if (lastExpenseTypeIndex !== -1 && otherRevenuesIndex < lastExpenseTypeIndex) {
        lastExpenseTypeIndex++;
      }
    }

    // Insert allowed discount after the last expense type
    if (lastExpenseTypeIndex !== -1) {
      result.splice(lastExpenseTypeIndex + 1, 0, allowedDiscountEntry);
    }

    return result;
  }, [processedData, calculatedAllowedDiscount, calculatedEarnedDiscount]);

  const data = processedDataWithDiscounts;

  const summary = useMemo((): FinancialSummary => {
    return data.reduce((acc, curr) => ({
      totalOpeningDebit: acc.totalOpeningDebit + curr.openingBalanceDebit,
      totalOpeningCredit: acc.totalOpeningCredit + curr.openingBalanceCredit,
      totalPeriodDebit: acc.totalPeriodDebit + curr.periodDebit,
      totalPeriodCredit: acc.totalPeriodCredit + curr.periodCredit,
      totalClosingDebit: acc.totalClosingDebit + curr.closingBalanceDebit,
      totalClosingCredit: acc.totalClosingCredit + curr.closingBalanceCredit,
    }), {
      totalOpeningDebit: 0, totalOpeningCredit: 0,
      totalPeriodDebit: 0, totalPeriodCredit: 0,
      totalClosingDebit: 0, totalClosingCredit: 0
    });
  }, [data]);

  // Verify trial balance: total closing debit should equal total closing credit
  const closingBalanceDifference = Math.abs(summary.totalClosingDebit - summary.totalClosingCredit);
  const isClosingBalanced = closingBalanceDifference < 0.01;
  
  // Verify opening balance: total opening debit should equal total opening credit
  const openingBalanceDifference = Math.abs(summary.totalOpeningDebit - summary.totalOpeningCredit);
  const isOpeningBalanced = openingBalanceDifference < 0.01;
  
  // Verify period movements: total period debit should equal total period credit
  const periodBalanceDifference = Math.abs(summary.totalPeriodDebit - summary.totalPeriodCredit);
  const isPeriodBalanced = periodBalanceDifference < 0.01;
  
  // Overall balance check: all three should balance for a proper trial balance
  const isFullyBalanced = isOpeningBalanced && isPeriodBalanced && isClosingBalanced;
  
  const currency = auditTrialData?.currency || companyInfo?.currency || 'SAR';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002366] mx-auto mb-4"></div>
          <p className="text-[#002366] font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">حدث خطأ أثناء تحميل البيانات</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#002366] text-white rounded-md hover:bg-blue-900"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper
      requiredPermission={buildPermission(Resources.AUDIT_TRAIL, Actions.READ)}
      fallback={
        <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-bold">ليس لديك صلاحية لعرض هذه الصفحة</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] pb-20 font-sans leading-relaxed selection:bg-blue-100">
        {/* Navigation Header - Hidden in Print */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm print:hidden">
          <div className="max-w-[1450px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#002366] rounded-lg flex items-center justify-center text-white shadow-md">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h1 className="text-xl font-black text-[#002366]">نظام التقارير المالية الذكي</h1>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-2 shadow-inner">
                 <div className="px-3 py-1 flex flex-col">
                   <span className="text-[9px] font-black text-slate-400">الفترة من</span>
                   <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs font-black text-[#002366] outline-none" />
                 </div>
                 <div className="w-px bg-slate-300 h-5 self-center"></div>
                 <div className="px-3 py-1 flex flex-col">
                   <span className="text-[9px] font-black text-slate-400">إلى</span>
                   <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs font-black text-[#002366] outline-none" />
                 </div>
              </div>
               <button onClick={() => window.print()} className="bg-[#002366] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-bold text-sm">
                  <i className="fas fa-print"></i>
                  <span>طباعة التقرير</span>
                </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1450px] mx-auto px-8 mt-6">
          
          {/* Company Info Frame - Now strictly positioned above the table */}
          <div className="bg-white border-x-2 border-t-2 border-slate-300 rounded-t-[2rem] p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative">
            <div className="flex gap-6 items-center">
              <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-building text-3xl text-[#002366]"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#002366]">{companyInfo?.name || 'شركة'}</h2>
                <div className="flex gap-4 text-xs font-bold text-slate-500 mt-1">
                  {companyInfo?.taxNumber && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">الرقم الضريبي: {companyInfo.taxNumber}</span>
                  )}
                  {companyInfo?.address && <span>{companyInfo.address}</span>}
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-1">
               <h3 className="text-2xl font-black text-slate-700 underline decoration-[#002366] underline-offset-4 decoration-2">ميزان المراجعة التحليلي للفترة المحددة</h3>
               <div className="text-[11px] font-bold text-slate-400 flex justify-center md:justify-end gap-3 uppercase">
                  <span>الفترة من: {fromDate} إلى: {toDate}</span>
                  <span>•</span>
                  <span>تاريخ التقرير: {reportDate}</span>
                  <span>•</span>
                  <span>العملة: {currency}</span>
               </div>
            </div>
          </div>
          
          {/* Trial Balance Table - Integrated with Company Info */}
          <div className="bg-white border-2 border-slate-300 shadow-2xl overflow-hidden rounded-b-[2rem] print:shadow-none print:border-slate-400 print:overflow-visible">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#002366] text-white">
                  <th rowSpan={2} className="px-4 py-3 text-xs font-black border-l border-white/10 w-24">كود الحساب</th>
                  <th rowSpan={2} className="px-6 py-3 text-sm font-black border-l border-white/20">اسم الحساب (البيان)</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b border-l border-white/20 bg-[#001a4d]">الأرصدة الافتتاحية</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b border-l border-white/20 bg-[#00143a]">حركات الفترة</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b bg-[#000d26]">الأرصدة الختامية</th>
                </tr>
                <tr className="bg-[#002366] text-[10px] font-black border-b-2 border-white/30">
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-300">مدين (+)</th>
                  <th className="px-2 py-2 text-center border-l border-white/30 text-rose-300 shadow-[inset_-3px_0_0_white]">دائن (-)</th>
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-300">مدين (+)</th>
                  <th className="px-2 py-2 text-center border-l border-white/30 text-rose-300 shadow-[inset_-3px_0_0_white]">دائن (-)</th>
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-200">مدين (+)</th>
                  <th className="px-2 py-2 text-center text-rose-200">دائن (-)</th>
                </tr>
              </thead>
              
              <tbody className="text-[13px] font-bold">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      لا توجد بيانات للعرض
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`
                        group transition-all duration-75
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-200/80'} 
                        hover:bg-blue-600 hover:text-white
                      `}
                    >
                      <td className="px-4 py-1.5 font-mono text-slate-500 border-l border-slate-300/30 group-hover:text-blue-100">{item.accountCode}</td>
                      <td className="px-6 py-1.5 text-slate-800 border-l border-slate-300/30 group-hover:text-white">{item.accountName}</td>
                      
                      {/* Financial Data Columns */}
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-700 group-hover:text-white">
                        {item.openingBalanceDebit > 0 ? item.openingBalanceDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-700 group-hover:text-white shadow-[3px_0_0_white]">
                        {item.openingBalanceCredit > 0 ? item.openingBalanceCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-800 bg-blue-50/10 group-hover:bg-transparent group-hover:text-white">
                        {item.periodDebit > 0 ? item.periodDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-800 bg-rose-50/10 group-hover:bg-transparent group-hover:text-white shadow-[3px_0_0_white]">
                        {item.periodCredit > 0 ? item.periodCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-900 bg-blue-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceDebit > 0 ? item.closingBalanceDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-900 bg-rose-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceCredit > 0 ? item.closingBalanceCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr className="bg-[#001a4d] text-white border-t-4 border-white">
                  <td colSpan={2} className="px-6 py-4 text-base font-black text-left pr-8 border-l border-white/10 uppercase italic">إجماليات الميزان النهائية</td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">
                    {summary.totalOpeningDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">
                    {summary.totalOpeningCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">
                    {summary.totalPeriodDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">
                    {summary.totalPeriodCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-lg font-black text-blue-200 bg-blue-950 underline decoration-double">
                    {summary.totalClosingDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center text-lg font-black text-rose-200 bg-rose-950 underline decoration-double">
                    {summary.totalClosingCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Verification Status Bar */}
          <div className="mt-8 flex flex-col gap-4">
            {/* Main Balance Status */}
            <div className="flex justify-center">
              <div className={`w-full max-w-4xl flex items-center justify-between px-10 py-5 border-2 rounded-2xl bg-white shadow-lg ${isFullyBalanced ? 'border-emerald-500' : 'border-rose-500'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md ${isFullyBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}>
                    <i className={`fas ${isFullyBalanced ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">
                      {isFullyBalanced ? 'ميزان المراجعة متوازن بالكامل' : 'يوجد فارق في التوازن المالي'}
                    </h4>
                    <p className="text-xs font-bold text-slate-400">تنبيه آلي من النظام المحاسبي للتدقيق المالي</p>
                  </div>
                </div>
                
                {!isFullyBalanced && (
                  <div className="bg-rose-50 px-6 py-2.5 rounded-xl border-2 border-rose-100 flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">قيمة الفارق الإجمالي</span>
                    <span className="text-2xl font-black text-rose-600 font-mono italic">
                      {closingBalanceDifference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Detailed Balance Breakdown */}
            {!isFullyBalanced && (
              <div className="flex justify-center">
                <div className="w-full max-w-4xl bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className={`p-3 rounded-lg border-2 ${isOpeningBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">الأرصدة الافتتاحية</div>
                      <div className={`font-bold ${isOpeningBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isOpeningBalanced ? '✓ متوازن' : `✗ فارق: ${openingBalanceDifference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${isPeriodBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">حركات الفترة</div>
                      <div className={`font-bold ${isPeriodBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPeriodBalanced ? '✓ متوازن' : `✗ فارق: ${periodBalanceDifference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${isClosingBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">الأرصدة الختامية</div>
                      <div className={`font-bold ${isClosingBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isClosingBalanced ? '✓ متوازن' : `✗ فارق: ${closingBalanceDifference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </main>

        <footer className="max-w-[1450px] mx-auto px-8 mt-12 border-t border-slate-300 pt-6 flex justify-between items-center text-slate-400 text-[10px] no-print font-black uppercase tracking-[0.3em]">
          <p>Advanced ERP Systems © {new Date().getFullYear()}</p>
          <div className="flex gap-8">
            <span>Security Protocol: AES-256</span>
            <span>Doc ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            <span>صفحة 1 / 1</span>
          </div>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 0.3cm;
          }
          
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; font-size: 7.5pt; color: black !important; }
            .max-w-\[1450px\] { max-width: 100% !important; margin: 0 !important; }
            header { display: none !important; }
            .shadow-2xl, .shadow-lg, .shadow-sm { box-shadow: none !important; }
            table { 
              border: 2px solid #000 !important; 
              page-break-inside: auto !important;
              border-collapse: collapse !important;
            }
            thead { 
              display: table-header-group !important; 
            }
            tfoot { 
              display: table-footer-group !important; 
            }
            tbody tr { 
              page-break-inside: avoid !important; 
              page-break-after: auto !important;
            }
            tfoot tr { 
              page-break-inside: avoid !important; 
            }
            th { background-color: #002366 !important; color: white !important; -webkit-print-color-adjust: exact; padding: 4px !important; border-color: #fff !important; }
            td { padding: 3px 6px !important; border-bottom: 1px solid #ddd !important; }
            tr.bg-slate-200\/80 { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
            .rounded-t-\[2rem\], .rounded-b-\[2rem\] { border-radius: 0 !important; }
            .border-b-2 { border-bottom-width: 2px !important; border-color: #000 !important; }
            .border-l-\[3px\] { border-left-width: 4px !important; border-color: #fff !important; }
            .shadow-\[3px_0_0_white\] { box-shadow: 4px 0 0 white !important; }
            .overflow-hidden { overflow: visible !important; }
          }

          input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
            filter: invert(10%) sepia(90%) saturate(6000%) hue-rotate(220deg);
          }
        `}</style>
      </div>
    </PermissionWrapper>
  );
};

export default AuditTrial;
