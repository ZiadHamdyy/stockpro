import React, { useMemo, useState, useCallback, useEffect } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import {
  formatNumber,
  exportToExcel,
  exportToPdf,
  getNegativeNumberClass,
} from "../../../utils/formatting";
import { useBalanceSheet } from "../../hook/useBalanceSheet";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetPaymentVouchersQuery } from "../../store/slices/paymentVoucherApiSlice";
import type { PaymentVoucher } from "../../store/slices/paymentVoucherApiSlice";
import { useGetReceiptVouchersQuery } from "../../store/slices/receiptVoucherApiSlice";
import type { ReceiptVoucher } from "../../store/slices/receiptVoucherApiSlice";
import { useGetFiscalYearsQuery } from "../../store/slices/fiscalYear/fiscalYearApiSlice";
import { useGetIncomeStatementQuery } from "../../store/slices/incomeStatement/incomeStatementApiSlice";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useGetStoresQuery, useGetAllStoreItemsQuery } from "../../store/slices/store/storeApi";
import { useGetStoreReceiptVouchersQuery } from "../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetStoreTransferVouchersQuery } from "../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { useGetSuppliersQuery } from "../../store/slices/supplier/supplierApiSlice";
import { useAuth } from "../../hook/Auth";
import { useGetFinancialSettingsQuery } from "../../store/slices/financialSettings/financialSettingsApi";
import { ValuationMethod } from "../../pages/settings/financial-system/types";
import { useGetReceivableAccountsQuery } from "../../store/slices/receivableAccounts/receivableAccountsApi";
import { useGetPayableAccountsQuery } from "../../store/slices/payableAccounts/payableAccountsApi";

const flipSign = (value: number) => (value === 0 ? 0 : value * -1);

/**
 * Balance Sheet Component
 * 
 * IMPORTANT: This component displays COMPANY-WIDE financial data.
 * All calculations aggregate data across ALL branches regardless of:
 * - User's branch assignment
 * - User permissions
 * - Branch filters
 * 
 * The backend services already aggregate correctly by companyId only.
 * Frontend calculations ensure all data is processed without branch filtering.
 * 
 * COMPANY-WIDE CALCULATIONS:
 * - Inventory: Opening balances aggregated from ALL StoreItems across ALL stores/branches
 * - Payables: All supplier balances from ALL branches
 * - Receivables: All customer balances from ALL branches (via backend)
 * - Other Revenues: All receipt vouchers from ALL branches
 * - Net Purchases: All purchase invoices and returns from ALL branches
 * - VAT: All VAT transactions from ALL branches
 * - Retained Earnings: All fiscal years and P&L vouchers from ALL branches
 * 
 * All API queries fetch company-wide data (no branch/store filtering):
 * - useGetSalesInvoicesQuery(undefined) - all company sales invoices
 * - useGetPurchaseInvoicesQuery(undefined) - all company purchase invoices
 * - useGetSalesReturnsQuery(undefined) - all company sales returns
 * - useGetPurchaseReturnsQuery(undefined) - all company purchase returns
 * - useGetStoreReceiptVouchersQuery(undefined) - all company store receipts
 * - useGetStoreIssueVouchersQuery(undefined) - all company store issues
 * - useGetStoreTransferVouchersQuery(undefined) - all company store transfers
 * - useGetReceiptVouchersQuery(undefined) - all company receipt vouchers
 * - useGetPaymentVouchersQuery(undefined) - all company payment vouchers
 * - useGetAllStoreItemsQuery() - all StoreItems across all stores/branches
 */
