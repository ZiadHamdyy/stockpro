import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { LockIcon, EyeIcon, CheckIcon, XIcon } from '../../icons';
import PermissionWrapper from '../../common/PermissionWrapper';
import { Actions, Resources, buildPermission } from '../../../enums/permissions.enum';
import {
  useGetFiscalYearsQuery,
  useCreateFiscalYearMutation,
  useCloseFiscalYearMutation,
  useReopenFiscalYearMutation,
  type FiscalYear,
} from '../../store/slices/fiscalYear/fiscalYearApiSlice';
import { formatNumber } from '../../../utils/formatting';
import { useGetIncomeStatementQuery } from '../../store/slices/incomeStatement/incomeStatementApiSlice';
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseReturnsQuery } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetStoreReceiptVouchersQuery } from '../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi';
import { useGetStoreIssueVouchersQuery } from '../../store/slices/storeIssueVoucher/storeIssueVoucherApi';
import { useGetStoreTransferVouchersQuery } from '../../store/slices/storeTransferVoucher/storeTransferVoucherApi';
import { useGetStoresQuery, useGetAllStoreItemsQuery } from '../../store/slices/store/storeApi';
import { useGetReceiptVouchersQuery } from '../../store/slices/receiptVoucherApiSlice';
import { useGetPaymentVouchersQuery } from '../../store/slices/paymentVoucherApiSlice';
import { useGetFinancialSettingsQuery } from '../../store/slices/financialSettings/financialSettingsApi';
import { ValuationMethod } from '../settings/financial-system/types';

interface FiscalYearsProps {
    title?: string;
}

