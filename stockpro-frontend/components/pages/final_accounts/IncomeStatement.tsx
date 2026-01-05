import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ExcelIcon, PdfIcon, PrintIcon } from "../../icons";
import ReportHeader from "../reports/ReportHeader";
import {
  formatNumber,
  getNegativeNumberClass,
  exportToExcel,
  exportToPdf,
} from "../../../utils/formatting";
import { useIncomeStatement } from "../../hook/useIncomeStatement";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useGetExpenseTypesQuery } from "../../store/slices/expense/expenseApiSlice";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useGetItemsQuery } from "../../store/slices/items/itemsApi";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseReturnsQuery } from "../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetStoreReceiptVouchersQuery } from "../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetStoreTransferVouchersQuery } from "../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { useGetStoresQuery, useGetAllStoreItemsQuery } from "../../store/slices/store/storeApi";
import { useGetReceiptVouchersQuery } from "../../store/slices/receiptVoucherApiSlice";
import { useAuth } from "../../hook/Auth";
import { useGetFinancialSettingsQuery } from "../../store/slices/financialSettings/financialSettingsApi";
import { ValuationMethod } from "../../pages/settings/financial-system/types";

type StatementRow = {
  statement: string;
  partial?: number | null;
  total?: number | null;
};

const asNegative = (value: number): number => (value === 0 ? 0 : -Math.abs(value));

/**
 * Income Statement Component
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
 * - Net Purchases: All purchase invoices and returns from ALL branches
 * - Sales & Discounts: All sales invoices and returns from ALL branches
 * - Other Revenues: All receipt vouchers from ALL branches
 * - Expenses: All payment vouchers from ALL branches (via backend)
 * 
 * All API queries fetch company-wide data (no branch/store filtering):
 * - useGetSalesInvoicesQuery() - all company sales invoices
 * - useGetPurchaseInvoicesQuery() - all company purchase invoices
 * - useGetSalesReturnsQuery() - all company sales returns
 * - useGetPurchaseReturnsQuery() - all company purchase returns
 * - useGetStoreReceiptVouchersQuery(undefined) - all company store receipts
 * - useGetStoreIssueVouchersQuery(undefined) - all company store issues
 * - useGetStoreTransferVouchersQuery(undefined) - all company store transfers
 * - useGetReceiptVouchersQuery(undefined) - all company receipt vouchers
 * - useGetAllStoreItemsQuery() - all StoreItems across all stores/branches
 */