const BalanceSheet: React.FC = () => {
  const title = "قائمة المركز المالي";
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  
  // Get inventory valuation method from Redux
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  
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

  // COMPANY-WIDE DATA FETCHING: All queries use undefined to fetch ALL company data
  // Backend APIs filter by companyId only, ensuring all branches are included
  // VAT-related data (same sources as VATStatementReport)
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseInvoices = [] } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [] } =
    useGetPurchaseReturnsQuery(undefined);
  const { data: apiPaymentVouchers = [] } =
    useGetPaymentVouchersQuery(undefined);
  const { data: apiReceiptVouchers = [] } =
    useGetReceiptVouchersQuery(undefined);

  // Fiscal year and income statement data for retained earnings calculation
  const { data: fiscalYears = [] } = useGetFiscalYearsQuery();
  const { data: incomeStatementData } = useGetIncomeStatementQuery(
    { startDate, endDate },
    { skip: !startDate || !endDate }
  );

  // COMPANY-WIDE DATA: Inventory calculation data (same as InventoryValuationReport)
  // All queries fetch data for entire company, not filtered by branch
  const { data: apiItems = [] } = useGetItemsQuery(undefined);
  const { data: branches = [] } = useGetBranchesQuery(undefined);
  const { data: stores = [] } = useGetStoresQuery(undefined);
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
  const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);
  const { data: apiSuppliers = [] } = useGetSuppliersQuery(undefined);
  const { data: apiReceivableAccounts = [] } = useGetReceivableAccountsQuery(undefined);
  const { data: apiPayableAccounts = [] } = useGetPayableAccountsQuery(undefined);
  
  // Fetch all StoreItems across all stores to aggregate opening balances company-wide
  // This ensures inventory calculations include opening balances from ALL branches/stores
  const { data: allStoreItems = [] } = useGetAllStoreItemsQuery();

  const {
    data: balanceSheetData,
    companyInfo,
    isLoading,
    error,
  } = useBalanceSheet(startDate, endDate);

  // Get current user for print
  const { User: currentUser } = useAuth();
  
  // Get current date for print
  const currentDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Helper to normalize date to YYYY-MM-DD (copied from VATStatementReport)
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

  // Safely convert any numeric-like value to a finite number (keeps negatives)
  const toNumber = useCallback((value: any): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  // Aggregate opening balances from all StoreItems across all stores/branches
  // This creates a map of item code -> total opening balance (sum across all stores)
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

  // Transform API data to match expected format (for inventory calculation)
  // Note: openingBalance will be set from aggregatedOpeningBalances in calculatedInventoryValue
  const items = useMemo(() => {
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

  const transformedSalesInvoices = useMemo(() => {
    return (apiSalesInvoices as any[]).map((invoice) => ({
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
  }, [apiSalesInvoices]);

  const transformedSalesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((invoice) => ({
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
  }, [apiSalesReturns]);

  const transformedPurchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
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

  // Helper function to get last purchase price before or on a reference date (for all branches)
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    // Get all purchase invoices up to the reference date, sorted by date descending (all branches)
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

    // Find the most recent purchase price for this item
    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null;
  }, [transformedPurchaseInvoices, normalizeDate]);

  // Helper function to calculate weighted average cost up to a reference date
  const calculateWeightedAverageCost = useCallback((item: any, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const itemCode = item.code;
    const openingBalance = toNumber((item as any).openingBalance ?? 0);
    const initialPurchasePrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);

    // Get all purchase invoices up to the reference date (no branch filtering - all branches)
    const relevantInvoices = transformedPurchaseInvoices
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      });

    // Start with opening balance at initialPurchasePrice
    let totalCost = openingBalance > 0 ? openingBalance * initialPurchasePrice : 0;
    let totalQty = openingBalance;

    // Add purchase invoices to the weighted average
    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.total && invItem.qty) {
          totalCost += invItem.total; // Use total invoice value per item
          totalQty += invItem.qty;
        }
      }
    }

    // If no purchases and no opening balance, return initialPurchasePrice if it exists
    if (totalQty === 0) {
      return initialPurchasePrice > 0 ? initialPurchasePrice : null;
    }
    
    return totalCost / totalQty;
  }, [transformedPurchaseInvoices, normalizeDate, toNumber]);

  /**
   * Calculate inventory value - COMPANY-WIDE calculation
   * Aggregates inventory across ALL branches and stores
   * No branch filtering is applied - all transactions from all branches are included
   * 
   * Opening balances are aggregated from ALL StoreItems across ALL stores/branches
   * using the aggregatedOpeningBalances map which sums opening balances by item code.
   * 
   * All transaction types (purchases, sales, returns, store vouchers) are processed
   * without branch filtering to ensure company-wide inventory calculation.
   */
  const calculatedInventoryValue = useMemo(() => {
    const normalizedEndDate = normalizeDate(endDate);
    if (!normalizedEndDate || items.length === 0) return 0;

    // Use the tracked valuation method (will update when localStorage changes)
    const valuationMethod = inventoryValuationMethod; // Use inventory valuation method from financial system settings (for Balance Sheet)

    const valuationData = items.map((item) => {
      // Use aggregated opening balance from ALL stores/branches for this item
      // This ensures company-wide inventory calculation includes all branches
      const itemCode = item.code;
      let balance = aggregatedOpeningBalances[itemCode] || 0;

      // Filter transactions up to and including endDate (all branches)
      const filterByDate = (tx: any) => {
        if (!normalizedEndDate) return false;
        const txDate =
          normalizeDate(tx.date) ||
          normalizeDate(tx.invoiceDate) ||
          normalizeDate(tx.transactionDate);
        if (!txDate) return false;
        return txDate <= normalizedEndDate;
      };

      // Calculate balance across all branches (no branch filtering)
      // All purchase invoices from all branches are included
      transformedPurchaseInvoices.filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );
      transformedSalesReturns.filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );
      transformedStoreReceiptVouchers.filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );

      // Subtract sales invoices from all branches (no branch filtering)
      transformedSalesInvoices.filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );
      // Subtract purchase returns from all branches (no branch filtering)
      transformedPurchaseReturns.filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );
      // Subtract store issue vouchers from all branches (no branch filtering)
      transformedStoreIssueVouchers.filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );

      // Handle store transfers (all branches)
      transformedStoreTransferVouchers.filter(filterByDate).forEach((v) => {
        const fromStore = stores.find((s) => s.name === v.fromStore);
        const toStore = stores.find((s) => s.name === v.toStore);
        v.items.forEach((i) => {
          if (i.id === item.code) {
            const qty = toNumber(i.qty);
            // For all branches, transfers between stores don't affect total balance
            // But we need to account for transfers if they affect the item's balance
            // Since we're calculating for all branches, transfers are neutral
          }
        });
      });

      // Calculate cost based on valuation method at end of the period (end date)
      let cost = 0;
      const priceReferenceDate = endDate;
      const fallbackPrice =
        toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);
      
      if (valuationMethod === "averageCost") {
        const avgCost = calculateWeightedAverageCost(item, priceReferenceDate);
        // Fallback to last purchase price if no purchases found
        if (avgCost === null) {
          const lastPurchasePrice = getLastPurchasePriceBeforeDate(item.code, priceReferenceDate);
          cost = lastPurchasePrice ?? fallbackPrice;
        } else {
          cost = avgCost;
        }
      } else if (valuationMethod === "purchasePrice") {
        const lastPurchasePrice = getLastPurchasePriceBeforeDate(item.code, priceReferenceDate);
        cost = lastPurchasePrice ?? fallbackPrice;
      } else {
        cost = fallbackPrice;
      }

      const value = balance * cost;

      return {
        ...item,
        balance,
        cost,
        value,
      };
    });

    // Calculate total inventory value (same as InventoryValuationReport line 520)
    const totalValue = valuationData.reduce((acc, item) => acc + item.value, 0);
    return totalValue;
  }, [
    items,
    endDate,
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
    inventoryValuationMethod, // Include in dependencies to trigger recalculation when method changes
    aggregatedOpeningBalances, // Include aggregated opening balances from all stores
  ]);

  // Transform vouchers to match expected structure for payables and receivables calculation
  const receiptVouchers = useMemo(() => {
    return (apiReceiptVouchers as any[]).map((voucher: any) => {
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure (same as TotalReceivableAccountsReport and TotalPayableAccountsReport)
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
    return (apiPaymentVouchers as any[]).map((voucher: any) => {
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure (same as TotalReceivableAccountsReport and TotalPayableAccountsReport)
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

  /**
   * Calculate payables - COMPANY-WIDE calculation
   * Uses the exact same logic as SupplierBalanceReport
   * Aggregates supplier balances across ALL branches
   * All purchase invoices, returns, and vouchers from all branches are included
   * Separates opening balance (before startDate) from period transactions (between startDate and endDate)
   */
  const calculatedPayables = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    if (!normalizedStartDate || !normalizedEndDate) return 0;

    const suppliers = (apiSuppliers as any[]).map((supplier) => ({
      ...supplier,
    }));

    const supplierBalanceData = suppliers.map((supplier) => {
      const supplierIdStr = supplier.id.toString();
      const supplierId = supplier.id;

      // Calculate opening balance up to start date (same as SupplierBalanceReport)
      const openingPurchases = transformedPurchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < normalizedStartDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingCashPurchases = transformedPurchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < normalizedStartDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingReturns = transformedPurchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < normalizedStartDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const openingCashReturns = transformedPurchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate < normalizedStartDate;
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
                   vDate < normalizedStartDate;
          }
        )
        .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

      const openingReceipts = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate < normalizedStartDate;
          }
        )
        .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

      // Opening balance = supplier.openingBalance + openingDebit - openingCredit
      // Debit (decreases what we owe): cash purchases, all purchase returns, payment vouchers
      // Credit (increases what we owe): all purchase invoices, cash purchase returns, receipt vouchers (refunds from supplier)
      const openingDebit = openingCashPurchases + openingReturns + openingPayments;
      const openingCredit = openingPurchases + openingCashReturns + openingReceipts;
      const opening = (supplier.openingBalance || 0) + openingDebit - openingCredit;

      // Calculate period transactions (between start and end date) - same as SupplierBalanceReport
      const periodPurchases = transformedPurchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= normalizedStartDate && invDate <= normalizedEndDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodCashPurchases = transformedPurchaseInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= normalizedStartDate && invDate <= normalizedEndDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodReturns = transformedPurchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= normalizedStartDate && invDate <= normalizedEndDate;
          }
        )
        .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

      const periodCashReturns = transformedPurchaseReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                 inv.supplierId?.toString() || 
                                 (inv.supplier?.id?.toString());
            return inv.paymentMethod === "cash" &&
                   (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                   invDate >= normalizedStartDate && invDate <= normalizedEndDate;
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
                   vDate >= normalizedStartDate && vDate <= normalizedEndDate;
          }
        )
        .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

      const periodReceipts = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherSupplierId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "supplier" &&
                   (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                   vDate >= normalizedStartDate && vDate <= normalizedEndDate;
          }
        )
        .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

      // Period Debit: cash purchases, all purchase returns, payment vouchers (all decrease what we owe)
      const totalDebit = periodCashPurchases + periodReturns + periodPayments;
      // Period Credit: all purchase invoices, cash purchase returns, receipt vouchers (all increase what we owe)
      const totalCredit = periodPurchases + periodCashReturns + periodReceipts;
      // Balance = Opening Balance (at start date) + Period Debit - Period Credit
      const balance = opening + totalDebit - totalCredit;

      return balance;
    });

    // Sum all supplier balances
    const totalPayables = supplierBalanceData.reduce((sum, balance) => sum + balance, 0);
    return totalPayables;
  }, [
    apiSuppliers,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    paymentVouchers,
    receiptVouchers,
    startDate,
    endDate,
    normalizeDate,
    toNumber,
  ]);

  /**
   * Calculate other receivables - COMPANY-WIDE calculation
   * Uses the exact same logic as TotalReceivableAccountsReport
   * Calculates balances for all receivable accounts using:
   * - Opening balance = base opening balance + payments before start date - receipts before start date
   * - Balance = opening + payments - receipts
   * Then sums all account balances
   */
  const calculatedOtherReceivables = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    if (!normalizedStartDate || !normalizedEndDate) return 0;

    // Transform API data to match expected format
    const receivableAccounts = (apiReceivableAccounts as any[]).map((account) => ({
      ...account,
    }));

    // Calculate account balances from vouchers (exact same logic as TotalReceivableAccountsReport)
    const accountsSummary = receivableAccounts.map((account) => {
      const accountId = account.id;
      const accountIdStr = accountId.toString();

      // Calculate transactions before start date for opening balance
      const receiptsBefore = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "receivable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "receivable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      // Calculate transactions within date range
      const relevantReceipts = receiptVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const relevantPayments = paymentVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "receivable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const receipts = relevantReceipts.reduce((sum, v) => sum + v.amount, 0);
      const payments = relevantPayments.reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = base opening balance + payments before start date - receipts before start date
      const opening = (account.openingBalance || 0) + paymentsBefore - receiptsBefore;
      const balance = opening + payments - receipts;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        opening,
        debit: payments,
        credit: receipts,
        balance,
      };
    });

    // Sum all account balances (same as totals.balance in TotalReceivableAccountsReport)
    const totals = accountsSummary.reduce(
      (acc, item) => {
        acc.balance += item.balance;
        return acc;
      },
      { balance: 0 },
    );

    return totals.balance;
  }, [apiReceivableAccounts, receiptVouchers, paymentVouchers, startDate, endDate, normalizeDate]);

  /**
   * Calculate other payables - COMPANY-WIDE calculation
   * Uses the exact same logic as TotalPayableAccountsReport
   * Calculates balances for all payable accounts using:
   * - Opening balance = base opening balance + payments before start date - receipts before start date
   * - Balance = opening + payments - receipts
   * Then sums all account balances
   */
  const calculatedOtherPayables = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    if (!normalizedStartDate || !normalizedEndDate) return 0;

    // Transform API data to match expected format
    const payableAccounts = (apiPayableAccounts as any[]).map((account) => ({
      ...account,
    }));

    // Calculate account balances from vouchers (exact same logic as TotalPayableAccountsReport)
    const accountsSummary = payableAccounts.map((account) => {
      const accountId = account.id;
      const accountIdStr = accountId.toString();

      // Calculate transactions before start date for opening balance
      const receiptsBefore = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "payable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "payable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      // Calculate transactions within date range
      const relevantReceipts = receiptVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const relevantPayments = paymentVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const receipts = relevantReceipts.reduce((sum, v) => sum + v.amount, 0);
      const payments = relevantPayments.reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = base opening balance + payments before start date - receipts before start date
      const opening = (account.openingBalance || 0) + paymentsBefore - receiptsBefore;
      const balance = opening + payments - receipts;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        opening,
        debit: payments,
        credit: receipts,
        balance,
      };
    });

    // Sum all account balances (same as totals.balance in TotalPayableAccountsReport)
    const totals = accountsSummary.reduce(
      (acc, item) => {
        acc.balance += item.balance;
        return acc;
      },
      { balance: 0 },
    );

    return totals.balance;
  }, [apiPayableAccounts, receiptVouchers, paymentVouchers, startDate, endDate, normalizeDate]);

  /**
   * Calculate other revenues - COMPANY-WIDE calculation
   * Sum of all receipt vouchers with entityType === 'revenue' within date range
   * Includes vouchers from all branches
   */
  const calculatedOtherRevenues = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    if (!normalizedStartDate || !normalizedEndDate) return 0;

    return (apiReceiptVouchers as any[])
      .filter((voucher) => {
        // Filter by revenue entity type
        if (voucher.entityType !== 'revenue') return false;
        
        // Filter by date range
        const voucherDate = normalizeDate(voucher.date);
        if (!voucherDate) return false;
        return voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
      })
      .reduce((sum, voucher) => sum + (voucher.amount || 0), 0);
  }, [apiReceiptVouchers, startDate, endDate, normalizeDate]);

  /**
   * Calculate net purchases - COMPANY-WIDE calculation
   * (purchases before tax - purchase discounts - purchase returns before tax + return discounts)
   * Includes all purchase invoices and returns from all branches
   */
  const calculatedNetPurchases = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    if (!normalizedStartDate || !normalizedEndDate) return 0;

    const isInRange = (date: any) => {
      const d = normalizeDate(date);
      if (!d) return false;
      return d >= normalizedStartDate && d <= normalizedEndDate;
    };

    const { totalPurchasesBeforeTax, totalPurchasesDiscount } = (apiPurchaseInvoices as any[])
      .filter((inv) => isInRange(inv.date || inv.invoiceDate))
      .reduce(
        (acc, inv) => {
          acc.totalPurchasesBeforeTax += toNumber(inv.subtotal || 0);
          acc.totalPurchasesDiscount += toNumber(inv.discount || 0);
          return acc;
        },
        { totalPurchasesBeforeTax: 0, totalPurchasesDiscount: 0 },
      );

    const { totalPurchaseReturnsBeforeTax, totalReturnsDiscount } = (apiPurchaseReturns as any[])
      .filter((inv) => isInRange(inv.date || inv.invoiceDate))
      .reduce(
        (acc, inv) => {
          acc.totalPurchaseReturnsBeforeTax += toNumber(inv.subtotal || 0);
          acc.totalReturnsDiscount += toNumber(inv.discount || 0);
          return acc;
        },
        { totalPurchaseReturnsBeforeTax: 0, totalReturnsDiscount: 0 },
      );

    return (
      totalPurchasesBeforeTax -
      totalPurchasesDiscount -
      totalPurchaseReturnsBeforeTax +
      totalReturnsDiscount
    );
  }, [apiPurchaseInvoices, apiPurchaseReturns, startDate, endDate, normalizeDate, toNumber]);

  /**
   * Calculate allowed discount - COMPANY-WIDE calculation
   * total sales discounts - total sales returns discounts
   * Includes discounts from all sales invoices and returns across all branches
   */
  const allowedDiscount = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    if (!normalizedStartDate || !normalizedEndDate) return 0;

    const isInRange = (date: any) => {
      const d = normalizeDate(date);
      if (!d) return false;
      return d >= normalizedStartDate && d <= normalizedEndDate;
    };

    const totalSalesDiscounts = (apiSalesInvoices as any[])
      .filter((inv) => isInRange(inv.date || inv.invoiceDate))
      .reduce((sum, inv) => sum + toNumber(inv.discount || 0), 0);

    const totalSalesReturnsDiscounts = (apiSalesReturns as any[])
      .filter((inv) => isInRange(inv.date || inv.invoiceDate))
      .reduce((sum, inv) => sum + toNumber(inv.discount || 0), 0);

    return totalSalesDiscounts - totalSalesReturnsDiscounts;
  }, [apiSalesInvoices, apiSalesReturns, startDate, endDate, normalizeDate, toNumber]);

  // Calculate net sales after discount exactly as in IncomeStatement
  const netSalesAfterDiscount = useMemo(() => {
    if (!incomeStatementData) return 0;
    return incomeStatementData.netSales - allowedDiscount;
  }, [incomeStatementData, allowedDiscount]);

  // Calculate net profit exactly as in IncomeStatement
  // Formula: netSalesAfterDiscount - (beginningInventory + calculatedNetPurchases - calculatedEndingInventory) + calculatedOtherRevenues - totalExpenses
  const calculatedNetProfit = useMemo(() => {
    if (!incomeStatementData) return 0;
    
    return netSalesAfterDiscount - 
           (incomeStatementData.beginningInventory + calculatedNetPurchases - calculatedInventoryValue) + 
           calculatedOtherRevenues - 
           incomeStatementData.totalExpenses;
  }, [incomeStatementData, calculatedInventoryValue, calculatedOtherRevenues, netSalesAfterDiscount, calculatedNetPurchases]);

  /**
   * Calculate retained earnings - COMPANY-WIDE calculation
   * Includes retained earnings from all previous closed fiscal years
   * Plus current period net profit and P&L vouchers from all branches
   */
  const calculatedRetainedEarnings = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    const periodStartDate = new Date(normalizedStartDate);

    // Find all CLOSED fiscal years that ended before the current period start date
    const previousClosedFiscalYears = fiscalYears.filter((fy) => {
      if (fy.status !== "CLOSED") return false;
      const fyEndDate = new Date(normalizeDate(fy.endDate));
      return fyEndDate < periodStartDate;
    });

    // Sum retained earnings from all previous closed fiscal years
    const previousRetainedEarnings = previousClosedFiscalYears.reduce(
      (sum, fiscalYear) => sum + (fiscalYear.retainedEarnings || 0),
      0,
    );

    // Use calculated net profit (same calculation as IncomeStatement)
    const currentPeriodNetProfit = calculatedNetProfit;

    // Include profit_and_loss vouchers in retained earnings calculation
    const profitAndLossReceipts = apiReceiptVouchers
      .filter((v) => v.entityType === "profit_and_loss")
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    const profitAndLossPayments = apiPaymentVouchers
      .filter((v) => v.entityType === "profit_and_loss")
      .filter((v) => {
        const vDate = normalizeDate(v.date);
        return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0);

    // Return accumulated retained earnings (previous years + current period + P&L vouchers)
    return (
      previousRetainedEarnings +
      currentPeriodNetProfit +
      profitAndLossReceipts -
      profitAndLossPayments
    );
  }, [
    fiscalYears,
    calculatedNetProfit,
    normalizeDate,
    startDate,
    endDate,
    apiReceiptVouchers,
    apiPaymentVouchers,
  ]);

  const displayData = useMemo(() => {
    if (!balanceSheetData) {
      return null;
    }

    // Use calculated payables (same calculation as SupplierBalanceReport)
    const payables = flipSign(calculatedPayables);
    const otherPayables = flipSign(balanceSheetData.otherPayables);
    const vatPayable = flipSign(balanceSheetData.vatPayable);
    const partnersBalance = flipSign(balanceSheetData.partnersBalance);
    // Use calculated retained earnings with fiscal year logic
    const retainedEarnings = calculatedRetainedEarnings;
    // Use calculated inventory value (same calculation as InventoryValuationReport)
    const inventory = calculatedInventoryValue;
    // Use calculated other receivables (same calculation as TotalReceivableAccountsReport)
    const otherReceivables = calculatedOtherReceivables;

    const totalLiabilities = payables + otherPayables + vatPayable;
    const totalEquity =
      balanceSheetData.capital + partnersBalance + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    // Recalculate total assets with the new inventory value
    const totalAssets =
      balanceSheetData.cashInSafes +
      balanceSheetData.cashInBanks +
      balanceSheetData.receivables +
      otherReceivables +
      inventory;

    return {
      ...balanceSheetData,
      payables,
      otherPayables,
      vatPayable,
      partnersBalance,
      retainedEarnings,
      inventory,
      otherReceivables,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      totalAssets,
    };
  }, [balanceSheetData, calculatedRetainedEarnings, calculatedInventoryValue, calculatedPayables, calculatedOtherReceivables]);

  /**
   * Compute VAT net - COMPANY-WIDE calculation
   * Calculates VAT from مدين/دائن totals (same logic as VATStatementReport)
   * Includes opening balance (transactions before startDate) to carry forward to future
   * All VAT transactions from all branches are included
   */
  const vatNetFromStatement = useMemo(() => {
    // Check if VAT is enabled
    const isVatEnabled = companyInfo?.isVatEnabled || false;
    if (!isVatEnabled) {
      return 0;
    }
    
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    // Filters for current period (between startDate and endDate)
    const filterByDate = (inv: any) => {
      const invDate = normalizeDate(inv.date);
      return invDate >= normalizedStartDate && invDate <= normalizedEndDate;
    };

    const filterVoucherByDate = (v: PaymentVoucher) => {
      const vDate = normalizeDate(v.date);
      return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
    };

    const filterReceiptVoucherByDate = (v: ReceiptVoucher) => {
      const vDate = normalizeDate(v.date);
      return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
    };

    // Filters for opening balance (before startDate)
    const filterBeforeStartDate = (inv: any) => {
      const invDate = normalizeDate(inv.date);
      return invDate < normalizedStartDate;
    };

    const filterVoucherBeforeStartDate = (v: PaymentVoucher) => {
      const vDate = normalizeDate(v.date);
      return vDate < normalizedStartDate;
    };

    const filterReceiptVoucherBeforeStartDate = (v: ReceiptVoucher) => {
      const vDate = normalizeDate(v.date);
      return vDate < normalizedStartDate;
    };

    // Calculate opening balance (before startDate)
    let openingDebit = 0;
    let openingCredit = 0;

    // Opening Debit (مدين): Sales Invoices + Purchase Returns
    (apiSalesInvoices as any[])
      .filter(filterBeforeStartDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        openingDebit += tax;
      });

    (apiPurchaseReturns as any[])
      .filter(filterBeforeStartDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        openingDebit += tax;
      });

    // Opening Credit (دائن): Purchase Invoices + Sales Returns + Expense-Type Tax from Payment Vouchers
    (apiPurchaseInvoices as any[])
      .filter(filterBeforeStartDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        openingCredit += tax;
      });

    (apiSalesReturns as any[])
      .filter(filterBeforeStartDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        openingCredit += tax;
      });

    (apiPaymentVouchers as PaymentVoucher[])
      .filter(
        (v) => v.entityType === "expense-Type" && v.taxPrice && v.taxPrice > 0,
      )
      .filter(filterVoucherBeforeStartDate)
      .forEach((v) => {
        const tax = v.taxPrice || 0;
        openingCredit += tax;
      });

    // Opening VAT from Receipt Vouchers (Debit - VAT collected)
    (apiReceiptVouchers as ReceiptVoucher[])
      .filter((v) => v.entityType === "vat" && v.amount && v.amount > 0)
      .filter(filterReceiptVoucherBeforeStartDate)
      .forEach((v) => {
        const tax = v.amount || 0;
        openingDebit += tax;
      });

    // Opening VAT from Payment Vouchers (Credit - VAT paid)
    (apiPaymentVouchers as PaymentVoucher[])
      .filter((v) => v.entityType === "vat" && v.amount && v.amount > 0)
      .filter(filterVoucherBeforeStartDate)
      .forEach((v) => {
        const tax = v.amount || 0;
        openingCredit += tax;
      });

    // Calculate current period (between startDate and endDate)
    let totalDebit = 0;
    let totalCredit = 0;

    // Debit (مدين): Sales Invoices + Purchase Returns
    (apiSalesInvoices as any[])
      .filter(filterByDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        totalDebit += tax;
      });

    (apiPurchaseReturns as any[])
      .filter(filterByDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        totalDebit += tax;
      });

    // Credit (دائن): Purchase Invoices + Sales Returns + Expense-Type Tax from Payment Vouchers
    (apiPurchaseInvoices as any[])
      .filter(filterByDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        totalCredit += tax;
      });

    (apiSalesReturns as any[])
      .filter(filterByDate)
      .forEach((inv) => {
        const tax = inv.tax || 0;
        totalCredit += tax;
      });

    (apiPaymentVouchers as PaymentVoucher[])
      .filter(
        (v) => v.entityType === "expense-Type" && v.taxPrice && v.taxPrice > 0,
      )
      .filter(filterVoucherByDate)
      .forEach((v) => {
        const tax = v.taxPrice || 0;
        totalCredit += tax;
      });

    // VAT from Receipt Vouchers (Debit - VAT collected)
    (apiReceiptVouchers as ReceiptVoucher[])
      .filter((v) => v.entityType === "vat" && v.amount && v.amount > 0)
      .filter(filterReceiptVoucherByDate)
      .forEach((v) => {
        const tax = v.amount || 0;
        totalDebit += tax;
      });

    // VAT from Payment Vouchers (Credit - VAT paid)
    (apiPaymentVouchers as PaymentVoucher[])
      .filter((v) => v.entityType === "vat" && v.amount && v.amount > 0)
      .filter(filterVoucherByDate)
      .forEach((v) => {
        const tax = v.amount || 0;
        totalCredit += tax;
      });

    // Calculate opening net VAT
    const openingNetVat = openingCredit - openingDebit;
    
    // Calculate current period net VAT
    const currentPeriodNetVat = totalCredit - totalDebit;
    
    // Total cumulative VAT (opening + current period) - continues to future
    return openingNetVat + currentPeriodNetVat;
  }, [
    apiSalesInvoices,
    apiSalesReturns,
    apiPurchaseInvoices,
    apiPurchaseReturns,
    apiPaymentVouchers,
    apiReceiptVouchers,
    normalizeDate,
    startDate,
    endDate,
    companyInfo,
  ]);

  const handlePrint = () => {
    const reportContent = document.getElementById(
      "printable-area-balance-sheet",
    );
    if (!reportContent) return;
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow?.document.write("<html><head><title>طباعة التقرير</title>");
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; }
                @media print {
                    @page { size: A4 portrait; margin: 1cm; }
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    table { width: 100%; border-collapse: collapse; }
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

  const handleExcelExport = () => {
    if (!displayData) return;
    const data = [
      { Item: "الأصول", Value: "" },
      { Item: "  النقدية بالخزن", Value: displayData.cashInSafes },
      { Item: "  النقدية بالبنوك", Value: displayData.cashInBanks },
      {
        Item: "  الذمم المدينة (العملاء)",
        Value: displayData.receivables,
      },
      {
        Item: "  أرصدة مدينة اخري",
        Value: displayData.otherReceivables,
      },
      { Item: "  المخزون", Value: displayData.inventory },
      { Item: "إجمالي الأصول", Value: displayData.totalAssets },
      { Item: "", Value: "" }, // Spacer
      { Item: "الالتزامات", Value: "" },
      {
        Item: "  الموردون (ذمم دائنة)",
        Value: displayData.payables,
      },
      {
        Item: "  أرصدة دائنة اخري",
        Value: displayData.otherPayables,
      },
      {
        Item: "  ضريبة القيمة المضافة المستحقة",
        Value: displayData.vatPayable,
      },
      { Item: "إجمالي الالتزامات", Value: displayData.totalLiabilities },
      { Item: "", Value: "" }, // Spacer
      { Item: "حقوق الملكية", Value: "" },
      { Item: "  رأس المال", Value: displayData.capital },
      { Item: "  جاري الشركاء", Value: displayData.partnersBalance },
      {
        Item: "  الأرباح المحتجزة (أرباح الفترة)",
        Value: displayData.retainedEarnings,
      },
      { Item: "إجمالي حقوق الملكية", Value: displayData.totalEquity },
      { Item: "", Value: "" }, // Spacer
      {
        Item: "إجمالي الالتزامات وحقوق الملكية",
        Value: displayData.totalLiabilitiesAndEquity,
      },
    ];
    exportToExcel(data, "قائمة-المركز-المالي");
  };

  const handlePdfExport = () => {
    if (!displayData) return;
    const head = [["المبلغ", "البيان"]];
    const body = [
      [
        {
          content: "الأصول",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#2563EB",
            textColor: "#FFFFFF",
          },
        },
      ],
      [
        {
          content: formatNumber(displayData.cashInSafes),
          styles: {
            textColor: displayData.cashInSafes < 0 ? "#DC2626" : "#000000",
          },
        },
        "النقدية بالخزن",
      ],
      [
        {
          content: formatNumber(displayData.cashInBanks),
          styles: {
            textColor: displayData.cashInBanks < 0 ? "#DC2626" : "#000000",
          },
        },
        "النقدية بالبنوك",
      ],
      [
        {
          content: formatNumber(displayData.receivables),
          styles: {
            textColor: displayData.receivables < 0 ? "#DC2626" : "#000000",
          },
        },
        "الذمم المدينة (العملاء)",
      ],
      [
        {
          content: formatNumber(displayData.otherReceivables),
          styles: {
            textColor: displayData.otherReceivables < 0 ? "#DC2626" : "#000000",
          },
        },
        "أرصدة مدينة اخري",
      ],
      [
        {
          content: formatNumber(displayData.inventory),
          styles: {
            textColor: displayData.inventory < 0 ? "#DC2626" : "#000000",
          },
        },
        "المخزون",
      ],
      [
        {
          content: formatNumber(displayData.totalAssets),
          styles: {
            fontStyle: "bold",
            fillColor: "#DBEAFE",
            textColor: displayData.totalAssets < 0 ? "#DC2626" : "#000000",
          },
        },
        {
          content: "إجمالي الأصول",
          styles: { fontStyle: "bold", fillColor: "#DBEAFE" },
        },
      ],

      [
        {
          content: "الالتزامات",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#DC2626",
            textColor: "#FFFFFF",
          },
        },
      ],
      [
        {
          content: formatNumber(displayData.payables),
          styles: {
            textColor: displayData.payables < 0 ? "#DC2626" : "#000000",
          },
        },
        "الموردون (ذمم دائنة)",
      ],
      [
        {
          content: formatNumber(displayData.otherPayables),
          styles: {
            textColor: displayData.otherPayables < 0 ? "#DC2626" : "#000000",
          },
        },
        "أرصدة دائنة اخري",
      ],
      [
        {
          content: formatNumber(displayData.vatPayable),
          styles: {
            textColor: displayData.vatPayable < 0 ? "#DC2626" : "#000000",
          },
        },
        "ضريبة القيمة المضافة المستحقة",
      ],
      [
        {
          content: formatNumber(displayData.totalLiabilities),
          styles: {
            fontStyle: "bold",
            fillColor: "#FEE2E2",
            textColor: displayData.totalLiabilities < 0 ? "#DC2626" : "#000000",
          },
        },
        {
          content: "إجمالي الالتزامات",
          styles: { fontStyle: "bold", fillColor: "#FEE2E2" },
        },
      ],

      [
        {
          content: "حقوق الملكية",
          colSpan: 2,
          styles: {
            halign: "center",
            fillColor: "#16A34A",
            textColor: "#FFFFFF",
          },
        },
      ],
      [
        {
          content: formatNumber(displayData.capital),
          styles: {
            textColor: displayData.capital < 0 ? "#DC2626" : "#000000",
          },
        },
        "رأس المال",
      ],
      [
        {
          content: formatNumber(displayData.partnersBalance),
          styles: {
            textColor: displayData.partnersBalance < 0 ? "#DC2626" : "#000000",
          },
        },
        "جاري الشركاء",
      ],
      [
        {
          content: formatNumber(displayData.retainedEarnings),
          styles: {
            textColor: displayData.retainedEarnings < 0 ? "#DC2626" : "#000000",
          },
        },
        "الأرباح المحتجزة (أرباح الفترة)",
      ],
      [
        {
          content: formatNumber(displayData.totalEquity),
          styles: {
            fontStyle: "bold",
            fillColor: "#D1FAE5",
            textColor: displayData.totalEquity < 0 ? "#DC2626" : "#000000",
          },
        },
        {
          content: "إجمالي حقوق الملكية",
          styles: { fontStyle: "bold", fillColor: "#D1FAE5" },
        },
      ],

      [
        {
          content: formatNumber(displayData.totalLiabilitiesAndEquity),
          styles: {
            fontStyle: "bold",
            fillColor: "#4B5563",
            textColor: displayData.totalLiabilitiesAndEquity < 0
              ? "#FCA5A5"
              : "#FFFFFF",
          },
        },
        {
          content: "إجمالي الالتزامات وحقوق الملكية",
          styles: {
            fontStyle: "bold",
            fillColor: "#4B5563",
            textColor: "#FFFFFF",
          },
        },
      ],
    ];
    exportToPdf(title, head, body, "قائمة-المركز-المالي", companyInfo!);
  };

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
  if (error || !displayData || !companyInfo) {
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

  // Net VAT position from VAT Statement (مدين/دائن totals)
  // - If positive => treated as a VAT asset (paid more than collected)
  // - If negative => treated as a VAT liability (owed to tax authority), shown as positive using * -1
  const vatNet = vatNetFromStatement || 0;
  const vatAsset = vatNet > 0 ? vatNet : 0;
  const vatLiability = vatNet < 0 ? vatNet * -1 : 0;

  // Calculate balance discrepancy using the actual displayed totals (including VAT)
  // This matches what's shown in the table
  const displayedTotalAssets =
    displayData.cashInSafes +
    displayData.cashInBanks +
    displayData.receivables +
    displayData.otherReceivables +
    displayData.inventory +
    vatAsset;
  const displayedTotalLiabilitiesAndEquity =
    displayData.payables +
    displayData.otherPayables +
    vatLiability +
    displayData.capital +
    displayData.partnersBalance +
    displayData.retainedEarnings;
  const discrepancy = Math.abs(displayedTotalAssets - displayedTotalLiabilitiesAndEquity);
  const hasDiscrepancy = discrepancy > 0.01; // Allow for small rounding differences

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area-balance-sheet">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2">
          <p className="flex justify-between items-center gap-4 flex-wrap">
            <span>
               من: {startDate} إلى: {endDate}
            </span>
            <span>
              {currentDate}
            </span>
            {currentUser && (
              <span>
                {currentUser.name || currentUser.username || 'غير محدد'}
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className="p-1.5 border border-brand-blue rounded bg-brand-blue-bg text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
            <input
              type="date"
              className="p-1.5 border border-brand-blue rounded bg-brand-blue-bg text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.BALANCE_SHEET,
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
                Resources.BALANCE_SHEET,
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
                Resources.BALANCE_SHEET,
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

        {/* Balance Discrepancy Warning */}
        {hasDiscrepancy && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg no-print">
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-bold text-yellow-800">
                  تحذير: عدم توازن في قائمة المركز المالي
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  الفرق بين إجمالي الأصول وإجمالي الالتزامات وحقوق الملكية:{" "}
                  {formatNumber(discrepancy)}
                </p>
                <p className="text-sm text-yellow-700">
                  إجمالي الأصول: {formatNumber(displayedTotalAssets)} |{" "}
                  إجمالي الالتزامات وحقوق الملكية:{" "}
                  {formatNumber(displayedTotalLiabilitiesAndEquity)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-gray-300 rounded-lg mt-3">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-gray-200">
              {/* Assets */}
              <tr className="bg-blue-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  الأصول
                </Td>
              </tr>
              <tr>
                <Td>النقدية بالخزن</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.cashInSafes)}`}>
                  {formatNumber(displayData.cashInSafes)}
                </Td>
              </tr>
              <tr>
                <Td>النقدية بالبنوك</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.cashInBanks)}`}>
                  {formatNumber(displayData.cashInBanks)}
                </Td>
              </tr>
              <tr>
                <Td>الذمم المدينة (العملاء)</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.receivables)}`}>
                  {formatNumber(displayData.receivables)}
                </Td>
              </tr>
              <tr>
                <Td>أرصدة مدينة اخري</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.otherReceivables)}`}>
                  {formatNumber(displayData.otherReceivables)}
                </Td>
              </tr>
              <tr>
                <Td>المخزون</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.inventory)}`}>
                  {formatNumber(displayData.inventory)}
                </Td>
              </tr>
              <tr>
                <Td>ضريبة القيمة المضافة المدفوعة</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(vatAsset)}`}>
                  {formatNumber(vatAsset)}
                </Td>
              </tr>
              <tr
                className={`font-bold text-white text-lg border-2 border-gray-400 ${
                  hasDiscrepancy ? "bg-yellow-600" : "bg-gray-700"
                }`}
              >
                <Td className="py-4">إجمالي الأصول</Td>
                <Td
                  className={`text-left font-mono text-lg py-4 ${getNegativeNumberClass(
                    displayData.cashInSafes +
                      displayData.cashInBanks +
                      displayData.receivables +
                      displayData.otherReceivables +
                      displayData.inventory +
                      vatAsset,
                  )}`}
                >
                  {formatNumber(
                    displayData.cashInSafes +
                      displayData.cashInBanks +
                      displayData.receivables +
                      displayData.otherReceivables +
                      displayData.inventory +
                      vatAsset,
                  )}
                </Td>
              </tr>

              {/* Liabilities */}
              <tr className="bg-red-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  الالتزامات
                </Td>
              </tr>
              <tr>
                <Td>الموردون (ذمم دائنة)</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.payables)}`}>
                  {formatNumber(displayData.payables)}
                </Td>
              </tr>
              <tr>
                <Td>أرصدة دائنة اخري</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.otherPayables)}`}>
                  {formatNumber(displayData.otherPayables)}
                </Td>
              </tr>
              <tr>
                <Td>ضريبة القيمة المضافة المستحقة</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(vatLiability)}`}>
                  {formatNumber(vatLiability)}
                </Td>
              </tr>
              <tr className="font-bold bg-red-100 text-red-800">
                <Td>إجمالي الالتزامات</Td>
                <Td
                  className={`text-left font-mono text-lg ${getNegativeNumberClass(
                    displayData.payables + displayData.otherPayables + vatLiability,
                  )}`}
                >
                  {formatNumber(displayData.payables + displayData.otherPayables + vatLiability)}
                </Td>
              </tr>

              {/* Equity */}
              <tr className="bg-green-600 text-white font-bold">
                <Td colSpan={2} className="text-lg">
                  حقوق الملكية
                </Td>
              </tr>
              <tr>
                <Td>رأس المال</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.capital)}`}>
                  {formatNumber(displayData.capital)}
                </Td>
              </tr>
              <tr>
                <Td>جاري الشركاء</Td>
                <Td className={`text-left font-mono ${getNegativeNumberClass(displayData.partnersBalance)}`}>
                  {formatNumber(displayData.partnersBalance)}
                </Td>
              </tr>
              <tr>
                <Td> الأرباح ( الخسائر ) المبقاة</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(displayData.retainedEarnings)}`}>
                  {formatNumber(displayData.retainedEarnings)}
                </Td>
              </tr>
              <tr className="font-bold bg-green-100 text-green-800">
                <Td>إجمالي حقوق الملكية</Td>
                <Td className={`text-left font-mono text-lg ${getNegativeNumberClass(displayData.totalEquity)}`}>
                  {formatNumber(displayData.totalEquity)}
                </Td>
              </tr>

              {/* Total Liabilities & Equity */}
              <tr
                className={`font-bold text-white text-lg border-4 border-gray-400 ${
                  hasDiscrepancy ? "bg-yellow-600" : "bg-gray-700"
                }`}
              >
                <Td className="py-4">إجمالي الالتزامات وحقوق الملكية</Td>
                <Td
                  className={`text-left font-mono text-lg py-4 ${getNegativeNumberClass(
                    displayData.payables +
                      displayData.otherPayables +
                      vatLiability +
                      displayData.capital +
                      displayData.partnersBalance +
                      displayData.retainedEarnings,
                  )}`}
                >
                  {formatNumber(
                    displayData.payables +
                      displayData.otherPayables +
                      vatLiability +
                      displayData.capital +
                      displayData.partnersBalance +
                      displayData.retainedEarnings,
                  )}
                </Td>
              </tr>
              {/* Balance Check Row */}
              {hasDiscrepancy && (
                <tr className="bg-red-100">
                  <Td className="text-red-800 font-bold">
                    ⚠️ الفرق (عدم التوازن)
                  </Td>
                  <Td className="text-left font-mono text-red-800 font-bold">
                    {formatNumber(discrepancy)}
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;