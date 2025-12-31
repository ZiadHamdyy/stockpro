
import React, { useState, useMemo } from 'react';
import type { Customer, Invoice, Voucher } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import PermissionWrapper from '../../../common/PermissionWrapper';
import ReportHeader from '../ReportHeader';
import { formatNumber, exportToExcel } from '../../../../utils/formatting';
import {
    Actions,
    Resources,
    buildPermission,
} from '../../../../enums/permissions.enum';
import { useGetCustomersQuery } from '../../../store/slices/customer/customerApiSlice';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetReceiptVouchersQuery } from '../../../store/slices/receiptVoucherApiSlice';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';
import { useAuth } from '../../../hook/Auth';

interface DebtAgingReportProps {
    title: string;
}

const DebtAgingReport: React.FC<DebtAgingReportProps> = ({ title }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { isAuthed } = useAuth();
    const skip = !isAuthed;

    // Fetch data from API
    const { data: apiCustomers = [], isLoading: customersLoading } = useGetCustomersQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesInvoicesLoading } = useGetSalesInvoicesQuery(undefined);
    const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } = useGetSalesReturnsQuery(undefined);
    const { data: apiReceiptVouchers = [], isLoading: receiptVouchersLoading } = useGetReceiptVouchersQuery(undefined, { skip });
    const { data: apiPaymentVouchers = [], isLoading: paymentVouchersLoading } = useGetPaymentVouchersQuery(undefined, { skip });

    const isLoading = customersLoading || salesInvoicesLoading || salesReturnsLoading || receiptVouchersLoading || paymentVouchersLoading;

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
            } catch (e) {
                // Ignore parsing errors
            }
            return "";
        };
    }, []);

    // Transform API data to match expected format
    const customers = useMemo<Customer[]>(() => {
        return (apiCustomers as any[]).map((customer) => ({
            id: customer.id.toString(),
            code: customer.code,
            name: customer.name,
            commercialReg: customer.commercialReg || '',
            taxNumber: customer.taxNumber || '',
            nationalAddress: customer.nationalAddress || '',
            phone: customer.phone || '',
            openingBalance: customer.openingBalance || 0,
            currentBalance: customer.currentBalance || 0,
        }));
    }, [apiCustomers]);

    const salesInvoices = useMemo<Invoice[]>(() => {
        return (apiSalesInvoices as any[]).map((invoice) => ({
            id: invoice.id,
            date: normalizeDate(invoice.date),
            customerOrSupplier: invoice.customer
                ? {
                    id: invoice.customer.id.toString(),
                    name: invoice.customer.name,
                }
                : null,
            items: invoice.items || [],
            totals: invoice.totals || {
                subtotal: invoice.subtotal || 0,
                discount: invoice.discount || 0,
                tax: invoice.tax || 0,
                net: invoice.net || 0,
            },
            paymentMethod: invoice.paymentMethod,
            paymentTerms: invoice.paymentTerms,
            userName: invoice.user?.name || '',
            branchName: invoice.branch?.name || '',
            paymentTargetType: invoice.paymentTargetType,
            paymentTargetId: invoice.paymentTargetId ? parseInt(invoice.paymentTargetId) : null,
        }));
    }, [apiSalesInvoices, normalizeDate]);

    const salesReturns = useMemo<Invoice[]>(() => {
        return (apiSalesReturns as any[]).map((returnInvoice) => ({
            id: returnInvoice.id,
            date: normalizeDate(returnInvoice.date),
            customerOrSupplier: returnInvoice.customer
                ? {
                    id: returnInvoice.customer.id.toString(),
                    name: returnInvoice.customer.name,
                }
                : null,
            items: returnInvoice.items || [],
            totals: returnInvoice.totals || {
                subtotal: returnInvoice.subtotal || 0,
                discount: returnInvoice.discount || 0,
                tax: returnInvoice.tax || 0,
                net: returnInvoice.net || 0,
            },
            paymentMethod: returnInvoice.paymentMethod,
            paymentTerms: returnInvoice.paymentTerms,
            userName: returnInvoice.user?.name || '',
            branchName: returnInvoice.branch?.name || '',
            paymentTargetType: returnInvoice.paymentTargetType,
            paymentTargetId: returnInvoice.paymentTargetId ? parseInt(returnInvoice.paymentTargetId) : null,
        }));
    }, [apiSalesReturns, normalizeDate]);

    const receiptVouchers = useMemo<Voucher[]>(() => {
        return (apiReceiptVouchers as any[]).map((voucher) => {
            const entity = voucher.entity || {
                type: voucher.entityType,
                id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
                name: voucher.entityName || "",
            };
            
            return {
                id: voucher.id,
                type: "receipt" as const,
                date: normalizeDate(voucher.date),
                entity: entity,
                amount: voucher.amount,
                description: voucher.description || "",
                paymentMethod: voucher.paymentMethod,
                safeOrBankId: voucher.safeId || voucher.bankId,
                userName: voucher.user?.name || '',
                branchName: voucher.branch?.name || '',
            };
        });
    }, [apiReceiptVouchers, normalizeDate]);

    const paymentVouchers = useMemo<Voucher[]>(() => {
        return (apiPaymentVouchers as any[]).map((voucher) => {
            const entity = voucher.entity || {
                type: voucher.entityType,
                id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
                name: voucher.entityName || "",
            };
            
            return {
                id: voucher.id,
                type: "payment" as const,
                date: normalizeDate(voucher.date),
                entity: entity,
                amount: voucher.amount,
                description: voucher.description || "",
                paymentMethod: voucher.paymentMethod,
                safeOrBankId: voucher.safeId || voucher.bankId,
                userName: voucher.user?.name || '',
                branchName: voucher.branch?.name || '',
            };
        });
    }, [apiPaymentVouchers, normalizeDate]);

    const reportData = useMemo(() => {
        const today = new Date();

        return customers.map(customer => {
            const customerIdStr = customer.id.toString();
            const customerId = customer.id;

            // Only consider credit sales invoices
            const creditSalesInvoices = salesInvoices
                .filter(i => 
                    i.customerOrSupplier?.id === customerIdStr && 
                    i.paymentMethod === 'credit' && 
                    i.date
                )
                .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()); // Oldest first for FIFO

            // Get sales returns for this customer
            const customerReturns = salesReturns.filter(i => i.customerOrSupplier?.id === customerIdStr);
            
            // Get receipt vouchers (payments) for this customer, sorted by date (oldest first)
            const customerReceipts = receiptVouchers
                .filter(v => v.entity?.type === 'customer' && v.entity?.id?.toString() === customerIdStr)
                .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()); // Oldest first

            // Get payment vouchers (refunds) for this customer
            const customerRefunds = paymentVouchers.filter(v => v.entity?.type === 'customer' && v.entity?.id?.toString() === customerIdStr);

            // Calculate totals
            const totalCreditSales = creditSalesInvoices.reduce((sum, i) => sum + (i.totals?.net ?? 0), 0);
            const totalReturns = customerReturns.reduce((sum, i) => sum + (i.totals?.net ?? 0), 0);
            const totalReceipts = customerReceipts.reduce((sum, v) => sum + (v.amount ?? 0), 0);
            const totalRefunds = customerRefunds.reduce((sum, v) => sum + (v.amount ?? 0), 0);
            const openingBalance = customer.openingBalance ?? 0;

            // Track unpaid amounts per invoice using FIFO
            // Start with all invoices having their full amount unpaid
            const invoiceBalances: Array<{ invoice: Invoice; unpaidAmount: number }> = creditSalesInvoices.map(inv => ({
                invoice: inv,
                unpaidAmount: inv.totals?.net ?? 0
            }));

            // Apply opening balance as oldest debt (will be allocated to 90+ bucket)
            let remainingOpeningBalance = openingBalance;

            // Apply payments using FIFO (oldest debt first - opening balance, then invoices)
            let remainingPayments = customerReceipts.reduce((sum, v) => sum + (v.amount ?? 0), 0);
            
            // First, apply payments to opening balance (oldest debt)
            if (remainingOpeningBalance > 0 && remainingPayments > 0) {
                const paymentToOpening = Math.min(remainingPayments, remainingOpeningBalance);
                remainingOpeningBalance -= paymentToOpening;
                remainingPayments -= paymentToOpening;
            }
            
            // Then, apply remaining payments to invoices (oldest first)
            for (let i = 0; i < invoiceBalances.length && remainingPayments > 0; i++) {
                const invoiceBalance = invoiceBalances[i];
                const paymentToApply = Math.min(remainingPayments, invoiceBalance.unpaidAmount);
                invoiceBalance.unpaidAmount -= paymentToApply;
                remainingPayments -= paymentToApply;
            }

            // Apply returns (reduce debt, starting from newest invoices)
            let remainingReturns = totalReturns;
            for (let i = invoiceBalances.length - 1; i >= 0 && remainingReturns > 0; i--) {
                const invoiceBalance = invoiceBalances[i];
                const returnToApply = Math.min(remainingReturns, invoiceBalance.unpaidAmount);
                invoiceBalance.unpaidAmount -= returnToApply;
                remainingReturns -= returnToApply;
            }

            // Apply refunds (increase debt, add to oldest)
            remainingOpeningBalance += totalRefunds;

            // Calculate total balance (for filtering - only show customers with outstanding debt)
            const totalUnpaidInvoices = invoiceBalances.reduce((sum, ib) => sum + ib.unpaidAmount, 0);
            const currentBalance = remainingOpeningBalance + totalUnpaidInvoices;
            
            // Round to 2 decimal places to avoid floating point precision issues
            const roundedBalance = Math.round(currentBalance * 100) / 100;
            
            // Calculate total debt (what customer owes) and total payments
            const totalDebt = openingBalance + totalCreditSales + totalRefunds - totalReturns;
            const totalPayments = totalReceipts;
            
            // Round for comparison to avoid floating point precision issues
            const roundedTotalDebt = Math.round(totalDebt * 100) / 100;
            const roundedTotalPayments = Math.round(totalPayments * 100) / 100;

            // Calculate payment buckets based on payment date relative to invoice date
            const paymentBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
            
            // Track which invoices payments apply to (using FIFO)
            let invoiceIndex = 0;
            const invoiceBalancesForPayments = creditSalesInvoices.map(inv => ({
                invoice: inv,
                remainingAmount: inv.totals?.net ?? 0
            }));

            // Distribute payments into aging buckets based on payment date relative to invoice date
            for (const receipt of customerReceipts) {
                const receiptAmount = receipt.amount ?? 0;
                let remainingReceiptAmount = receiptAmount;
                const paymentDate = new Date(receipt.date ?? today.toISOString());

                // Apply this payment to invoices using FIFO
                while (remainingReceiptAmount > 0 && invoiceIndex < invoiceBalancesForPayments.length) {
                    const invoiceBalance = invoiceBalancesForPayments[invoiceIndex];
                    
                    if (invoiceBalance.remainingAmount <= 0) {
                        invoiceIndex++;
                        continue;
                    }

                    const invoiceDate = new Date(invoiceBalance.invoice.date ?? today.toISOString());
                    const paymentToApply = Math.min(remainingReceiptAmount, invoiceBalance.remainingAmount);
                    
                    // Calculate days between invoice date and payment date
                    const diffTime = Math.abs(paymentDate.getTime() - invoiceDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    // Distribute payment into appropriate aging bucket
                    if (diffDays <= 30) paymentBuckets['0-30'] += paymentToApply;
                    else if (diffDays <= 60) paymentBuckets['31-60'] += paymentToApply;
                    else if (diffDays <= 90) paymentBuckets['61-90'] += paymentToApply;
                    else paymentBuckets['90+'] += paymentToApply;

                    invoiceBalance.remainingAmount -= paymentToApply;
                    remainingReceiptAmount -= paymentToApply;

                    if (invoiceBalance.remainingAmount <= 0) {
                        invoiceIndex++;
                    }
                }
            }

            // Calculate aging buckets for unpaid amounts based on invoice dates
            const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

            // Allocate unpaid invoice amounts to aging buckets
            for (const { invoice, unpaidAmount } of invoiceBalances) {
                if (unpaidAmount <= 0) continue;

                const invDate = new Date(invoice.date ?? today.toISOString());
                const diffTime = Math.abs(today.getTime() - invDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) buckets['0-30'] += unpaidAmount;
                else if (diffDays <= 60) buckets['31-60'] += unpaidAmount;
                else if (diffDays <= 90) buckets['61-90'] += unpaidAmount;
                else buckets['90+'] += unpaidAmount;
            }

            // Add remaining opening balance to 90+ bucket (oldest debt)
            if (remainingOpeningBalance > 0) {
                buckets['90+'] += remainingOpeningBalance;
            }

            // Calculate total balance as sum of unpaid buckets (overdue invoices)
            const totalBalance = buckets['0-30'] + buckets['31-60'] + buckets['61-90'] + buckets['90+'];

            return {
                id: customer.id,
                name: customer.name,
                code: customer.code,
                totalBalance, // Sum of all payment buckets
                currentBalance: roundedBalance, // Actual outstanding balance for filtering (rounded)
                totalCreditSales,
                totalReceipts,
                totalDebt: roundedTotalDebt, // Total debt for filtering
                totalPayments: roundedTotalPayments, // Total payments for filtering
                paymentBuckets, // Payments distributed by aging
                buckets // Unpaid amounts distributed by aging
            };

        })
        .filter((c) => {
            // Only show customers with outstanding debt (currentBalance > 0.01)
            // The 0.01 tolerance handles floating-point precision issues
            // Customers who have fully paid their debts will have currentBalance <= 0
            const hasOutstandingDebt = c.currentBalance > 0.01;
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            return hasOutstandingDebt && matchesSearch;
        })
        .sort((a, b) => b.totalBalance - a.totalBalance);

    }, [customers, salesInvoices, salesReturns, receiptVouchers, paymentVouchers, searchTerm]);

    const totals = reportData.reduce((acc, item) => {
        acc.total += item.totalBalance;
        acc.totalCreditSales += item.totalCreditSales;
        acc.totalReceipts += item.totalReceipts;
        acc.totalOutstandingBalance += item.currentBalance;
        acc.paymentB30 += item.paymentBuckets['0-30'];
        acc.paymentB60 += item.paymentBuckets['31-60'];
        acc.paymentB90 += item.paymentBuckets['61-90'];
        acc.paymentB90plus += item.paymentBuckets['90+'];
        acc.b30 += item.buckets['0-30'];
        acc.b60 += item.buckets['31-60'];
        acc.b90 += item.buckets['61-90'];
        acc.b90plus += item.buckets['90+'];
        return acc;
    }, { total: 0, totalCreditSales: 0, totalReceipts: 0, totalOutstandingBalance: 0, paymentB30: 0, paymentB60: 0, paymentB90: 0, paymentB90plus: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 });

    const handlePrint = () => window.print();

    const handleExcelExport = () => {
        const data = reportData.map((c, index) => ({
            '#': index + 1,
            'الكود': c.code,
            'العميل': c.name,
            'الرصيد القائم': c.totalBalance,
            'الديون المستحقة 1-30 يوم': c.buckets['0-30'],
            'الديون المستحقة 31-60 يوم': c.buckets['31-60'],
            'الديون المستحقة 61-90 يوم': c.buckets['61-90'],
            'الديون المستحقة أكثر من 90 يوم': c.buckets['90+'],
        }));
        exportToExcel(data, 'تحليل_أعمار_الديون');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">جاري التحميل...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <style>{`
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
                    .bg-blue-800 { background-color: #1E40AF !important; }
                    .bg-green-600 { background-color: #16A34A !important; }
                    .bg-yellow-500 { background-color: #EAB308 !important; }
                    .bg-orange-500 { background-color: #F97316 !important; }
                    .bg-red-600 { background-color: #DC2626 !important; }
                    .text-white { color: white !important; }
                    .text-yellow-900 { color: #713F12 !important; }
                }
            `}</style>
            <div id="printable-area">
                <ReportHeader title={title} />
                <div className="text-right mb-2">
                    <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
                <div className="flex justify-between items-center my-6 bg-gray-50 p-4 rounded-lg border border-gray-200 no-print">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="بحث عن عميل..." 
                                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none w-64"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.DEBT_AGING_REPORT,
                                Actions.PRINT,
                            )}
                            fallback={
                                <>
                                    <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><ExcelIcon/></button>
                                    <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><PrintIcon/></button>
                                </>
                            }
                        >
                            <button onClick={handleExcelExport} className="p-2 border rounded hover:bg-gray-100 text-green-700"><ExcelIcon/></button>
                            <button onClick={handlePrint} className="p-2 border rounded hover:bg-gray-100 text-gray-700"><PrintIcon/></button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 no-print">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-blue-800 font-bold mb-1">الرصيد القائم</p>
                        <p className="text-xl font-bold text-blue-900">{formatNumber(totals.total)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-green-800 font-bold mb-1">الديون المستحقة 1-30 يوم</p>
                        <p className="text-xl font-bold text-green-900">{formatNumber(totals.b30)}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-yellow-800 font-bold mb-1">الديون المستحقة 31-60 يوم</p>
                        <p className="text-xl font-bold text-yellow-900">{formatNumber(totals.b60)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-orange-800 font-bold mb-1">الديون المستحقة 61-90 يوم</p>
                        <p className="text-xl font-bold text-orange-900">{formatNumber(totals.b90)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center animate-pulse">
                        <p className="text-xs text-red-800 font-bold mb-1">رصيد العملاء</p>
                        <p className="text-xl font-bold text-red-900">{formatNumber(totals.totalOutstandingBalance)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm text-center">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3 text-right">العميل</th>
                                <th className="p-3 font-bold bg-blue-800">الرصيد القائم</th>
                                <th className="p-3 bg-green-600">1-30 يوم</th>
                                <th className="p-3 bg-yellow-500 text-yellow-900">31-60 يوم</th>
                                <th className="p-3 bg-orange-500">61-90 يوم</th>
                                <th className="p-3 bg-red-600">أكثر من 90 يوم</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map((customer, index) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-600">{index + 1}</td>
                                    <td className="p-3 text-right font-bold text-gray-800">{customer.name}</td>
                                    <td className="p-3 font-mono font-bold bg-blue-50">{formatNumber(customer.totalBalance)}</td>
                                    <td className="p-3 text-gray-600">{formatNumber(customer.buckets['0-30'])}</td>
                                    <td className="p-3 text-gray-600">{formatNumber(customer.buckets['31-60'])}</td>
                                    <td className="p-3 text-gray-600">{formatNumber(customer.buckets['61-90'])}</td>
                                    <td className={`p-3 font-bold ${customer.buckets['90+'] > 0 ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                                        {formatNumber(customer.buckets['90+'])}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-brand-blue text-white font-bold">
                            <tr>
                                <td className="p-3 bg-brand-blue"></td>
                                <td className="p-3 text-right bg-brand-blue">الإجمالي</td>
                                <td className="p-3 bg-blue-800">{formatNumber(totals.total)}</td>
                                <td className="p-3 bg-green-600">{formatNumber(totals.b30)}</td>
                                <td className="p-3 bg-yellow-500 text-yellow-900">{formatNumber(totals.b60)}</td>
                                <td className="p-3 bg-orange-500">{formatNumber(totals.b90)}</td>
                                <td className="p-3 bg-red-600">{formatNumber(totals.b90plus)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DebtAgingReport;
