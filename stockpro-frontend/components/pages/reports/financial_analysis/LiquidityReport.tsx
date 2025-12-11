
import React, { useMemo } from 'react';
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

    const analysis = useMemo(() => {
        const normalizedStartDate = normalizeDate(defaultStartDate);
        const normalizedEndDate = normalizeDate(defaultEndDate);

        const filterByDate = (record: any) => {
            const recordDate = normalizeDate(record?.date);
            return recordDate >= normalizedStartDate && recordDate <= normalizedEndDate;
        };

        // VAT position (same logic as BalanceSheet/VAT statement)
        let vatDebit = 0;
        let vatCredit = 0;

        (apiSalesInvoices as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebit += tax;
        });

        (apiPurchaseReturns as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatDebit += tax;
        });

        (apiPurchaseInvoices as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCredit += tax;
        });

        (apiSalesReturns as any[]).filter(filterByDate).forEach((inv) => {
            const tax = inv.tax ?? inv.totals?.tax ?? 0;
            vatCredit += tax;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "expense-Type" && v.taxPrice && v.taxPrice > 0).filter(filterByDate).forEach((v) => {
            vatCredit += v.taxPrice ?? 0;
        });

        (apiReceiptVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterByDate).forEach((v) => {
            vatDebit += v.amount ?? 0;
        });

        (apiPaymentVouchers as any[]).filter((v) => v.entityType === "vat" && v.amount && v.amount > 0).filter(filterByDate).forEach((v) => {
            vatCredit += v.amount ?? 0;
        });

        const vatNet = vatCredit - vatDebit;
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

        const totalBank = Math.abs(banks.reduce((sum, b) => sum + (b.openingBalance ?? 0), 0)
             + receiptVouchers.filter(v => v.paymentMethod === 'bank').reduce((sum, v) => sum + (v.amount ?? 0), 0)
             - paymentVouchers.filter(v => v.paymentMethod === 'bank').reduce((sum, v) => sum + (v.amount ?? 0), 0)
             + salesInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0));

        const totalOtherReceivables = Math.abs(balanceSheetData?.otherReceivables ?? 0);

        const totalReceivables = Math.abs(customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0)
            + salesInvoices.filter(i => i.paymentMethod === 'credit').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0)
            - receiptVouchers.filter(v => v.entity?.type === 'customer').reduce((sum, v) => sum + (v.amount ?? 0), 0));

        const totalInventory = Math.abs(items.reduce((sum, item) => sum + ((item.stock ?? 0) * (item.purchasePrice ?? 0)), 0));

        const currentAssets = totalCash + totalBank + totalReceivables + totalOtherReceivables + totalInventory + vatAsset;
        const liquidAssets = totalCash + totalBank + totalReceivables + totalOtherReceivables + vatAsset;

        // 2. Current Liabilities (الالتزامات المتداولة)
        const totalOtherPayables = Math.abs(balanceSheetData?.otherPayables ?? 0);

        const totalPayables = Math.abs(suppliers.reduce((sum, s) => sum + (s.openingBalance ?? 0), 0)
            + purchaseInvoices.filter(i => i.paymentMethod === 'credit').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0)
            - paymentVouchers.filter(v => v.entity?.type === 'supplier').reduce((sum, v) => sum + (v.amount ?? 0), 0));

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
    }, [balanceSheetData, banks, customers, defaultEndDate, defaultStartDate, items, normalizeDate, paymentVouchers, purchaseInvoices, apiPurchaseReturns, receiptVouchers, safes, salesInvoices, apiSalesReturns, suppliers, apiInternalTransfers, apiSalesInvoices, apiPurchaseInvoices, apiReceiptVouchers, apiPaymentVouchers]);

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

    const handlePrint = () => window.print();

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
        <div className="bg-white p-6 rounded-lg shadow space-y-8">
            <div className="flex justify-between items-center border-b pb-4 no-print">
                <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
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
            <div className={`p-6 rounded-xl border-l-8 shadow-sm flex items-center gap-6 ${getStatusColor(analysis.safetyStatus)}`}>
                <div className="p-4 bg-white/50 rounded-full backdrop-blur-sm">
                    {analysis.safetyStatus === 'excellent' || analysis.safetyStatus === 'good' ? <ShieldIcon className="w-12 h-12"/> : <AlertTriangleIcon className="w-12 h-12"/>}
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold mb-1">حالة السيولة: {
                        analysis.safetyStatus === 'excellent' ? 'ممتازة' : 
                        analysis.safetyStatus === 'good' ? 'جيدة' : 
                        analysis.safetyStatus === 'warning' ? 'حذرة' : 'خطرة'
                    }</h2>
                    <p className="text-lg opacity-90 font-medium">{analysis.safetyMessage}</p>
                </div>
                <div className="mr-auto text-center hidden md:block">
                    <p className="text-sm uppercase tracking-widest opacity-70 font-bold">نسبة التداول</p>
                    <p className="text-4xl font-black">{analysis.currentRatio.toFixed(2)}</p>
                </div>
            </div>

            {/* Ratios Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة التداول (Current Ratio)</h3>
                        <ActivityIcon className="text-blue-500 w-6 h-6"/>
                    </div>
                    <p className="text-3xl font-bold text-brand-dark">{analysis.currentRatio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: 1.5 - 2.0</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">قدرة الشركة على سداد ديونها قصيرة الأجل باستخدام جميع أصولها المتداولة.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة السيولة السريعة (Quick)</h3>
                        <TrendingUpIcon className="text-purple-500 w-6 h-6"/>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-3xl font-bold text-brand-dark">{analysis.quickRatio.toFixed(2)}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${quickStatus.classes}`}>{quickStatus.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: {'>'} 1.0 (مع تدرج الألوان حسب النتيجة)</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">القدرة على السداد دون الحاجة لبيع المخزون (النقد + الذمم المدينة).</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة النقدية (Cash Ratio)</h3>
                        <ShieldIcon className="text-green-500 w-6 h-6"/>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-3xl font-bold text-brand-dark">{analysis.cashRatio.toFixed(2)}</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${cashStatus.classes}`}>{cashStatus.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">المعيار: يعتمد على النشاط (مع تدرج الألوان حسب النتيجة)</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">السيولة النقدية الفورية المتوفرة لتغطية الالتزامات الحالية.</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-800">الأصول المتداولة (Current Assets)</h3>
                        <span className="font-mono font-bold text-blue-700 text-lg">{formatNumber(analysis.currentAssets)}</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">النقدية بالخزينة</span>
                            <span className="font-bold">{formatNumber(analysis.totalCash)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الأرصدة البنكية</span>
                            <span className="font-bold">{formatNumber(analysis.totalBank)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الذمم المدينة (العملاء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalReceivables)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">أرصدة مدينة أخرى</span>
                            <span className="font-bold">{formatNumber(analysis.totalOtherReceivables)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2">
                            <span className="text-gray-600">قيمة المخزون (بسعر الشراء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalInventory)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2">
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
                    <div className="p-4 space-y-3">
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
    );
};

export default LiquidityReport;
