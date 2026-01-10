import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal, exportToExcel } from "../../../../utils/formatting";
import { useGetItemsQuery } from "../../../store/slices/items/itemsApi";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetStoresQuery, useGetAllStoreItemsQuery } from "../../../store/slices/store/storeApi";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetStoreReceiptVouchersQuery } from "../../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetStoreTransferVouchersQuery } from "../../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { getCurrentYearRange, formatDate } from "../dateUtils";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";
import { useUserPermissions } from "../../../hook/usePermissions";
import { calculateCompanyInventoryValuation } from "../../../../utils/inventoryValuation";
import { useGetFinancialSettingsQuery } from "../../../store/slices/financialSettings/financialSettingsApi";
import { ValuationMethod } from "../../../pages/settings/financial-system/types";

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

interface InventoryValuationReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const InventoryValuationReport: React.FC<InventoryValuationReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  const { hasPermission } = useUserPermissions();
  
  // Get financial settings for inventory valuation method
  const { data: financialSettings } = useGetFinancialSettingsQuery();
  
  // Map inventory valuation method to valuation method string (for company-wide calculation)
  const systemValuationMethod = useMemo(() => {
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
  
  // Check if user has SEARCH permission to view all branches
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.INVENTORY_VALUATION_REPORT, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Get store for selected branch
  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { data: stores = [], isLoading: storesLoading } =
    useGetStoresQuery(undefined);
  
  // Get current user's branch ID
  const userBranchId = useMemo(() => getUserBranchId(currentUser), [currentUser]);
  
  // Branch filter state - default based on permission
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    // Compute initial value based on permission check
    const hasSearchPermission = hasPermission(
      buildPermission(Resources.INVENTORY_VALUATION_REPORT, Actions.SEARCH),
    );
    return hasSearchPermission 
      ? (userBranchId || "all") 
      : (userBranchId || "");
  });
  
  // Sync selectedBranchId when permission changes or branches load
  useEffect(() => {
    if (!canSearchAllBranches && branches.length > 0 && userBranchId) {
      // Verify the user's branch exists in branches list
      const userBranchExists = branches.some(b => b.id === userBranchId);
      if (userBranchExists && selectedBranchId !== userBranchId) {
        setSelectedBranchId(userBranchId);
      }
    } else if (!canSearchAllBranches && !userBranchId && selectedBranchId !== "") {
      setSelectedBranchId("");
    }
  }, [canSearchAllBranches, userBranchId, selectedBranchId, branches]);
  
  const selectedStore = selectedBranchId === "all" 
    ? null
    : stores.find((store) => store.branchId === selectedBranchId);
  
  // When "all branches" is selected, fetch all items (no store filter) to get complete item list
  // (we'll aggregate opening balances from all stores separately)
  // Otherwise, fetch items for the selected store
  const { data: apiItemsForSelectedStore = [], isLoading: itemsLoadingForSelectedStore } =
    useGetItemsQuery(
      selectedStore 
        ? { storeId: selectedStore.id } 
        : (selectedBranchId === "all" ? undefined : undefined),
      {
        skip: false,
      }
    );
  
  // Fetch all store items to aggregate opening balances when "all branches" is selected
  const { data: allStoreItems = [], isLoading: allStoreItemsLoading } = useGetAllStoreItemsQuery(undefined, {
    skip: selectedBranchId !== "all",
  });
  
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
  
  // Aggregate items and opening balances from all stores when "all branches" is selected
  const aggregatedItems = useMemo(() => {
    if (selectedBranchId !== "all") {
      return apiItemsForSelectedStore;
    }
    
    // When "all branches" is selected, we need to get ALL items from ALL stores
    // Use apiItemsForSelectedStore as a base, but we should ideally fetch all items
    // For now, we'll use items from the first store and set their opening balances from aggregatedOpeningBalances
    const itemsMap = new Map<string, any>();
    apiItemsForSelectedStore.forEach((item: any) => {
      itemsMap.set(item.code, {
        ...item,
        openingBalance: aggregatedOpeningBalances[item.code] ?? 0,
      });
    });
    
    return Array.from(itemsMap.values());
  }, [selectedBranchId, allStoreItems, apiItemsForSelectedStore, aggregatedOpeningBalances]);
  
  // Use aggregated items when "all branches" is selected, otherwise use selected store items
  const apiItems = selectedBranchId === "all" ? aggregatedItems : apiItemsForSelectedStore;
  const itemsLoading = selectedBranchId === "all" 
    ? (itemsLoadingForSelectedStore || allStoreItemsLoading)
    : itemsLoadingForSelectedStore;
  const { data: salesInvoices = [], isLoading: salesInvoicesLoading } =
    useGetSalesInvoicesQuery(undefined);
  const { data: salesReturns = [], isLoading: salesReturnsLoading } =
    useGetSalesReturnsQuery(undefined);
  const { data: purchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: purchaseReturns = [], isLoading: purchaseReturnsLoading } =
    useGetPurchaseReturnsQuery(undefined);
  const {
    data: storeReceiptVouchers = [],
    isLoading: storeReceiptVouchersLoading,
  } = useGetStoreReceiptVouchersQuery(undefined);
  const {
    data: storeIssueVouchers = [],
    isLoading: storeIssueVouchersLoading,
  } = useGetStoreIssueVouchersQuery(undefined);
  const {
    data: storeTransferVouchers = [],
    isLoading: storeTransferVouchersLoading,
  } = useGetStoreTransferVouchersQuery(undefined);

  const normalizeDate = useMemo(
    () => (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        const parsed = new Date(date);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().substring(0, 10);
        }
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().substring(0, 10);
      }
      return "";
    },
    [],
  );

  // Transform API data to match expected format
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
    return (salesInvoices as any[]).map((invoice) => ({
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
  }, [salesInvoices]);

  const transformedSalesReturns = useMemo(() => {
    return (salesReturns as any[]).map((invoice) => ({
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
  }, [salesReturns]);

  const transformedPurchaseInvoices = useMemo(() => {
    return (purchaseInvoices as any[]).map((invoice) => ({
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
  }, [purchaseInvoices]);

  const transformedPurchaseReturns = useMemo(() => {
    return (purchaseReturns as any[]).map((invoice) => ({
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
  }, [purchaseReturns]);

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

  const isLoading =
    itemsLoading ||
    branchesLoading ||
    storesLoading ||
    salesInvoicesLoading ||
    salesReturnsLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    storeReceiptVouchersLoading ||
    storeIssueVouchersLoading ||
    storeTransferVouchersLoading;
  const [reportData, setReportData] = useState<any[]>([]);
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [valuationMethod, setValuationMethod] = useState<
    "purchasePrice" | "salePrice" | "averageCost"
  >("averageCost");

  // Helper function to get last purchase price before or on a reference date
  // When "all branches" is selected, this doesn't filter by branch (company-wide)
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    // When "all branches" is selected, don't filter by branch (company-wide calculation)
    // Otherwise, filter by selected branch
    const selectedBranchName = selectedBranchId === "all" 
      ? "all"
      : branches.find(b => b.id === selectedBranchId)?.name || "";
    
    const filterByBranch = (tx: any) =>
      selectedBranchId === "all" ||
      tx.branch === selectedBranchName ||
      tx.branchName === selectedBranchName ||
      tx.branchId === selectedBranchId;

    // Get all purchase invoices up to the reference date, sorted by date descending
    const relevantInvoices = transformedPurchaseInvoices
      .filter(filterByBranch)
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
  }, [transformedPurchaseInvoices, selectedBranchId, branches, normalizeDate]);

  // Helper function to get last sale price before or on a reference date
  const getLastSalePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const selectedBranchName = selectedBranchId === "all" 
      ? "all"
      : branches.find(b => b.id === selectedBranchId)?.name || "";
    
    const filterByBranch = (tx: any) =>
      selectedBranchId === "all" ||
      tx.branch === selectedBranchName ||
      tx.branchName === selectedBranchName ||
      tx.branchId === selectedBranchId;

    // Get all sales invoices up to the reference date, sorted by date descending
    const relevantInvoices = transformedSalesInvoices
      .filter(filterByBranch)
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.date) || normalizeDate(a.invoiceDate) || "";
        const dateB = normalizeDate(b.date) || normalizeDate(b.invoiceDate) || "";
        return dateB.localeCompare(dateA); // Descending order
      });

    // Find the most recent sale price for this item
    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null;
  }, [transformedSalesInvoices, selectedBranchId, branches, normalizeDate]);

  // Helper function to calculate weighted average cost up to a reference date
  // When "all branches" is selected, this uses aggregated opening balance and doesn't filter by branch (company-wide)
  const calculateWeightedAverageCost = useCallback((item: any, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const itemCode = item.code;
    // When "all branches" is selected, use aggregated opening balance from all stores
    // Otherwise, use the item's opening balance
    const openingBalance = selectedBranchId === "all"
      ? (aggregatedOpeningBalances[itemCode] || 0)
      : toNumber((item as any).openingBalance ?? 0);
    const initialPurchasePrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);

    // When "all branches" is selected, don't filter by branch (company-wide calculation)
    // Otherwise, filter by selected branch
    const selectedBranchName = selectedBranchId === "all" 
      ? "all"
      : branches.find(b => b.id === selectedBranchId)?.name || "";
    
    const filterByBranch = (tx: any) =>
      selectedBranchId === "all" ||
      tx.branch === selectedBranchName ||
      tx.branchName === selectedBranchName ||
      tx.branchId === selectedBranchId;

    // Get all purchase invoices up to the reference date
    const relevantInvoices = transformedPurchaseInvoices
      .filter(filterByBranch)
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
  }, [transformedPurchaseInvoices, selectedBranchId, branches, normalizeDate, toNumber, aggregatedOpeningBalances]);

  const handleViewReport = useCallback(() => {
    if (isLoading) return;

    const normalizedEndDate = normalizeDate(endDate);

    // When "all branches" is selected, use the shared company-wide inventory calculation
    // to ensure consistency with Balance Sheet and Income Statement
    if (selectedBranchId === "all") {
      // Use the system valuation method from financial settings for company-wide calculation
      const effectiveValuationMethod = systemValuationMethod;
      
      // Create helper functions that don't filter by branch (company-wide)
      const getLastPurchasePriceCompanyWide = (itemCode: string, referenceDate: string): number | null => {
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
      };

      const calculateWeightedAverageCostCompanyWide = (item: any, referenceDate: string): number | null => {
        const normalizedReferenceDate = normalizeDate(referenceDate);
        if (!normalizedReferenceDate) return null;

        const itemCode = item.code;
        const openingBalance = aggregatedOpeningBalances[itemCode] || 0;
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
      };

      // Use the shared company-wide inventory calculation
      const { results } = calculateCompanyInventoryValuation({
        items,
        aggregatedOpeningBalances,
        purchaseInvoices: transformedPurchaseInvoices,
        salesInvoices: transformedSalesInvoices,
        purchaseReturns: transformedPurchaseReturns,
        salesReturns: transformedSalesReturns,
        storeReceiptVouchers: transformedStoreReceiptVouchers,
        storeIssueVouchers: transformedStoreIssueVouchers,
        storeTransferVouchers: transformedStoreTransferVouchers,
        stores,
        endDate,
        valuationMethod: effectiveValuationMethod,
        normalizeDate,
        toNumber,
        getLastPurchasePriceBeforeDate: getLastPurchasePriceCompanyWide,
        calculateWeightedAverageCost: calculateWeightedAverageCostCompanyWide,
      });

      // Transform results to match expected format
      const valuationData = results.map((result) => ({
        ...result.item,
        balance: result.balance,
        cost: result.cost,
        value: result.value,
      }));

      setReportData(valuationData);
      return;
    }

    // For branch-specific calculation, use the original logic
    const valuationData = items.map((item) => {
      // Use StoreItem's openingBalance as base, or 0 if not available
      let balance = toNumber((item as any).openingBalance ?? 0);

      const selectedBranchName = selectedBranchId === "all" 
        ? "all"
        : branches.find(b => b.id === selectedBranchId)?.name || "";
      
      const filterByBranch = (tx: any) =>
        selectedBranchId === "all" ||
        tx.branch === selectedBranchName ||
        tx.branchName === selectedBranchName ||
        tx.branchId === selectedBranchId;

      // Filter transactions up to and including endDate
      // Calculate balance as of endDate (find all transactions that happened before or on the end date)
      const filterByDate = (tx: any) => {
        if (!normalizedEndDate) return false;
        const txDate =
          normalizeDate(tx.date) ||
          normalizeDate(tx.invoiceDate) ||
          normalizeDate(tx.transactionDate);
        if (!txDate) return false;
        return txDate <= normalizedEndDate;
      };
      transformedPurchaseInvoices.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );
      transformedSalesReturns.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );
      transformedStoreReceiptVouchers.filter(filterByBranch).filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance += toNumber(i.qty);
        }),
      );

      transformedSalesInvoices.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );
      transformedPurchaseReturns.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );
      transformedStoreIssueVouchers.filter(filterByBranch).filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance -= toNumber(i.qty);
        }),
      );

      // Handle store transfer vouchers
      if (selectedBranchId === "all") {
        // When "all branches" is selected, include all transfers (net effect is 0, but we process them for completeness)
        // Actually, for "all branches", transfers between stores don't affect the total balance
        // since they're internal transfers. We can skip them or include them - they cancel out.
        // For now, we'll skip them as they don't affect the total inventory value across all branches
      } else {
        // For a specific branch, only include transfers that affect this branch
        transformedStoreTransferVouchers.filter(filterByDate).forEach((v) => {
          const fromStore = stores.find((s) => s.name === v.fromStore);
          const toStore = stores.find((s) => s.name === v.toStore);
          v.items.forEach((i) => {
            if (i.id === item.code) {
              const qty = toNumber(i.qty);
              if (fromStore?.branchId === selectedBranchId) balance -= qty;
              if (toStore?.branchId === selectedBranchId) balance += qty;
            }
          });
        });
      }

      // Calculate cost based on valuation method at end of the period (end date)
      // Find the nearest purchase invoice that happened before or on the end date
      let cost = 0;
      const priceReferenceDate = endDate;
      const fallbackPrice =
        toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);
      switch (valuationMethod) {
        case "purchasePrice": {
          const lastPurchasePrice = getLastPurchasePriceBeforeDate(item.code, priceReferenceDate);
          cost = lastPurchasePrice ?? fallbackPrice;
          break;
        }
        case "salePrice": {
          const lastSalePrice = getLastSalePriceBeforeDate(item.code, priceReferenceDate);
          cost = lastSalePrice ?? item.salePrice ?? fallbackPrice;
          break;
        }
        case "averageCost": {
          const avgCost = calculateWeightedAverageCost(item, priceReferenceDate);
          // Fallback to last purchase price if no purchases found
          if (avgCost === null) {
            const lastPurchasePrice = getLastPurchasePriceBeforeDate(item.code, priceReferenceDate);
            cost = lastPurchasePrice ?? fallbackPrice;
          } else {
            cost = avgCost;
          }
          break;
        }
        default:
          cost = fallbackPrice;
          break;
      }

      const value = balance * cost;

      return {
        ...item,
        balance,
        cost,
        value,
      };
    });
    setReportData(valuationData);
  }, [
    items,
    selectedBranchId,
    valuationMethod,
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
    isLoading,
    branches,
    getLastPurchasePriceBeforeDate,
    getLastSalePriceBeforeDate,
    calculateWeightedAverageCost,
    startDate,
    toNumber,
    systemValuationMethod,
    aggregatedOpeningBalances,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totalValue = reportData.reduce((acc, item) => acc + item.value, 0);

  const handleExcelExport = () => {
    const dataToExport = [
      ...reportData.map((item) => ({
        "كود الصنف": item.code,
        "اسم الصنف": item.name,
        الوحدة: item.unit,
        الرصيد: formatNumber(item.balance),
        السعر: formatNumber(item.cost),
        "القيمة الإجمالية": formatNumber(item.value),
      })),
      {
        "كود الصنف": "الإجمالي",
        "اسم الصنف": "",
        الوحدة: "",
        الرصيد: "",
        السعر: "",
        "القيمة الإجمالية": formatNumber(totalValue),
      },
    ];
    exportToExcel(dataToExport, "تقرير_تقييم_المخزون");
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
                <span className="font-semibold text-gray-800">تقييم حسب سعر:</span> {
                  (selectedBranchId === "all" ? systemValuationMethod : valuationMethod) === 'purchasePrice' ? 'آخر شراء' :
                  (selectedBranchId === "all" ? systemValuationMethod : valuationMethod) === 'averageCost' ? 'متوسط التكلفة' :
                  (selectedBranchId === "all" ? systemValuationMethod : valuationMethod) === 'salePrice' ? 'سعر البيع' :
                  'آخر شراء'
                }
                {selectedBranchId === "all" && (
                  <span className="text-sm text-gray-600 mr-2">(من إعدادات النظام - يطابق القوائم المالية)</span>
                )}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranchId === "all" ? "جميع الفروع" : branches.find(b => b.id === selectedBranchId)?.name || ""}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap no-print">
            <label className="font-semibold">الفرع:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={!canSearchAllBranches}
            >
              {canSearchAllBranches && <option value="all">جميع الفروع</option>}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
              {!canSearchAllBranches && !branches.find(b => b.id === selectedBranchId) && userBranchId && (
                <option value={userBranchId}>
                  {branches.find(b => b.id === userBranchId)?.name || "الفرع الحالي"}
                </option>
              )}
            </select>
            <label className="font-semibold">تقييم حسب سعر:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={selectedBranchId === "all" ? systemValuationMethod : valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value as any)}
              disabled={selectedBranchId === "all"}
              title={selectedBranchId === "all" ? "عند اختيار جميع الفروع، يتم استخدام طريقة التقييم من إعدادات النظام لضمان التطابق مع القوائم المالية" : ""}
            >
              <option value="purchasePrice">آخر شراء</option>
              <option value="averageCost">متوسط التكلفة</option>
              <option value="salePrice">سعر البيع</option>
            </select>
            {selectedBranchId === "all" && (
              <span className="text-sm text-gray-600" title="عند اختيار جميع الفروع، يتم استخدام طريقة التقييم من إعدادات النظام لضمان التطابق مع قائمة المركز المالي وقائمة الدخل">
                (يستخدم إعدادات النظام)
              </span>
            )}
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
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
              Resources.INVENTORY_VALUATION_REPORT,
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-80">
                  اسم الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الوحدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  السعر
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  القيمة الإجمالية
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-4 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-80">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.balance)}`}>{formatNumber(item.balance)}</td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.cost)}`}>{formatNumber(item.cost)}</td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.value)}`}>
                    {formatNumber(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td colSpan={5} className="px-6 py-3 text-right text-white">
                  إجمالي قيمة المخزون
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totalValue)}`}>
                  {formatNumber(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryValuationReport;
