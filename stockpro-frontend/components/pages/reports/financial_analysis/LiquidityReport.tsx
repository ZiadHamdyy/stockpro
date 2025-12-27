
import React, { useMemo, useCallback } from 'react';
import type { Safe, Bank, Customer, Supplier, Item, Invoice, Voucher } from '../../../../types';
import { PrintIcon, ShieldIcon, ActivityIcon, TrendingUpIcon, AlertTriangleIcon } from '../../../icons';
import PermissionWrapper from '../../../common/PermissionWrapper';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';
import {
    Actions,
    Resources,
    buildPermission,
} from '../../../../enums/permissions.enum';
import { useGetSafesQuery } from '../../../store/slices/safe/safeApiSlice';
import { useGetBanksQuery } from '../../../store/slices/bank/bankApiSlice';
import { useGetCustomersQuery } from '../../../store/slices/customer/customerApiSlice';
import { useGetSuppliersQuery } from '../../../store/slices/supplier/supplierApiSlice';
import { useGetItemsQuery } from '../../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseReturnsQuery } from '../../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetReceiptVouchersQuery } from '../../../store/slices/receiptVoucherApiSlice';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';
import { useGetBalanceSheetQuery } from '../../../store/slices/balanceSheet/balanceSheetApiSlice';
import { useGetInternalTransfersQuery } from '../../../store/slices/internalTransferApiSlice';
import { useGetBranchesQuery } from '../../../store/slices/branch/branchApi';
import { useGetStoresQuery } from '../../../store/slices/store/storeApi';
import { useGetStoreReceiptVouchersQuery } from '../../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi';
import { useGetStoreIssueVouchersQuery } from '../../../store/slices/storeIssueVoucher/storeIssueVoucherApi';
import { useGetStoreTransferVouchersQuery } from '../../../store/slices/storeTransferVoucher/storeTransferVoucherApi';

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

interface LiquidityReportProps {
    title: string;
}