// Component to calculate and display retained earnings for a single fiscal year
const FiscalYearRow: React.FC<{
    year: FiscalYear;
    onToggleStatus: (year: FiscalYear) => void;
    isClosing: boolean;
    isReopening: boolean;
}> = ({ year, onToggleStatus, isClosing, isReopening }) => {
    const startDate = year.startDate.split('T')[0];
    const endDate = year.endDate.split('T')[0];
    
    // Fetch income statement data for this fiscal year
    const { data: incomeStatementData } = useGetIncomeStatementQuery(
        { startDate, endDate },
        { skip: !startDate || !endDate }
    );

    // Fetch data for inventory and other revenues calculation
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
    const { data: apiPaymentVouchers = [] } = useGetPaymentVouchersQuery(undefined);
    const { data: fiscalYears = [] } = useGetFiscalYearsQuery();
    
    // Get inventory valuation method from financial settings (same as BalanceSheet)
    const { data: financialSettings } = useGetFinancialSettingsQuery();
    
    // Fetch all StoreItems across all stores to aggregate opening balances company-wide
    const { data: allStoreItems = [] } = useGetAllStoreItemsQuery();
    
    // Map inventory valuation method to valuation method string (same as BalanceSheet lines 85-100)
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

    // Helper to normalize date
    const normalizeDate = useCallback((date: any): string => {
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
    }, []);

    const toNumber = useCallback((value: any): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }, []);

    // Aggregate opening balances from all StoreItems across all stores/branches (same as BalanceSheet lines 190-201)
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

    // Transform purchase invoices to match expected format
    const transformedPurchaseInvoices = useMemo(() => {
        return (apiPurchaseInvoices as any[]).map((invoice) => ({
            ...invoice,
            items: invoice.items.map((item) => ({
                id: item.id,
                qty: item.qty,
                price: item.price,
                total: item.total,
            })),
        }));
    }, [apiPurchaseInvoices]);

    // Helper function to get last purchase price before or on a reference date (same as BalanceSheet lines 369-396)
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

    // Helper function to calculate weighted average cost up to a reference date (same as BalanceSheet lines 398-434)
    const calculateWeightedAverageCost = useCallback((item: any, referenceDate: string): number | null => {
        const normalizedReferenceDate = normalizeDate(referenceDate);
        if (!normalizedReferenceDate) return null;

        const itemCode = item.code;
        const openingBalance = toNumber((item as any).openingBalance ?? 0);
        const initialPurchasePrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);

        // Get all purchase invoices up to the reference date
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

    // Transform store vouchers to match expected format
    const transformedStoreReceiptVouchers = useMemo(() => {
        return (storeReceiptVouchers as any[]).map((voucher) => ({
            ...voucher,
            items: voucher.items.map((item) => ({
                id: item.item?.code || item.itemId,
                qty: item.quantity,
            })),
        }));
    }, [storeReceiptVouchers]);

    const transformedStoreIssueVouchers = useMemo(() => {
        return (storeIssueVouchers as any[]).map((voucher) => ({
            ...voucher,
            items: voucher.items.map((item) => ({
                id: item.item?.code || item.itemId,
                qty: item.quantity,
            })),
        }));
    }, [storeIssueVouchers]);

    const transformedStoreTransferVouchers = useMemo(() => {
        return (storeTransferVouchers as any[])
            .filter((v) => v.status === 'ACCEPTED')
            .map((voucher) => ({
                ...voucher,
                items: voucher.items.map((item) => ({
                    id: item.item?.code || item.itemId,
                    qty: item.quantity,
                })),
            }));
    }, [storeTransferVouchers]);

    // Transform sales invoices and returns to match expected format
    const transformedSalesInvoices = useMemo(() => {
        return (apiSalesInvoices as any[]).map((invoice) => ({
            ...invoice,
            items: invoice.items.map((item) => ({
                id: item.id,
                qty: item.qty,
            })),
        }));
    }, [apiSalesInvoices]);

    const transformedSalesReturns = useMemo(() => {
        return (apiSalesReturns as any[]).map((invoice) => ({
            ...invoice,
            items: invoice.items.map((item) => ({
                id: item.id,
                qty: item.qty,
            })),
        }));
    }, [apiSalesReturns]);

    const transformedPurchaseReturns = useMemo(() => {
        return (apiPurchaseReturns as any[]).map((invoice) => ({
            ...invoice,
            items: invoice.items.map((item) => ({
                id: item.id,
                qty: item.qty,
            })),
        }));
    }, [apiPurchaseReturns]);

    // Transform items to match expected format (same as BalanceSheet lines 205-216)
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

    /**
     * Calculate ending inventory - COMPANY-WIDE calculation (same as BalanceSheet lines 447-574)
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

        // Use the tracked valuation method (will update when financial settings change)
        const valuationMethod = inventoryValuationMethod;

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

        // Calculate total inventory value (same as BalanceSheet line 555)
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
        inventoryValuationMethod,
        aggregatedOpeningBalances,
    ]);

    // Calculate other revenues (same as IncomeStatement)
    const calculatedOtherRevenues = useMemo(() => {
        const normalizedStartDate = normalizeDate(startDate);
        const normalizedEndDate = normalizeDate(endDate);
        
        if (!normalizedStartDate || !normalizedEndDate) return 0;

        return (apiReceiptVouchers as any[])
            .filter((voucher) => {
                if (voucher.entityType !== 'revenue') return false;
                const voucherDate = normalizeDate(voucher.date);
                if (!voucherDate) return false;
                return voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
            })
            .reduce((sum, voucher) => sum + (voucher.amount || 0), 0);
    }, [apiReceiptVouchers, startDate, endDate, normalizeDate]);

    // Calculate net purchases (same as IncomeStatement)
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

    // Calculate allowed discount (same as IncomeStatement)
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

    // Calculate net sales after discount exactly as in BalanceSheet
    const netSalesAfterDiscount = useMemo(() => {
        if (!incomeStatementData) return 0;
        return incomeStatementData.netSales - allowedDiscount;
    }, [incomeStatementData, allowedDiscount]);

    // Calculate net profit using the same formula as IncomeStatement (exact match)
    const calculatedNetProfit = useMemo(() => {
        if (!incomeStatementData) return null;
        
        return netSalesAfterDiscount - 
               (incomeStatementData.beginningInventory + calculatedNetPurchases - calculatedInventoryValue) + 
               calculatedOtherRevenues - 
               incomeStatementData.totalExpenses;
    }, [incomeStatementData, calculatedInventoryValue, calculatedOtherRevenues, calculatedNetPurchases, netSalesAfterDiscount]);

    // Calculate retained earnings with fiscal year logic (same as BalanceSheet.tsx)
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
        const currentPeriodNetProfit = calculatedNetProfit || 0;

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

    const calculatedValue = calculatedRetainedEarnings;

    return (
        <div className={`border-2 rounded-lg p-4 flex justify-between items-center ${year.status === 'OPEN' ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <div>
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-brand-dark">{year.name}</h3>
                    {year.status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800 font-bold flex items-center gap-1">
                            <EyeIcon className="w-3 h-3"/> مفتوحة
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-800 font-bold flex items-center gap-1">
                            <LockIcon className="w-3 h-3"/> مغلقة
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    من: <span className="font-mono font-bold">{startDate}</span> إلى: <span className="font-mono font-bold">{endDate}</span>
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-center px-4 border-l border-gray-300 hidden md:block">
                    <p className="text-xs text-gray-500">الأرباح (الخسائر) المبقاة</p>
                    <p className={`font-bold text-lg ${calculatedValue !== null && calculatedValue !== undefined ? (calculatedValue >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {calculatedValue !== null && calculatedValue !== undefined ? formatNumber(calculatedValue) : '---'}
                    </p>
                </div>
                <PermissionWrapper
                    requiredPermission={buildPermission(
                        Resources.FISCAL_YEARS,
                        Actions.UPDATE
                    )}
                    fallback={
                        <button
                            disabled
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 cursor-not-allowed opacity-50 ${
                                year.status === 'OPEN'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                            }`}
                        >
                            {year.status === 'OPEN' ? (
                                <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                            ) : (
                                <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                            )}
                        </button>
                    }
                >
                    <button 
                        onClick={() => onToggleStatus(year)}
                        disabled={
                            isClosing || 
                            isReopening || 
                            (year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear())
                        }
                        title={
                            year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear()
                                ? "لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية"
                                : undefined
                        }
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            year.status === 'OPEN' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {year.status === 'OPEN' ? (
                            <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                        ) : (
                            <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                        )}
                    </button>
                </PermissionWrapper>
            </div>
        </div>
    );
};

const FiscalYears: React.FC<FiscalYearsProps> = ({ title }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYear, setNewYear] = useState<Partial<FiscalYear>>({
        name: new Date().getFullYear().toString(),
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: `${new Date().getFullYear()}-12-31`,
    });
    const { showToast } = useToast();
    const { showModal } = useModal();

    const { data: fiscalYears = [], isLoading } = useGetFiscalYearsQuery();
    const [createFiscalYear, { isLoading: isCreating }] = useCreateFiscalYearMutation();
    const [closeFiscalYear, { isLoading: isClosing }] = useCloseFiscalYearMutation();
    const [reopenFiscalYear, { isLoading: isReopening }] = useReopenFiscalYearMutation();

    const sortedFiscalYears = useMemo(() => 
        [...fiscalYears].sort((a, b) => b.name.localeCompare(a.name)),
        [fiscalYears]
    );

    const handleAddYear = async () => {
        if (!newYear.name || !newYear.startDate || !newYear.endDate) {
            showToast("الرجاء تعبئة جميع البيانات", "error");
            return;
        }
        
        // Validate date range
        const startDate = new Date(newYear.startDate!);
        startDate.setHours(0, 0, 0, 0); // Normalize to local midnight
        const endDate = new Date(newYear.endDate!);
        
        if (startDate >= endDate) {
            showToast("يجب أن يكون تاريخ البداية قبل تاريخ النهاية", "error");
            return;
        }
        
        // Validate that dates are not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate > today) {
            showToast("لا يمكن فتح فترة محاسبية لتاريخ مستقبلي", "error");
            return;
        }
        
        // Validate that the fiscal year is not for a future year
        const startDateYear = startDate.getFullYear();
        const currentYear = new Date().getFullYear();
        if (startDateYear > currentYear) {
            showToast("لا يمكن فتح فترة محاسبية لسنة مستقبلية", "error");
            return;
        }
        
        try {
            await createFiscalYear({
                name: newYear.name,
                startDate: newYear.startDate!,
                endDate: newYear.endDate!,
            }).unwrap();
            setIsModalOpen(false);
            setNewYear({
                name: new Date().getFullYear().toString(),
                startDate: `${new Date().getFullYear()}-01-01`,
                endDate: `${new Date().getFullYear()}-12-31`,
            });
            showToast("تم إضافة السنة المالية بنجاح", "success");
        } catch (error: any) {
            showToast(
                error?.data?.message || "حدث خطأ أثناء إضافة السنة المالية",
                "error"
            );
        }
    };

    const confirmToggleStatus = (year: FiscalYear) => {
        if (year.status === 'CLOSED') {
            // Validate that the fiscal year is not for a future year
            const startDateYear = new Date(year.startDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (startDateYear > currentYear) {
                showToast("لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية", "error");
                return;
            }
            
            showModal({
                title: 'إعادة فتح السنة المالية',
                message: `هل أنت متأكد من إعادة فتح السنة المالية ${year.name}؟ هذا سيسمح بإنشاء وتعديل المستندات المالية في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await reopenFiscalYear(year.id).unwrap();
                        showToast(`تم فتح السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إعادة فتح السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'edit',
            });
        } else {
            showModal({
                title: 'إغلاق السنة المالية',
                message: `هل أنت متأكد من إغلاق السنة المالية ${year.name}؟ سيمنع هذا إنشاء أي مستندات مالية (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await closeFiscalYear(year.id).unwrap();
                        showToast(`تم إغلاق السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إغلاق السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'delete',
            });
        }
    };

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

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
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-brand-dark">{title ?? "الفترات المحاسبية"}</h1>
                <PermissionWrapper
                    requiredPermission={buildPermission(
                        Resources.FISCAL_YEARS,
                        Actions.CREATE
                    )}
                >
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
                        disabled={isCreating}
                    >
                        {isCreating ? "جاري الإضافة..." : "سنة مالية جديدة"}
                    </button>
                </PermissionWrapper>
            </div>

            {/* Information Banner */}
            <div className="mb-6 p-4 bg-blue-50 border-r-4 border-brand-blue rounded-md">
                <p className="text-sm text-gray-700">
                    <strong className="text-brand-dark">ملاحظة مهمة:</strong> يجب فتح فترة محاسبية أولاً قبل إنشاء أي مستند مالي. 
                    لا يمكن إنشاء المستندات (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) 
                    إلا في الفترات المفتوحة. عند إغلاق الفترة، لن يتم السماح بإنشاء أي مستندات في هذه الفترة.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedFiscalYears.map(year => (
                    <FiscalYearRow
                        key={year.id}
                        year={year}
                        onToggleStatus={confirmToggleStatus}
                        isClosing={isClosing}
                        isReopening={isReopening}
                    />
                ))}
            </div>

            {/* Add New Year Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-brand-dark">إضافة سنة مالية</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">السنة</label>
                                <input type="text" value={newYear.name} onChange={(e) => setNewYear({...newYear, name: e.target.value})} className={inputStyle} placeholder="2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">من تاريخ</label>
                                    <input type="date" value={newYear.startDate} onChange={(e) => setNewYear({...newYear, startDate: e.target.value})} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                                    <input type="date" value={newYear.endDate} onChange={(e) => setNewYear({...newYear, endDate: e.target.value})} className={inputStyle} />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
                            <button onClick={handleAddYear} disabled={isCreating} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isCreating ? "جاري الحفظ..." : "حفظ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalYears;
