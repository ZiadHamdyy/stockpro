/**
 * Shared inventory valuation calculation utility
 * 
 * This module provides a canonical company-wide inventory valuation calculation
 * that is used consistently across Balance Sheet, Income Statement, and Inventory Valuation Report.
 * 
 * The calculation:
 * - Aggregates opening balances from ALL StoreItems across ALL stores/branches
 * - Includes all transactions (purchases, sales, returns, store vouchers) from all branches
 * - Uses the valuation method from financial system settings (averageCost or purchasePrice)
 * - Calculates inventory value as of a specific end date
 */

export type ValuationMethod = "averageCost" | "purchasePrice" | "salePrice";

export interface InventoryItem {
  code: string;
  initialPurchasePrice?: number | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  [key: string]: any;
}

export interface TransactionItem {
  id: string;
  qty: number;
  price?: number;
  total?: number;
  [key: string]: any;
}

export interface Transaction {
  date?: string;
  invoiceDate?: string;
  transactionDate?: string;
  items: TransactionItem[];
  [key: string]: any;
}

export interface StoreTransfer {
  fromStore: string;
  toStore: string;
  items: TransactionItem[];
  [key: string]: any;
}

export interface InventoryValuationResult {
  item: InventoryItem;
  balance: number;
  cost: number;
  value: number;
}

export interface InventoryValuationOptions {
  items: InventoryItem[];
  aggregatedOpeningBalances: Record<string, number>;
  purchaseInvoices: Transaction[];
  salesInvoices: Transaction[];
  purchaseReturns: Transaction[];
  salesReturns: Transaction[];
  storeReceiptVouchers: Transaction[];
  storeIssueVouchers: Transaction[];
  storeTransferVouchers: StoreTransfer[];
  stores: Array<{ name: string; branchId?: string; [key: string]: any }>;
  endDate: string;
  valuationMethod: ValuationMethod;
  normalizeDate: (date: any) => string;
  toNumber: (value: any) => number;
  getLastPurchasePriceBeforeDate: (itemCode: string, referenceDate: string) => number | null;
  calculateWeightedAverageCost: (item: InventoryItem, referenceDate: string) => number | null;
}

/**
 * Calculate company-wide inventory valuation
 * 
 * This is the canonical inventory calculation used by:
 * - Balance Sheet (displayData.inventory)
 * - Income Statement (calculatedEndingInventory / "رصيد مخزون آخر المدة")
 * - Inventory Valuation Report (when "all branches" is selected)
 * 
 * @param options - Configuration object containing all required data and helper functions
 * @returns Array of inventory valuation results per item, plus total value
 */
export function calculateCompanyInventoryValuation(
  options: InventoryValuationOptions
): { results: InventoryValuationResult[]; totalValue: number } {
  const {
    items,
    aggregatedOpeningBalances,
    purchaseInvoices,
    salesInvoices,
    purchaseReturns,
    salesReturns,
    storeReceiptVouchers,
    storeIssueVouchers,
    storeTransferVouchers,
    stores,
    endDate,
    valuationMethod,
    normalizeDate,
    toNumber,
    getLastPurchasePriceBeforeDate,
    calculateWeightedAverageCost,
  } = options;

  const normalizedEndDate = normalizeDate(endDate);
  if (!normalizedEndDate || items.length === 0) {
    return { results: [], totalValue: 0 };
  }

  // Filter transactions up to and including endDate
  const filterByDate = (tx: Transaction) => {
    if (!normalizedEndDate) return false;
    const txDate =
      normalizeDate(tx.date) ||
      normalizeDate(tx.invoiceDate) ||
      normalizeDate(tx.transactionDate);
    if (!txDate) return false;
    return txDate <= normalizedEndDate;
  };

  const valuationData: InventoryValuationResult[] = items.map((item) => {
    // Use aggregated opening balance from ALL stores/branches for this item
    // This ensures company-wide inventory calculation includes all branches
    const itemCode = item.code;
    let balance = aggregatedOpeningBalances[itemCode] || 0;

    // Calculate balance across all branches (no branch filtering)
    // All purchase invoices from all branches are included
    purchaseInvoices.filter(filterByDate).forEach((inv) =>
      inv.items.forEach((i) => {
        if (i.id === item.code) balance += toNumber(i.qty);
      }),
    );
    salesReturns.filter(filterByDate).forEach((inv) =>
      inv.items.forEach((i) => {
        if (i.id === item.code) balance += toNumber(i.qty);
      }),
    );
    storeReceiptVouchers.filter(filterByDate).forEach((v) =>
      v.items.forEach((i) => {
        if (i.id === item.code) balance += toNumber(i.qty);
      }),
    );

    // Subtract sales invoices from all branches (no branch filtering)
    salesInvoices.filter(filterByDate).forEach((inv) =>
      inv.items.forEach((i) => {
        if (i.id === item.code) balance -= toNumber(i.qty);
      }),
    );
    // Subtract purchase returns from all branches (no branch filtering)
    purchaseReturns.filter(filterByDate).forEach((inv) =>
      inv.items.forEach((i) => {
        if (i.id === item.code) balance -= toNumber(i.qty);
      }),
    );
    // Subtract store issue vouchers from all branches (no branch filtering)
    storeIssueVouchers.filter(filterByDate).forEach((v) =>
      v.items.forEach((i) => {
        if (i.id === item.code) balance -= toNumber(i.qty);
      }),
    );

    // Handle store transfers (all branches)
    // For company-wide calculation, transfers between stores don't affect total balance
    // since they're internal transfers that cancel out
    storeTransferVouchers.filter(filterByDate).forEach((v) => {
      const fromStore = stores.find((s) => s.name === v.fromStore);
      const toStore = stores.find((s) => s.name === v.toStore);
      v.items.forEach((i) => {
        if (i.id === item.code) {
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
        const lastPurchasePrice = getLastPurchasePriceBeforeDate(
          item.code,
          priceReferenceDate,
        );
        cost = lastPurchasePrice ?? fallbackPrice;
      } else {
        cost = avgCost;
      }
    } else if (valuationMethod === "purchasePrice") {
      const lastPurchasePrice = getLastPurchasePriceBeforeDate(
        item.code,
        priceReferenceDate,
      );
      cost = lastPurchasePrice ?? fallbackPrice;
    } else {
      // For salePrice or any other method, use fallback
      cost = fallbackPrice;
    }

    const value = balance * cost;

    return {
      item,
      balance,
      cost,
      value,
    };
  });

  // Calculate total inventory value
  const totalValue = valuationData.reduce((acc, item) => acc + item.value, 0);

  return {
    results: valuationData,
    totalValue,
  };
}