const LiquidityReport: React.FC<LiquidityReportProps> = ({ title }) => {
    const currentYear = new Date().getFullYear();
    const defaultStartDate = `${currentYear}-01-01`;
    const defaultEndDate = `${currentYear}-12-31`;

    // Fetch data from Redux
    const { data: apiSafes = [], isLoading: safesLoading } = useGetSafesQuery();
    const { data: apiBanks = [], isLoading: banksLoading } = useGetBanksQuery();
    const { data: apiCustomers = [], isLoading: customersLoading } = useGetCustomersQuery();
    const { data: apiSuppliers = [], isLoading: suppliersLoading } = useGetSuppliersQuery();
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiPurchaseInvoices = [], isLoading: purchasesLoading } = useGetPurchaseInvoicesQuery();
    const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } = useGetSalesReturnsQuery();
    const { data: apiPurchaseReturns = [], isLoading: purchaseReturnsLoading } = useGetPurchaseReturnsQuery();
    const { data: apiReceiptVouchers = [], isLoading: receiptsLoading } = useGetReceiptVouchersQuery();
    const { data: apiPaymentVouchers = [], isLoading: paymentsLoading } = useGetPaymentVouchersQuery();
    const { data: apiInternalTransfers = [] } = useGetInternalTransfersQuery();
    const { data: balanceSheetData, isLoading: balanceSheetLoading } = useGetBalanceSheetQuery({ startDate: defaultStartDate, endDate: defaultEndDate });
    const { data: branches = [] } = useGetBranchesQuery(undefined);
    const { data: stores = [] } = useGetStoresQuery(undefined);
    const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
    const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
    const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);

    const isLoading = safesLoading || banksLoading || customersLoading || suppliersLoading || itemsLoading || salesLoading || purchasesLoading || salesReturnsLoading || purchaseReturnsLoading || receiptsLoading || paymentsLoading || balanceSheetLoading;

    // Transform API data to match component expectations
    const safes = useMemo<Safe[]>(() => {
        return apiSafes.map((safe) => ({
            id: safe.id,
            code: safe.code,
            name: safe.name,
            branchId: safe.branchId || '',
            branchName: safe.branchName || '',
            openingBalance: safe.openingBalance || 0,
            currentBalance: safe.currentBalance || 0,
            createdAt: safe.createdAt || '',
            updatedAt: safe.updatedAt || ''
        }));
    }, [apiSafes]);

    const banks = useMemo<Bank[]>(() => {
        return apiBanks.map((bank) => ({
            id: bank.id,
            code: bank.code,
            name: bank.name,
            accountNumber: bank.accountNumber || '',
            iban: bank.iban || '',
            openingBalance: bank.openingBalance || 0
        }));
    }, [apiBanks]);

    const customers = useMemo<Customer[]>(() => {
        return apiCustomers.map((customer) => ({
            id: customer.id,
            code: customer.code,
            name: customer.name,
            commercialReg: customer.commercialReg || '',
            taxNumber: customer.taxNumber || '',
            nationalAddress: customer.nationalAddress || '',
            phone: customer.phone || '',
            openingBalance: customer.openingBalance || 0,
            currentBalance: customer.currentBalance || 0
        }));
    }, [apiCustomers]);

    const suppliers = useMemo<Supplier[]>(() => {
        return apiSuppliers.map((supplier) => ({
            id: supplier.id,
            code: supplier.code,
            name: supplier.name,
            commercialReg: supplier.commercialReg || '',
            taxNumber: supplier.taxNumber || '',
            nationalAddress: supplier.nationalAddress || '',
            phone: supplier.phone || '',
            openingBalance: supplier.openingBalance || 0,
            currentBalance: supplier.currentBalance || 0
        }));
    }, [apiSuppliers]);

    const items = useMemo<Item[]>(() => {
        return apiItems.map((item) => ({
            id: parseInt(item.id) || 0,
            code: item.code,
            name: item.name,
            group: item.group?.name || '',
            unit: item.unit?.name || '',
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
            stock: item.stock,
            reorderLimit: item.reorderLimit
        }));
    }, [apiItems]);

    const salesInvoices = useMemo<Invoice[]>(() => {
        return apiSalesInvoices.map((inv) => ({
            id: inv.id,
            date: inv.date,
            customerOrSupplier: inv.customer ? {
                id: inv.customer.id,
                name: inv.customer.name
            } : null,
            items: inv.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price: item.price,
                taxAmount: item.taxAmount ?? 0,
                total: item.total ?? (item.qty * item.price)
            })),
            totals: {
                subtotal: inv.subtotal,
                discount: inv.discount,
                tax: inv.tax,
                net: inv.net
            },
            paymentMethod: inv.paymentMethod,
            paymentTargetType: inv.paymentTargetType,
            paymentTargetId: inv.paymentTargetId ? parseInt(inv.paymentTargetId) : null,
            userName: inv.user?.name || '',
            branchName: inv.branch?.name || ''
        }));
    }, [apiSalesInvoices]);

    const purchaseInvoices = useMemo<Invoice[]>(() => {
        return apiPurchaseInvoices.map((inv) => ({
            id: inv.id,
            date: inv.date,
            customerOrSupplier: inv.supplier ? {
                id: inv.supplier.id,
                name: inv.supplier.name
            } : null,
            items: inv.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price: item.price,
                taxAmount: item.taxAmount ?? 0,
                total: item.total ?? (item.qty * item.price)
            })),
            totals: {
                subtotal: inv.subtotal,
                discount: inv.discount,
                tax: inv.tax,
                net: inv.net
            },
            paymentMethod: inv.paymentMethod,
            paymentTargetType: inv.paymentTargetType,
            paymentTargetId: inv.paymentTargetId ? parseInt(inv.paymentTargetId) : null,
            userName: inv.user?.name || '',
            branchName: inv.branch?.name || ''
        }));
    }, [apiPurchaseInvoices]);

    const receiptVouchers = useMemo<Voucher[]>(() => {
        return apiReceiptVouchers.map((v) => ({
            id: v.id,
            type: 'receipt' as const,
            date: v.date,
            entity: {
                type: v.entityType as any,
                id: v.customerId || v.supplierId || v.currentAccountId || null,
                name: v.entityName
            },
            amount: v.amount,
            description: v.description || '',
            paymentMethod: v.paymentMethod as 'safe' | 'bank',
            safeOrBankId: v.safeId || v.bankId ? parseInt(v.safeId || v.bankId || '0') : null,
            userName: '',
            branchName: v.branch?.name || ''
        }));
    }, [apiReceiptVouchers]);

    const paymentVouchers = useMemo<Voucher[]>(() => {
        return apiPaymentVouchers.map((v) => ({
            id: v.id,
            type: 'payment' as const,
            date: v.date,
            entity: {
                type: v.entityType as any,
                id: v.customerId || v.supplierId || v.currentAccountId || v.expenseCodeId || null,
                name: v.entityName
            },
            amount: v.amount,
            description: v.description || '',
            paymentMethod: v.paymentMethod as 'safe' | 'bank',
            safeOrBankId: v.safeId || v.bankId ? parseInt(v.safeId || v.bankId || '0') : null,
            userName: '',
            branchName: v.branch?.name || ''
        }));
    }, [apiPaymentVouchers]);

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

    // Transform items to filter out services and include necessary fields
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

    // Calculate inventory value using the same logic as BalanceSheet (for all branches)
    const calculatedInventoryValue = useMemo(() => {
        const normalizedEndDate = normalizeDate(defaultEndDate);
        if (!normalizedEndDate || transformedItems.length === 0) return 0;

        const valuationMethod = "purchasePrice"; // Use purchase price valuation method

        const valuationData = transformedItems.map((item) => {
            // Use StoreItem's openingBalance as base, or 0 if not available
            let balance = toNumber((item as any).openingBalance ?? 0);

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

            // Calculate balance across all branches
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

            transformedSalesInvoices.filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance -= toNumber(i.qty);
                }),
            );
            transformedPurchaseReturns.filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance -= toNumber(i.qty);
                }),
            );
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
            const priceReferenceDate = defaultEndDate;
            const fallbackPrice =
                toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);
            
            if (valuationMethod === "purchasePrice") {
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
        transformedItems,
        defaultEndDate,
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
    ]);

    const analysis = useMemo(() => {
        const normalizedStartDate = normalizeDate(defaultStartDate);
        const normalizedEndDate = normalizeDate(defaultEndDate);

        const filterByDate = (record: any) => {
            const recordDate = normalizeDate(record?.date);
            return recordDate >= normalizedStartDate && recordDate <= normalizedEndDate;
        };

        // VAT position (same logic as BalanceSheet/VAT statement)
        // Calculate opening VAT position (transactions before start date)
        let vatDebitBefore = 0;
        let vatCreditBefore = 0;

        const filterBeforeStartDate = (record: any) => {
            const recordDate = normalizeDate(record?.date);
            return recordDate < normalizedStartDate;
        };

        // Opening VAT Debit (VAT collected before start date)
        (apiSalesInvoices as any[]).filter(filterBeforeStartDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebitBefore += tax;
        });

        (apiPurchaseReturns as any[]).filter(filterBeforeStartDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebitBefore += tax;
        });

        (apiReceiptVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterBeforeStartDate).forEach((v) => {
            vatDebitBefore += v.amount ?? 0;
        });

        // Opening VAT Credit (VAT paid before start date)
        (apiPurchaseInvoices as any[]).filter(filterBeforeStartDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCreditBefore += tax;
        });

        (apiSalesReturns as any[]).filter(filterBeforeStartDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCreditBefore += tax;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "expense-Type" && v.taxPrice && v.taxPrice > 0).filter(filterBeforeStartDate).forEach((v) => {
            vatCreditBefore += v.taxPrice ?? 0;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterBeforeStartDate).forEach((v) => {
            vatCreditBefore += v.amount ?? 0;
        });

        // Calculate period VAT (transactions within date range)
        let vatDebitPeriod = 0;
        let vatCreditPeriod = 0;

        (apiSalesInvoices as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebitPeriod += tax;
        });

        (apiPurchaseReturns as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebitPeriod += tax;
        });

        (apiPurchaseInvoices as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCreditPeriod += tax;
        });

        (apiSalesReturns as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCreditPeriod += tax;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "expense-Type" && v.taxPrice && v.taxPrice > 0).filter(filterByDate).forEach((v) => {
            vatCreditPeriod += v.taxPrice ?? 0;
        });

        (apiReceiptVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterByDate).forEach((v) => {
            vatDebitPeriod += v.amount ?? 0;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterByDate).forEach((v) => {
            vatCreditPeriod += v.amount ?? 0;
        });

        // Total VAT = Opening VAT + Period VAT
        const totalVatDebit = vatDebitBefore + vatDebitPeriod;
        const totalVatCredit = vatCreditBefore + vatCreditPeriod;
        const vatNet = totalVatCredit - totalVatDebit;
        const vatAsset = vatNet > 0 ? vatNet : 0;
        const vatLiabilityFromNet = vatNet < 0 ? Math.abs(vatNet) : 0;

        // Calculate total cash for all safes using the same logic as SafeStatementReport
        const calculateSafeFinalBalance = (safe: Safe): number => {
            const safeId = safe.id?.toString() || "";
            const matchesSafeValue = (value: any) => value?.toString() === safeId;
            const branchId = safe.branchId?.toString() || "";
            const matchesBranchValue = (value: any) =>
                branchId && value?.toString() === branchId;
            const matchesSafeRecord = (record: any) => {
                if (!record) return false;
                // 1) Explicit link to this safe (legacy / direct safeId usage)
                if (matchesSafeValue(record.safeId)) return true;

                // 2) For invoices / returns we ONLY consider cash payments that target a safe.
                //    These records use branchId as the paymentTargetId when paymentTargetType === "safe".
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

            // Calculate opening balance (transactions before startDate)
            const receiptsBefore = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "safe" &&
                            matchesSafeValue(v.safeId) &&
                            vDate < normalizedStartDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const paymentsBefore = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "safe" &&
                            matchesSafeValue(v.safeId) &&
                            vDate < normalizedStartDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const salesInvoicesBefore = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
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
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

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

            const purchaseInvoicesBefore = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
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
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

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

            const salesReturnsBefore = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
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
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

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

            const purchaseReturnsBefore = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
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
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

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

            const outgoingBefore = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const tDate = normalizeDate(t.date);
                        return t.fromType === "safe" &&
                            matchesSafeValue(t.fromSafeId) &&
                            tDate < normalizedStartDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const incomingBefore = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const tDate = normalizeDate(t.date);
                        return t.toType === "safe" &&
                            matchesSafeValue(t.toSafeId) &&
                            tDate < normalizedStartDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const openingBalance = (safe.openingBalance ?? 0)
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

            // Calculate transactions in the period (between startDate and endDate)
            const receiptsInPeriod = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "safe" &&
                            matchesSafeValue(v.safeId) &&
                            vDate >= normalizedStartDate &&
                            vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const paymentsInPeriod = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "safe" &&
                            matchesSafeValue(v.safeId) &&
                            vDate >= normalizedStartDate &&
                            vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const salesInvoicesInPeriod = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "safe" &&
                            matchesSafeRecord(inv) &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitSalesInvoicesInPeriod = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            matchesSafeValue(inv.splitSafeId) &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

            const purchaseReturnsInPeriod = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "safe" &&
                            matchesSafeRecord(ret) &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitPurchaseReturnsInPeriod = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            matchesSafeValue(ret.splitSafeId) &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

            const incomingInPeriod = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const transferDate = normalizeDate(t.date);
                        return t.toType === "safe" &&
                            matchesSafeValue(t.toSafeId) &&
                            transferDate >= normalizedStartDate &&
                            transferDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const purchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "safe" &&
                            matchesSafeRecord(inv) &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitPurchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            matchesSafeValue(inv.splitSafeId) &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitCashAmount) || 0), 0);

            const salesReturnsInPeriod = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "safe" &&
                            matchesSafeRecord(ret) &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitSalesReturnsInPeriod = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            matchesSafeValue(ret.splitSafeId) &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitCashAmount) || 0), 0);

            const outgoingInPeriod = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const transferDate = normalizeDate(t.date);
                        return t.fromType === "safe" &&
                            matchesSafeValue(t.fromSafeId) &&
                            transferDate >= normalizedStartDate &&
                            transferDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            // Calculate final balance: opening balance + debits - credits
            const totalDebit = receiptsInPeriod +
                salesInvoicesInPeriod +
                splitSalesInvoicesInPeriod +
                purchaseReturnsInPeriod +
                splitPurchaseReturnsInPeriod +
                incomingInPeriod;

            const totalCredit = paymentsInPeriod +
                purchaseInvoicesInPeriod +
                splitPurchaseInvoicesInPeriod +
                salesReturnsInPeriod +
                splitSalesReturnsInPeriod +
                outgoingInPeriod;

            return openingBalance + totalDebit - totalCredit;
        };

        // Calculate total cash as sum of final balances for all safes
        const totalCash = safes.reduce((sum, safe) => sum + calculateSafeFinalBalance(safe), 0); 

        // Calculate total bank balance for all banks using the same logic as BankStatementReport
        const calculateBankFinalBalance = (bank: Bank): number => {
            const bankId = bank.id?.toString() || "";

            // Calculate opening balance (transactions before startDate)
            const receiptsBefore = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "bank" &&
                            v.bankId?.toString() === bankId &&
                            vDate < normalizedStartDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const paymentsBefore = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "bank" &&
                            v.bankId?.toString() === bankId &&
                            vDate < normalizedStartDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const salesInvoicesBefore = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "bank" &&
                            inv.paymentTargetId?.toString() === bankId &&
                            invDate < normalizedStartDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitSalesInvoicesBefore = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            inv.splitBankId?.toString() === bankId &&
                            invDate < normalizedStartDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

            const purchaseInvoicesBefore = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "bank" &&
                            inv.paymentTargetId?.toString() === bankId &&
                            invDate < normalizedStartDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitPurchaseInvoicesBefore = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            inv.splitBankId?.toString() === bankId &&
                            invDate < normalizedStartDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

            const salesReturnsBefore = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const retDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "bank" &&
                            ret.paymentTargetId?.toString() === bankId &&
                            retDate < normalizedStartDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitSalesReturnsBefore = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const retDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            ret.splitBankId?.toString() === bankId &&
                            retDate < normalizedStartDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

            const purchaseReturnsBefore = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const retDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "bank" &&
                            ret.paymentTargetId?.toString() === bankId &&
                            retDate < normalizedStartDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitPurchaseReturnsBefore = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const retDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            ret.splitBankId?.toString() === bankId &&
                            retDate < normalizedStartDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

            const outgoingBefore = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const tDate = normalizeDate(t.date);
                        return t.fromType === "bank" &&
                            t.fromBankId?.toString() === bankId &&
                            tDate < normalizedStartDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const incomingBefore = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const tDate = normalizeDate(t.date);
                        return t.toType === "bank" &&
                            t.toBankId?.toString() === bankId &&
                            tDate < normalizedStartDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const openingBalance = (bank.openingBalance ?? 0)
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

            // Calculate transactions in the period (between startDate and endDate)
            const receiptsInPeriod = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "bank" &&
                            v.bankId?.toString() === bankId &&
                            vDate >= normalizedStartDate &&
                            vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const paymentsInPeriod = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        return v.paymentMethod === "bank" &&
                            v.bankId?.toString() === bankId &&
                            vDate >= normalizedStartDate &&
                            vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);

            const salesInvoicesInPeriod = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "bank" &&
                            inv.paymentTargetId?.toString() === bankId &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitSalesInvoicesInPeriod = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            inv.splitBankId?.toString() === bankId &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

            const purchaseReturnsInPeriod = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "bank" &&
                            ret.paymentTargetId?.toString() === bankId &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitPurchaseReturnsInPeriod = (apiPurchaseReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            ret.splitBankId?.toString() === bankId &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

            const incomingInPeriod = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const transferDate = normalizeDate(t.date);
                        return t.toType === "bank" &&
                            t.toBankId?.toString() === bankId &&
                            transferDate >= normalizedStartDate &&
                            transferDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            const purchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            !inv.isSplitPayment &&
                            inv.paymentTargetType === "bank" &&
                            inv.paymentTargetId?.toString() === bankId &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + resolveRecordAmount(inv), 0);

            const splitPurchaseInvoicesInPeriod = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invoiceDate = normalizeDate(inv.date);
                        return inv.paymentMethod === "cash" &&
                            inv.isSplitPayment === true &&
                            inv.splitBankId?.toString() === bankId &&
                            invoiceDate >= normalizedStartDate &&
                            invoiceDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + (Number(inv.splitBankAmount) || 0), 0);

            const salesReturnsInPeriod = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            !ret.isSplitPayment &&
                            ret.paymentTargetType === "bank" &&
                            ret.paymentTargetId?.toString() === bankId &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + resolveRecordAmount(ret), 0);

            const splitSalesReturnsInPeriod = (apiSalesReturns as any[])
                .filter(
                    (ret) => {
                        const returnDate = normalizeDate(ret.date);
                        return ret.paymentMethod === "cash" &&
                            ret.isSplitPayment === true &&
                            ret.splitBankId?.toString() === bankId &&
                            returnDate >= normalizedStartDate &&
                            returnDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, ret) => sum + (Number(ret.splitBankAmount) || 0), 0);

            const outgoingInPeriod = (apiInternalTransfers as any[])
                .filter(
                    (t) => {
                        const transferDate = normalizeDate(t.date);
                        return t.fromType === "bank" &&
                            t.fromBankId?.toString() === bankId &&
                            transferDate >= normalizedStartDate &&
                            transferDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, t) => sum + (t.amount ?? 0), 0);

            // Calculate final balance: opening balance + debits - credits
            const totalDebit = receiptsInPeriod +
                salesInvoicesInPeriod +
                splitSalesInvoicesInPeriod +
                purchaseReturnsInPeriod +
                splitPurchaseReturnsInPeriod +
                incomingInPeriod;

            const totalCredit = paymentsInPeriod +
                purchaseInvoicesInPeriod +
                splitPurchaseInvoicesInPeriod +
                salesReturnsInPeriod +
                splitSalesReturnsInPeriod +
                outgoingInPeriod;

            return openingBalance + totalDebit - totalCredit;
        };

        // Calculate total bank as sum of final balances for all banks
        const totalBank = banks.reduce((sum, bank) => sum + calculateBankFinalBalance(bank), 0);

        const totalOtherReceivables = Math.abs(balanceSheetData?.otherReceivables ?? 0);

        // Calculate total receivables for all customers using the same logic as CustomerBalanceReport
        const calculateCustomerFinalBalance = (customer: Customer): number => {
            const customerIdStr = customer.id.toString();
            const customerId = customer.id;

            const toNumber = (value: any): number => {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : 0;
            };

            // Total Sales (all sales invoices up to endDate) - Debit (increases what customer owes)
            const totalSales = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invCustomerId = inv.customerOrSupplier?.id || 
                                             inv.customerId?.toString() || 
                                             (inv.customer?.id?.toString());
                        return (invCustomerId === customerIdStr || invCustomerId == customerId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Total Returns (all sales returns up to endDate) - Credit (decreases what customer owes)
            const totalReturns = (apiSalesReturns as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invCustomerId = inv.customerOrSupplier?.id || 
                                             inv.customerId?.toString() || 
                                             (inv.customer?.id?.toString());
                        return (invCustomerId === customerIdStr || invCustomerId == customerId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Cash sales returns are counted in both debit and credit (like cash invoices)
            const totalCashReturns = (apiSalesReturns as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invCustomerId = inv.customerOrSupplier?.id || 
                                             inv.customerId?.toString() || 
                                             (inv.customer?.id?.toString());
                        return inv.paymentMethod === "cash" &&
                               (invCustomerId === customerIdStr || invCustomerId == customerId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Cash invoices are already paid, so they should reduce receivables (credit)
            const totalCashInvoices = (apiSalesInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invCustomerId = inv.customerOrSupplier?.id || 
                                             inv.customerId?.toString() || 
                                             (inv.customer?.id?.toString());
                        return inv.paymentMethod === "cash" &&
                               (invCustomerId === customerIdStr || invCustomerId == customerId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Receipt vouchers from customer - Credit (decreases what customer owes)
            const totalReceipts = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        const voucherCustomerId = v.customerId?.toString() || 
                                                 v.entity?.id?.toString() || 
                                                 v.entity?.id;
                        return (v.entityType === "customer" || v.entity?.type === "customer") &&
                               (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
                               vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

            // Payment vouchers to customer (refunds) - Debit (increases what customer owes)
            const totalPayments = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        const voucherCustomerId = v.customerId?.toString() || 
                                                 v.entity?.id?.toString() || 
                                                 v.entity?.id;
                        return (v.entityType === "customer" || v.entity?.type === "customer") &&
                               (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
                               vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

            const opening = customer.openingBalance || 0;
            // Total Debit: all sales invoices, cash sales returns, payment vouchers (all increase what customer owes)
            const totalDebit = totalSales + totalCashReturns + totalPayments;
            // Total Credit: cash sales invoices, all sales returns, receipt vouchers (all decrease what customer owes)
            const totalCredit = totalCashInvoices + totalReturns + totalReceipts;
            // Balance = Beginning Balance + Total Debit - Total Credit
            const balance = opening + totalDebit - totalCredit;

            return balance;
        };

        // Calculate total receivables as sum of final balances for all customers
        const totalReceivables = customers.reduce((sum, customer) => sum + calculateCustomerFinalBalance(customer), 0);

        // Use calculated inventory value (already calculated outside this useMemo)
        const totalInventory = calculatedInventoryValue;

        const currentAssets = totalCash + totalBank + totalReceivables + totalOtherReceivables + totalInventory + vatAsset;
        const liquidAssets = totalCash + totalBank + totalReceivables + totalOtherReceivables + vatAsset;

        // 2. Current Liabilities (الالتزامات المتداولة)
        const totalOtherPayables = Math.abs(balanceSheetData?.otherPayables ?? 0);

        // Calculate total payables for all suppliers using the same logic as SupplierBalanceReport
        const calculateSupplierFinalBalance = (supplier: Supplier): number => {
            const supplierIdStr = supplier.id.toString();
            const supplierId = supplier.id;

            const toNumber = (value: any): number => {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : 0;
            };

            // Total Purchases (all purchase invoices up to endDate) - Credit (increases what we owe)
            const totalPurchases = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                             inv.supplierId?.toString() || 
                                             (inv.supplier?.id?.toString());
                        return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Cash purchase invoices are already paid, so they reduce what we owe (debit)
            const totalCashPurchases = (apiPurchaseInvoices as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                             inv.supplierId?.toString() || 
                                             (inv.supplier?.id?.toString());
                        return inv.paymentMethod === "cash" &&
                               (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Total Returns (all purchase returns up to endDate) - Debit (reduces what we owe)
            const totalReturns = (apiPurchaseReturns as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                             inv.supplierId?.toString() || 
                                             (inv.supplier?.id?.toString());
                        return (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Cash purchase returns are counted in both debit and credit (like cash purchases)
            const totalCashReturns = (apiPurchaseReturns as any[])
                .filter(
                    (inv) => {
                        const invDate = normalizeDate(inv.date);
                        const invSupplierId = inv.customerOrSupplier?.id?.toString() || 
                                             inv.supplierId?.toString() || 
                                             (inv.supplier?.id?.toString());
                        return inv.paymentMethod === "cash" &&
                               (invSupplierId === supplierIdStr || invSupplierId == supplierId) && 
                               invDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, inv) => sum + toNumber(inv.totals?.net || inv.net || 0), 0);

            // Payment vouchers to supplier - Debit (reduces what we owe)
            const totalPayments = (apiPaymentVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        const voucherSupplierId = v.supplierId?.toString() || 
                                                v.entity?.id?.toString() || 
                                                v.entity?.id;
                        return (v.entityType === "supplier" || v.entity?.type === "supplier") &&
                               (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                               vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

            // Receipt vouchers from supplier - Debit (reduces what we owe)
            const totalReceipts = (apiReceiptVouchers as any[])
                .filter(
                    (v) => {
                        const vDate = normalizeDate(v.date);
                        const voucherSupplierId = v.supplierId?.toString() || 
                                                v.entity?.id?.toString() || 
                                                v.entity?.id;
                        return (v.entityType === "supplier" || v.entity?.type === "supplier") &&
                               (voucherSupplierId === supplierIdStr || voucherSupplierId == supplierId) &&
                               vDate <= normalizedEndDate;
                    }
                )
                .reduce((sum, v) => sum + toNumber(v.amount || 0), 0);

            const opening = supplier.openingBalance || 0;
            // Total Debit: cash purchases, all purchase returns, payment vouchers, receipt vouchers (all decrease what we owe)
            const totalDebit = totalCashPurchases + totalReturns + totalPayments + totalReceipts;
            // Total Credit: all purchase invoices plus cash purchase returns (both increase what we owe)
            // Cash purchases are already counted in both debit and credit via totalCashPurchases
            const totalCredit = totalPurchases + totalCashReturns;
            // Balance = Beginning Balance + Total Debit - Total Credit
            const balance = opening + totalDebit - totalCredit;

            return balance;
        };

        // Calculate total payables as sum of final balances for all suppliers
        const calculatedPayables = suppliers.reduce((sum, supplier) => sum + calculateSupplierFinalBalance(supplier), 0) * -1;
        const totalPayables = calculatedPayables === 0 ? 0 : calculatedPayables;

        const vatLiability = vatLiabilityFromNet > 0 ? vatLiabilityFromNet : Math.max(balanceSheetData?.vatPayable ?? 0, 0);
        
        const currentLiabilities = totalPayables + totalOtherPayables + vatLiability;

        // 3. Ratios
        const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 999 : 0);
        const quickRatio = currentLiabilities > 0 ? ((currentAssets - totalInventory) / currentLiabilities) : ((currentAssets - totalInventory) > 0 ? 999 : 0);
        const cashRatio = currentLiabilities > 0 ? ((totalCash + totalBank) / currentLiabilities) : ((totalCash + totalBank) > 0 ? 999 : 0);

        // 4. Safety Status Assessment
        let safetyStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
        let safetyMessage = "";

        if (currentRatio >= 2.0) {
            safetyStatus = 'excellent';
            safetyMessage = "وضع مالي ممتاز (آمن جداً). الأصول تغطي الالتزامات بضعف القيمة.";
        } else if (currentRatio >= 1.5) {
            safetyStatus = 'good';
            safetyMessage = "وضع مالي جيد ومستقر.";
        } else if (currentRatio >= 1.0) {
            safetyStatus = 'warning';
            safetyMessage = "وضع حرج (مقبول). الأصول تكاد تغطي الالتزامات.";
        } else {
            safetyStatus = 'critical';
            safetyMessage = "وضع مالي خطر! الالتزامات تفوق الأصول المتداولة. يرجى الانتباه.";
        }

        return {
            totalCash, totalBank, totalReceivables, totalOtherReceivables, totalInventory, vatAsset, currentAssets,
            totalPayables, totalOtherPayables, vatLiability, currentLiabilities,
            currentRatio, quickRatio, cashRatio,
            safetyStatus, safetyMessage
        };
    }, [balanceSheetData, banks, customers, defaultEndDate, defaultStartDate, items, normalizeDate, paymentVouchers, purchaseInvoices, apiPurchaseReturns, receiptVouchers, safes, salesInvoices, apiSalesReturns, suppliers, apiInternalTransfers, apiSalesInvoices, apiPurchaseInvoices, apiReceiptVouchers, apiPaymentVouchers, calculatedInventoryValue]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'excellent': return 'bg-emerald-100 text-emerald-800 border-emerald-500';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-500';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
            case 'critical': return 'bg-red-100 text-red-800 border-red-500';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRatioStatus = (ratio: number) => {
        if (ratio > 2) return { label: 'ممتاز جدًا', classes: 'bg-emerald-100 text-emerald-800 border-emerald-500' };
        if (ratio >= 1.5) return { label: 'جيد جدًا', classes: 'bg-blue-100 text-blue-800 border-blue-500' };
        if (ratio >= 1.0) return { label: 'مقبول', classes: 'bg-yellow-100 text-yellow-800 border-yellow-500' };
        if (ratio >= 0.8) return { label: 'ضعيف', classes: 'bg-orange-100 text-orange-800 border-orange-500' };
        return { label: 'خطر شديد', classes: 'bg-red-100 text-red-800 border-red-500' };
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
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'brand-blue': '#1E40AF',
                                'brand-blue-bg': '#EFF6FF',
                                'brand-green': '#16a34a',
                                'brand-green-active': '#4ade80',
                                'brand-green-bg': '#ECFDF5',
                                'brand-dark': '#1F2937',
                                'brand-light-gray': '#F8FAFC',
                                'brand-text': '#111827',
                            },
                        },
                    },
                };
            </script>
        `);
        printWindow?.document.write(`
            <style>
                @page {
                    size: Legal landscape;
                    margin: 1cm;
                }
                body { font-family: "Cairo", sans-serif; direction: rtl; font-size: 14px; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                /* Make hidden md:block elements visible in print */
                .hidden.md\\:block { display: block !important; }
                @media print {
                    @page {
                        size: Legal landscape;
                        margin: 1cm;
                    }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                        font-size: 14px !important; 
                    }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    .hidden.md\\:block { display: block !important; }
                    
                    /* Grid layouts - preserve desktop view */
                    .grid { display: grid !important; }
                    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                    /* Force desktop grid layouts in print - override Tailwind responsive behavior */
                    [class*="md:grid-cols-3"] { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    [class*="lg:grid-cols-2"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    
                    /* Flex utilities */
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
                    .justify-end { justify-content: flex-end !important; }
                    .items-center { align-items: center !important; }
                    .items-start { align-items: flex-start !important; }
                    .gap-3 { gap: 0.75rem !important; }
                    .gap-6 { gap: 1.5rem !important; }
                    .gap-8 { gap: 2rem !important; }
                    
                    /* Spacing */
                    .p-2 { padding: 0.5rem !important; }
                    .p-4 { padding: 1rem !important; }
                    .p-6 { padding: 1.5rem !important; }
                    .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
                    .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                    .mb-1 { margin-bottom: 0.25rem !important; }
                    .mb-4 { margin-bottom: 1rem !important; }
                    .mt-1 { margin-top: 0.25rem !important; }
                    .mt-2 { margin-top: 0.5rem !important; }
                    .mt-4 { margin-top: 1rem !important; }
                    .mr-auto { margin-right: auto !important; }
                    
                    /* Text utilities */
                    .text-xs { font-size: 0.75rem !important; }
                    .text-sm { font-size: 0.875rem !important; }
                    .text-lg { font-size: 1.125rem !important; }
                    .text-2xl { font-size: 1.5rem !important; }
                    .text-3xl { font-size: 1.875rem !important; }
                    .text-4xl { font-size: 2.25rem !important; }
                    .font-bold { font-weight: 700 !important; }
                    .font-extrabold { font-weight: 800 !important; }
                    .font-black { font-weight: 900 !important; }
                    .font-medium { font-weight: 500 !important; }
                    .font-semibold { font-weight: 600 !important; }
                    .font-mono { font-family: ui-monospace, monospace !important; }
                    .text-center { text-align: center !important; }
                    .uppercase { text-transform: uppercase !important; }
                    .tracking-widest { letter-spacing: 0.1em !important; }
                    
                    /* Brand colors */
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-brand-dark { color: #1F2937 !important; }
                    
                    /* Emerald colors */
                    .bg-emerald-100 { background-color: #D1FAE5 !important; }
                    .text-emerald-800 { color: #065F46 !important; }
                    .border-emerald-500 { border-color: #10B981 !important; }
                    
                    /* Blue colors */
                    .bg-blue-50 { background-color: #EFF6FF !important; }
                    .bg-blue-100 { background-color: #DBEAFE !important; }
                    .bg-blue-500 { background-color: #3B82F6 !important; }
                    .text-blue-500 { color: #3B82F6 !important; }
                    .text-blue-700 { color: #1D4ED8 !important; }
                    .text-blue-800 { color: #1E40AF !important; }
                    .border-blue-100 { border-color: #DBEAFE !important; }
                    .border-blue-500 { border-color: #3B82F6 !important; }
                    
                    /* Purple colors */
                    .bg-purple-500 { background-color: #A855F7 !important; }
                    .text-purple-500 { color: #A855F7 !important; }
                    
                    /* Green colors */
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-green-500 { background-color: #10B981 !important; }
                    .text-green-500 { color: #10B981 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-green-700 { color: #047857 !important; }
                    .text-green-800 { color: #065F46 !important; }
                    .border-green-500 { border-color: #10B981 !important; }
                    
                    /* Red colors */
                    .bg-red-50 { background-color: #FEF2F2 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .bg-red-500 { background-color: #EF4444 !important; }
                    .text-red-600 { color: #DC2626 !important; }
                    .text-red-700 { color: #B91C1C !important; }
                    .text-red-800 { color: #991B1B !important; }
                    .border-red-100 { border-color: #FEE2E2 !important; }
                    .border-red-500 { border-color: #EF4444 !important; }
                    
                    /* Yellow colors */
                    .bg-yellow-100 { background-color: #FEF3C7 !important; }
                    .text-yellow-500 { color: #F59E0B !important; }
                    .text-yellow-800 { color: #92400E !important; }
                    .border-yellow-500 { border-color: #F59E0B !important; }
                    
                    /* Orange colors */
                    .bg-orange-100 { background-color: #FFEDD5 !important; }
                    .text-orange-500 { color: #F97316 !important; }
                    .text-orange-800 { color: #9A3412 !important; }
                    .border-orange-500 { border-color: #F97316 !important; }
                    
                    /* Gray colors */
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-gray-200 { background-color: #E5E7EB !important; }
                    .text-gray-500 { color: #6B7280 !important; }
                    .text-gray-600 { color: #4B5563 !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .border-gray-100 { border-color: #F3F4F6 !important; }
                    .border-gray-200 { border-color: #E5E7EB !important; }
                    
                    /* White */
                    .bg-white { background-color: #FFFFFF !important; }
                    .text-white { color: #FFFFFF !important; }
                    
                    /* Borders */
                    .border { border-width: 1px !important; }
                    .border-2 { border-width: 2px !important; }
                    .border-l-8 { border-left-width: 2rem !important; }
                    .border-b { border-bottom-width: 1px !important; }
                    .border-t { border-top-width: 1px !important; }
                    .border-brand-blue { border-color: #1E40AF !important; }
                    .rounded { border-radius: 0.25rem !important; }
                    .rounded-full { border-radius: 9999px !important; }
                    .rounded-xl { border-radius: 0.75rem !important; }
                    .rounded-lg { border-radius: 0.5rem !important; }
                    
                    /* Shadows */
                    .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important; }
                    .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; }
                    
                    /* Positioning */
                    .absolute { position: absolute !important; }
                    .relative { position: relative !important; }
                    .top-0 { top: 0 !important; }
                    .left-0 { left: 0 !important; }
                    .w-full { width: 100% !important; }
                    .h-1 { height: 0.25rem !important; }
                    .h-6 { height: 1.5rem !important; }
                    .h-12 { height: 3rem !important; }
                    .w-6 { width: 1.5rem !important; }
                    .w-12 { width: 3rem !important; }
                    .w-auto { width: auto !important; }
                    
                    /* Overflow */
                    .overflow-hidden { overflow: hidden !important; }
                    
                    /* Opacity */
                    .opacity-50 { opacity: 0.5 !important; }
                    .opacity-70 { opacity: 0.7 !important; }
                    .opacity-90 { opacity: 0.9 !important; }
                    
                    /* Backdrop */
                    .backdrop-blur-sm { backdrop-filter: blur(4px) !important; }
                    
                    /* Space utilities */
                    .space-y-3 > * + * { margin-top: 0.75rem !important; }
                    .space-y-8 > * + * { margin-top: 2rem !important; }
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

    const quickStatus = getRatioStatus(analysis.quickRatio);
    const cashStatus = getRatioStatus(analysis.cashRatio);

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
            
            <div id="printable-area">
                <ReportHeader title={title} />
                <div className="text-right mb-2">
                    <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex justify-end items-center mb-2 no-print">
                <PermissionWrapper
                    requiredPermission={buildPermission(
                        Resources.LIQUIDITY_REPORT,
                        Actions.PRINT,
                    )}
                    fallback={
                        <button disabled className="p-2 bg-gray-100 rounded cursor-not-allowed opacity-50"><PrintIcon/></button>
                    }
                >
                    <button onClick={handlePrint} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><PrintIcon/></button>
                </PermissionWrapper>
            </div>
                {/* Safety Indicator Banner */}
            <div className={`p-3 mb-2 rounded-xl border-l-8 shadow-sm flex items-center gap-3 ${getStatusColor(analysis.safetyStatus)}`}>
                <div className="p-2.5 bg-white/50 rounded-full backdrop-blur-sm">
                    {analysis.safetyStatus === 'excellent' || analysis.safetyStatus === 'good' ? <ShieldIcon className="w-9 h-9"/> : <AlertTriangleIcon className="w-9 h-9"/>}
                </div>
                <div>
                    <h2 className="text-xl font-extrabold mb-0.5">حالة السيولة: {
                        analysis.safetyStatus === 'excellent' ? 'ممتازة' : 
                        analysis.safetyStatus === 'good' ? 'جيدة' : 
                        analysis.safetyStatus === 'warning' ? 'حذرة' : 'خطرة'
                    }</h2>
                    <p className="text-sm opacity-90 font-medium">{analysis.safetyMessage}</p>
                </div>
                <div className="mr-auto text-center hidden md:block">
                    <p className="text-xs uppercase tracking-widest opacity-70 font-bold">نسبة التداول</p>
                    <p className="text-3xl font-black">{analysis.currentRatio.toFixed(2)}</p>
                </div>
            </div>

            {/* Ratios Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="bg-white p-5 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-600">نسبة التداول (Current Ratio)</h3>
                        <ActivityIcon className="text-blue-500 w-6 h-6"/>
                    </div>
                    <p className="text-3xl font-bold text-brand-dark">{analysis.currentRatio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: 1.5 - 2.0</p>
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded">قدرة الشركة على سداد ديونها قصيرة الأجل باستخدام جميع أصولها المتداولة.</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-600">نسبة السيولة السريعة (Quick)</h3>
                        <TrendingUpIcon className="text-purple-500 w-6 h-6"/>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-3xl font-bold text-brand-dark">{analysis.quickRatio.toFixed(2)}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${quickStatus.classes}`}>{quickStatus.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: {'>'} 1.0 (مع تدرج الألوان حسب النتيجة)</p>
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded">القدرة على السداد دون الحاجة لبيع المخزون (النقد + الذمم المدينة).</p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-gray-600">نسبة النقدية (Cash Ratio)</h3>
                        <ShieldIcon className="text-green-500 w-6 h-6"/>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-3xl font-bold text-brand-dark">{analysis.cashRatio.toFixed(2)}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${cashStatus.classes}`}>{cashStatus.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">المعيار: يعتمد على النشاط (مع تدرج الألوان حسب النتيجة)</p>
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded">السيولة النقدية الفورية المتوفرة لتغطية الالتزامات الحالية.</p>
                </div>
            </div>

            {/* Rating Scale Table */}
            <div className="mt-4 mb-4 border rounded-xl overflow-hidden shadow">
                <div className="bg-gray-100 p-3 border-b">
                    <h3 className="font-bold text-gray-800 text-sm text-center">جدول تقييم نسب السيولة</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse" dir="rtl">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-xs font-bold text-gray-700 border border-gray-300 bg-gray-100"></th>
                                <th className="p-3 text-xs font-bold text-gray-700 border border-gray-300 bg-gray-100">نسبة النقدية</th>
                                <th className="p-3 text-xs font-bold text-gray-700 border border-gray-300 bg-gray-100">نسبة السيولة السريعة</th>
                                <th className="p-3 text-xs font-bold text-gray-700 border border-gray-300 bg-gray-100">نسبة التداول</th>
                                <th className="p-3 text-xs font-bold text-gray-700 border border-gray-300 bg-gray-100">الرقم المتوقع للنتيجة</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-3 text-xs border border-gray-300 bg-orange-100 text-center align-middle" rowSpan={5} style={{ verticalAlign: 'middle', width: '100px' }}>
                                    <div className="flex items-center justify-center h-full" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                        <span className="font-semibold">مع تفعيل الألوان الأخرى</span>
                                    </div>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-500 font-semibold inline-block">
                                        ممتاز جداً - لكن هناك نقد خامل غير مستثمر
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-500 font-semibold inline-block">
                                        ممتاز جداً
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-500 font-semibold inline-block">
                                        ممتاز
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center font-bold align-middle">{'>'}2</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-blue-100 text-blue-800 border border-blue-500 font-semibold inline-block">
                                        جيد جداً
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-blue-100 text-blue-800 border border-blue-500 font-semibold inline-block">
                                        جيد جداً
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-blue-100 text-blue-800 border border-blue-500 font-semibold inline-block">
                                        جيد
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center font-bold align-middle">1.5 : 2</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-500 font-semibold inline-block">
                                        جيد
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-500 font-semibold inline-block">
                                        جيد
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-500 font-semibold inline-block">
                                        ضعيف
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center font-bold align-middle">1</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-500 font-semibold inline-block">
                                        مقبول
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-orange-100 text-orange-800 border border-orange-500 font-semibold inline-block">
                                        ضعيف
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-red-100 text-red-800 border border-red-500 font-semibold inline-block">
                                        خطر شديد
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center font-bold align-middle">0.5</td>
                            </tr>
                            <tr>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-orange-100 text-orange-800 border border-orange-500 font-semibold inline-block">
                                        ضعيف
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-red-100 text-red-800 border border-red-500 font-semibold inline-block">
                                        ضعيف جداً
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center align-middle">
                                    <span className="px-3 py-1.5 rounded bg-red-100 text-red-800 border border-red-500 font-semibold inline-block">
                                        خطر شديد
                                    </span>
                                </td>
                                <td className="p-3 text-xs border border-gray-300 text-center font-bold align-middle">{'<'}0.50</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-blue-50 p-3 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-800 text-sm">الأصول المتداولة (Current Assets)</h3>
                        <span className="font-mono font-bold text-blue-700 text-base">{formatNumber(analysis.currentAssets)}</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                        <div className="flex justify-between text-xs border-b border-gray-100 pb-1">
                            <span className="text-gray-600">النقدية بالخزينة</span>
                            <span className="font-bold">{formatNumber(analysis.totalCash)}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-gray-100 pb-1">
                            <span className="text-gray-600">الأرصدة البنكية</span>
                            <span className="font-bold">{formatNumber(analysis.totalBank)}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-gray-100 pb-1">
                            <span className="text-gray-600">الذمم المدينة (العملاء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalReceivables)}</span>
                        </div>
                        <div className="flex justify-between text-xs border-b border-gray-100 pb-1">
                            <span className="text-gray-600">أرصدة مدينة أخرى</span>
                            <span className="font-bold">{formatNumber(analysis.totalOtherReceivables)}</span>
                        </div>
                        <div className="flex justify-between text-xs pb-1">
                            <span className="text-gray-600">قيمة المخزون (بسعر الشراء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalInventory)}</span>
                        </div>
                        <div className="flex justify-between text-xs pb-1">
                            <span className="text-gray-600">ضريبة القيمة المضافة المدفوعة</span>
                            <span className="font-bold">{formatNumber(analysis.vatAsset)}</span>
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                        <h3 className="font-bold text-red-800">الالتزامات المتداولة (Current Liabilities)</h3>
                        <span className="font-mono font-bold text-red-700 text-lg">{formatNumber(analysis.currentLiabilities)}</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الذمم الدائنة (الموردين)</span>
                            <span className="font-bold">{formatNumber(analysis.totalPayables)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">أرصدة دائنة أخرى</span>
                            <span className="font-bold">{formatNumber(analysis.totalOtherPayables)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2">
                            <span className="text-gray-600">الضريبة المستحقة</span>
                            <span className="font-bold">{formatNumber(analysis.vatLiability)}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default LiquidityReport;