const IncomeStatement: React.FC = () => {
  const title = "قائمة الدخل";
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  
  // Get unified inventory valuation method from Redux
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  
  // Map unified inventory valuation method to valuation method string
  // Since methods are now unified, use inventoryValuationMethod for consistency
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

  const {
    data: financialData,
    companyInfo,
    isLoading,
    error,
  } = useIncomeStatement(startDate, endDate);

  // Get current user for print
  const { User: currentUser } = useAuth();

  // Get current date for print
  const currentDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDateForDisplay = useCallback((dateString: string): string => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  }, []);

  // Fetch expense types to display dynamically
  const { data: expenseTypes = [] } = useGetExpenseTypesQuery();

  // COMPANY-WIDE DATA FETCHING: All queries use undefined to fetch ALL company data
  // Backend APIs filter by companyId only, ensuring all branches are included
  // Fetch data for inventory calculation
  const { data: apiItems = [] } = useGetItemsQuery(undefined);
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery();
  const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery();
  const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery();
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
  const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);
  const { data: stores = [] } = useGetStoresQuery(undefined);
  const { data: apiReceiptVouchers = [] } = useGetReceiptVouchersQuery(undefined);
  
  // Fetch all StoreItems across all stores to aggregate opening balances company-wide
  // This ensures inventory calculations include opening balances from ALL branches/stores
  const { data: allStoreItems = [] } = useGetAllStoreItemsQuery();

  // Define the original order of expense types as they were hardcoded
  const expenseTypeOrder = [
    'مصروفات تشغيلية',
    'مصروفات تسويقية',
    'مصروفات إدارية',
    'مصروفات عمومية',
    'مصروفات أخري',
  ];

  // Get expense types in the same order as they were originally displayed
  // Only include expense types that match the expenseTypeOrder array
  const sortedExpenseTypes = useMemo(() => {
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
      
      return -1; // Not found in order list
    };
    
    // Filter to only include expense types that match the order list
    return [...expenseTypes]
      .filter((expenseType) => getOrderIndex(expenseType.name) !== -1)
      .sort((a, b) => {
        const indexA = getOrderIndex(a.name);
        const indexB = getOrderIndex(b.name);
        
        // Sort by their position in the order list
        return indexA - indexB;
      });
  }, [expenseTypes]);

  // Helper function to normalize dates
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

  // Transform items to filter out services and include necessary fields
  // Note: openingBalance will be set from aggregatedOpeningBalances in calculatedEndingInventory
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

  // Transform sales invoices for inventory calculation
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

  // Transform sales returns for inventory calculation
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

  // Transform purchase invoices for inventory calculation
  const transformedPurchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
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
  }, [apiPurchaseInvoices]);

  // Transform purchase returns for inventory calculation
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

  // Transform store receipt vouchers for inventory calculation
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

  // Transform store issue vouchers for inventory calculation
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

  // Transform store transfer vouchers for inventory calculation
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

  // Helper function to get last purchase price before or on a reference date
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    // Get all purchase invoices up to the reference date, sorted by date descending
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
   * Calculate ending inventory - COMPANY-WIDE calculation
   * Aggregates inventory across ALL branches and stores
   * No branch filtering is applied - all transactions from all branches are included
   * 
   * Opening balances are aggregated from ALL StoreItems across ALL stores/branches
   * using the aggregatedOpeningBalances map which sums opening balances by item code.
   * 
   * All transaction types (purchases, sales, returns, store vouchers) are processed
   * without branch filtering to ensure company-wide inventory calculation.
   */
  const calculatedEndingInventory = useMemo(() => {
    const normalizedEndDate = normalizeDate(endDate);
    if (!normalizedEndDate || transformedItems.length === 0) return 0;

    // Use the unified valuation method from financial system settings
    const valuationMethod = inventoryValuationMethod;

    const valuationData = transformedItems.map((item) => {
      // Use aggregated opening balance from ALL stores/branches for this item
      // This ensures company-wide inventory calculation includes all branches
      const itemCode = item.code;
      let balance = aggregatedOpeningBalances[itemCode] || 0;

      // Filter transactions up to and including endDate
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

    // Calculate total inventory value
    const totalValue = valuationData.reduce((acc, item) => acc + item.value, 0);
    return totalValue;
  }, [
    transformedItems,
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

  const netSalesAfterDiscount = useMemo(() => {
    if (!financialData) return 0;
    return financialData.netSales - allowedDiscount;
  }, [financialData, allowedDiscount]);

  const statementRows = useMemo<StatementRow[]>(() => {
    if (!financialData) return [];

    const rows: StatementRow[] = [];
    const addRow = (
      statement: string,
      partial?: number | null,
      total?: number | null,
    ) => rows.push({ statement, partial, total });

    addRow("الإيرادات");
    addRow("إجمالي المبيعات", financialData.totalSales);
    addRow("(-) مرتجع المبيعات", asNegative(financialData.totalSalesReturns));
    addRow("(-) خصم مسموح به", asNegative(allowedDiscount));
    addRow("صافي المبيعات", undefined, netSalesAfterDiscount);

    addRow("تكلفة البضاعة المباعة");
    addRow("رصيد مخزون أول المدة", financialData.beginningInventory);
    addRow("(+) صافي المشتريات", calculatedNetPurchases);
    addRow(
      "(-) رصيد مخزون آخر المدة",
      asNegative(calculatedEndingInventory),
    );
    const calculatedCogs =
      financialData.beginningInventory +
      calculatedNetPurchases -
      calculatedEndingInventory;
    addRow(
      "تكلفة البضاعة المباعة",
      undefined,
      asNegative(calculatedCogs),
    );

    const calculatedGrossProfit = netSalesAfterDiscount - calculatedCogs;
    addRow("مجمل الربح", undefined, calculatedGrossProfit);

    addRow("الايرادات الاخري", calculatedOtherRevenues);

    addRow("المصروفات");
    sortedExpenseTypes.forEach((expenseType) => {
      const expenseAmount =
        financialData.expensesByType?.[expenseType.name] || 0;
      addRow(expenseType.name, asNegative(expenseAmount));
    });

    addRow(
      "إجمالي المصروفات",
      undefined,
      asNegative(financialData.totalExpenses),
    );

    const calculatedNetProfit = calculatedGrossProfit + calculatedOtherRevenues - financialData.totalExpenses;
    addRow("صافي الربح / (الخسارة)", undefined, calculatedNetProfit);

    return rows;
  }, [
    financialData,
    sortedExpenseTypes,
    calculatedEndingInventory,
    calculatedOtherRevenues,
    allowedDiscount,
    netSalesAfterDiscount,
    calculatedNetPurchases,
  ]);

  const formatExportValue = (value?: number | null): string => {
    if (value === null || value === undefined) return "";
    const absolute = formatNumber(Math.abs(value));
    return value < 0 ? `(${absolute})` : absolute;
  };

  const exportFileName = useMemo(
    () => `قائمة-الدخل-${startDate}-الى-${endDate}`.replace(/\s+/g, "-"),
    [startDate, endDate],
  );

  const handleExcelExport = () => {
    if (!statementRows.length) return;
    const data = statementRows.map((row) => ({
      البيان: row.statement,
      جزئي: formatExportValue(row.partial),
      كلي: formatExportValue(row.total),
    }));
    exportToExcel(data, exportFileName);
  };

  const handlePdfExport = async () => {
    if (!statementRows.length || !companyInfo) return;
    const head = [["البيان", "جزئي", "كلي"]];
    const body = statementRows.map((row) => [
      row.statement,
      formatExportValue(row.partial),
      formatExportValue(row.total),
    ]);
    const pdfTitle = `${title} (${startDate} - ${endDate})`;
    await exportToPdf(pdfTitle, head, body, exportFileName, companyInfo);
  };

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
      `<style>
        @page {
          size: A4;
          margin: 0.5cm;
        }
        body { font-family: "Cairo", sans-serif; direction: rtl; }
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .bg-brand-blue {
            background-color: #1E40AF !important;
          }
          .text-white {
            color: white !important;
          }
          .bg-gray-100 {
            background-color: #F9FAFB !important;
          }
          .bg-blue-100 {
            background-color: #DBEAFE !important;
          }
          .bg-green-100 {
            background-color: #D1FAE5 !important;
          }
          .bg-brand-green {
            background-color: #16A34A !important;
          }
          .text-green-800 {
            color: #166534 !important;
          }
          .bg-red-600 {
            background-color: #DC2626 !important;
          }
          .bg-red-200 {
            background-color: #FECACA !important;
          }
          thead tr.bg-brand-green th {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
          tbody tr.bg-brand-green td {
            padding-top: 1rem !important;
            padding-bottom: 1rem !important;
          }
        }
      </style>`,
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
    "p-1.5 border border-brand-blue rounded bg-brand-blue-bg focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm";
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
        <ReportHeader title={title} />
        
        <div className="mb-4 text-sm print:mb-2 hidden print:block">
          <p className="flex justify-between items-center gap-4 flex-wrap text-sm font-semibold text-brand-dark">
            <span>
              {formatDateForDisplay(startDate)} إلى {formatDateForDisplay(endDate)}
            </span>
            <span>
              {currentDate}
            </span>
            {currentUser && (
              <span>
                {currentUser.name || currentUser.username || "غير محدد"}
              </span>
            )}
          </p>
        </div>

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
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.INCOME_STATEMENT,
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
                Resources.INCOME_STATEMENT,
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
                Resources.INCOME_STATEMENT,
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

        <div className="overflow-x-auto border border-brand-blue rounded-lg mt-3">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-brand-green text-white text-sm">
                <th className="px-2 py-4 text-right font-semibold text-white w-3/5">
                  البيان
                </th>
                <th className="px-2 py-4 text-left font-semibold text-white">
                  جزئي
                </th>
                <th className="px-2 py-4 text-left font-semibold text-white">
                  كلي
                </th>
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
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.totalSales)}`}>
                  {formatNumber(financialData.totalSales)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) مرتجع المبيعات</Td>
                <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(financialData.totalSalesReturns)}`}>
                  ({formatNumber(financialData.totalSalesReturns)})
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) خصم مسموح به</Td>
                <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(allowedDiscount)}`}>
                  ({formatNumber(allowedDiscount)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>صافي المبيعات</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg ${getNegativeNumberClass(netSalesAfterDiscount)}`}>
                  {formatNumber(netSalesAfterDiscount)}
                </Td>
              </tr>

              <tr className="bg-blue-100 font-bold text-brand-dark">
                <Td colSpan={3} className="text-lg">
                  تكلفة البضاعة المباعة
                </Td>
              </tr>
              <tr>
                <Td>رصيد مخزون أول المدة</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(financialData.beginningInventory)}`}>
                  {formatNumber(financialData.beginningInventory)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td>(+) صافي المشتريات</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(calculatedNetPurchases)}`}>
                  {formatNumber(calculatedNetPurchases)}
                </Td>
                <Td></Td>
              </tr>
              <tr>
                <Td className="text-red-600">(-) رصيد مخزون آخر المدة</Td>
                <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(calculatedEndingInventory)}`}>
                  ({formatNumber(calculatedEndingInventory)})
                </Td>
                <Td></Td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <Td>تكلفة البضاعة المباعة</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg text-red-600 ${getNegativeNumberClass(financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory)}`}>
                  ({formatNumber(financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory)})
                </Td>
              </tr>

              <tr className="font-bold text-xl bg-green-100 text-green-800">
                <Td>مجمل الربح</Td>
                <Td></Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(netSalesAfterDiscount - (financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory))}`}>
                  {formatNumber(netSalesAfterDiscount - (financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory))}
                </Td>
              </tr>

              <tr>
                <Td>الايرادات الاخري</Td>
                <Td className={`font-mono text-left ${getNegativeNumberClass(calculatedOtherRevenues)}`}>
                  {formatNumber(calculatedOtherRevenues)}
                </Td>
                <Td></Td>
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
                    <Td className={`font-mono text-left text-red-600 ${getNegativeNumberClass(expenseAmount)}`}>
                      ({formatNumber(expenseAmount)})
                    </Td>
                    <Td></Td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-gray-100">
                <Td>إجمالي المصروفات</Td>
                <Td></Td>
                <Td className={`font-mono text-left text-lg text-red-600 ${getNegativeNumberClass(financialData.totalExpenses)}`}>
                  ({formatNumber(financialData.totalExpenses)})
                </Td>
              </tr>

              <tr
                className={`font-bold text-2xl text-white ${(netSalesAfterDiscount - (financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory) + calculatedOtherRevenues - financialData.totalExpenses) >= 0 ? "bg-brand-green" : "bg-red-200"}`}
              >
                <Td className="py-4">صافي الربح / (الخسارة)</Td>
                <Td className="py-4"></Td>
                <Td className={`py-4 font-mono text-left ${getNegativeNumberClass(netSalesAfterDiscount - (financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory) + calculatedOtherRevenues - financialData.totalExpenses)}`}>
                  {formatNumber(netSalesAfterDiscount - (financialData.beginningInventory + calculatedNetPurchases - calculatedEndingInventory) + calculatedOtherRevenues - financialData.totalExpenses)}
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
