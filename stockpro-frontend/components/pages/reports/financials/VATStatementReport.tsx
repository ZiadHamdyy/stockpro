
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompanyInfo, Branch, User, Invoice } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetPurchaseReturnsQuery } from '../../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetBranchesQuery } from '../../../store/slices/branch/branchApi';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';
import type { PaymentVoucher } from '../../../store/slices/paymentVoucherApiSlice';

interface VATStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const VATStatementReport: React.FC<VATStatementReportProps> = ({ title, companyInfo, currentUser }) => {
    const navigate = useNavigate();
    
    // API hooks
    const { data: apiSalesInvoices = [], isLoading: salesInvoicesLoading } =
        useGetSalesInvoicesQuery(undefined);
    const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } =
        useGetSalesReturnsQuery(undefined);
    const { data: apiPurchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
        useGetPurchaseInvoicesQuery(undefined);
    const { data: apiPurchaseReturns = [], isLoading: purchaseReturnsLoading } =
        useGetPurchaseReturnsQuery(undefined);
    const { data: apiBranches = [], isLoading: branchesLoading } =
        useGetBranchesQuery(undefined);
    const { data: apiPaymentVouchers = [], isLoading: paymentVouchersLoading } =
        useGetPaymentVouchersQuery(undefined);

    // Transform API data to match expected format
    const salesInvoices = useMemo(() => {
        return (apiSalesInvoices as any[]).map((invoice) => ({
            ...invoice,
            customerOrSupplier: invoice.customerOrSupplier
                ? {
                    id: invoice.customerOrSupplier.id.toString(),
                    name: invoice.customerOrSupplier.name,
                }
                : null,
            branchName: invoice.branch?.name || '',
        }));
    }, [apiSalesInvoices]);

    const salesReturns = useMemo(() => {
        return (apiSalesReturns as any[]).map((returnInvoice) => ({
            ...returnInvoice,
            customerOrSupplier: returnInvoice.customerOrSupplier
                ? {
                    id: returnInvoice.customerOrSupplier.id.toString(),
                    name: returnInvoice.customerOrSupplier.name,
                }
                : null,
            branchName: returnInvoice.branch?.name || '',
        }));
    }, [apiSalesReturns]);

    const purchaseInvoices = useMemo(() => {
        return (apiPurchaseInvoices as any[]).map((invoice) => ({
            ...invoice,
            customerOrSupplier: invoice.customerOrSupplier
                ? {
                    id: invoice.customerOrSupplier.id.toString(),
                    name: invoice.customerOrSupplier.name,
                }
                : null,
            branchName: invoice.branch?.name || '',
        }));
    }, [apiPurchaseInvoices]);

    const purchaseReturns = useMemo(() => {
        return (apiPurchaseReturns as any[]).map((returnInvoice) => ({
            ...returnInvoice,
            customerOrSupplier: returnInvoice.customerOrSupplier
                ? {
                    id: returnInvoice.customerOrSupplier.id.toString(),
                    name: returnInvoice.customerOrSupplier.name,
                }
                : null,
            branchName: returnInvoice.branch?.name || '',
        }));
    }, [apiPurchaseReturns]);

    const branches = useMemo(() => {
        return (apiBranches as any[]).map((branch) => ({
            ...branch,
        }));
    }, [apiBranches]);

    const paymentVouchers = useMemo(() => {
        return (apiPaymentVouchers as PaymentVoucher[]).map((voucher) => ({
            ...voucher,
            branchName: voucher.branch?.name || '',
        }));
    }, [apiPaymentVouchers]);

    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [reportData, setReportData] = useState<any[]>([]);

    // Helper function to normalize date to YYYY-MM-DD format
    const normalizeDate = useMemo(() => {
        return (date: any): string => {
            if (!date) return "";
            if (typeof date === "string") {
                // If it's already in YYYY-MM-DD format, return as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
                // If it's an ISO string, extract the date part
                return date.substring(0, 10);
            }
            if (date instanceof Date) {
                return date.toISOString().split("T")[0];
            }
            // Try to parse as Date if it's a string that looks like a date
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

    const handleViewReport = useCallback(() => {
        const normalizedStartDate = normalizeDate(startDate);
        const normalizedEndDate = normalizeDate(endDate);
        
        const filterByBranch = (inv: Invoice) => selectedBranch === 'all' || inv.branchName === selectedBranch;
        const filterByDate = (inv: Invoice) => {
            const invDate = normalizeDate(inv.date);
            return invDate >= normalizedStartDate && invDate <= normalizedEndDate;
        };
        const filterVoucherByBranch = (v: PaymentVoucher & { branchName?: string }) => 
            selectedBranch === 'all' || v.branchName === selectedBranch;
        const filterVoucherByDate = (v: PaymentVoucher) => {
            const vDate = normalizeDate(v.date);
            return vDate >= normalizedStartDate && vDate <= normalizedEndDate;
        };

        const transactions: any[] = [];

        // Debit (مدين): Sales Invoices + Purchase Returns
        salesInvoices.filter(filterByDate).filter(filterByBranch).forEach(inv => {
            transactions.push({
                date: normalizeDate(inv.date),
                ref: inv.code || inv.id,
                refId: inv.id,
                description: `فاتورة مبيعات - ${inv.customerOrSupplier?.name || 'نقدي'}`,
                amount: inv.net || 0,
                tax: inv.tax || 0,
                type: 'debit',
                link: { page: 'sales_invoice', label: 'فاتورة مبيعات' }
            });
        });

        purchaseReturns.filter(filterByDate).filter(filterByBranch).forEach(inv => {
            transactions.push({
                date: normalizeDate(inv.date),
                ref: inv.code || inv.id,
                refId: inv.id,
                description: `مرتجع مشتريات - ${inv.customerOrSupplier?.name || 'نقدي'}`,
                amount: inv.net || 0,
                tax: inv.tax || 0,
                type: 'debit',
                link: { page: 'purchase_return', label: 'مرتجع مشتريات' }
            });
        });

        // Credit (دائن): Purchase Invoices + Sales Returns + Expense-Type Tax from Payment Vouchers
        purchaseInvoices.filter(filterByDate).filter(filterByBranch).forEach(inv => {
            transactions.push({
                date: normalizeDate(inv.date),
                ref: inv.code || inv.id,
                refId: inv.id,
                description: `فاتورة مشتريات - ${inv.customerOrSupplier?.name || 'نقدي'}`,
                amount: inv.net || 0,
                tax: inv.tax || 0,
                type: 'credit',
                link: { page: 'purchase_invoice', label: 'فاتورة مشتريات' }
            });
        });

        salesReturns.filter(filterByDate).filter(filterByBranch).forEach(inv => {
            transactions.push({
                date: normalizeDate(inv.date),
                ref: inv.code || inv.id,
                refId: inv.id,
                description: `مرتجع مبيعات - ${inv.customerOrSupplier?.name || 'نقدي'}`,
                amount: inv.net || 0,
                tax: inv.tax || 0,
                type: 'credit',
                link: { page: 'sales_return', label: 'مرتجع مبيعات' }
            });
        });

        // Expense-Type Tax from Payment Vouchers (Credit)
        paymentVouchers
            .filter(v => v.entityType === 'expense-Type' && v.taxPrice && v.taxPrice > 0)
            .filter(filterVoucherByDate)
            .filter(filterVoucherByBranch)
            .forEach(v => {
                transactions.push({
                    date: normalizeDate(v.date),
                    ref: v.code,
                    refId: v.id,
                    description: `سند صرف - ${v.entityName || 'مصروف'}`,
                    amount: v.priceBeforeTax || 0,
                    tax: v.taxPrice || 0,
                    type: 'credit',
                    link: { page: 'payment_voucher', label: 'سند صرف' }
                });
            });

        // Sort by date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance
        let balance = 0;
        const finalData = transactions.map(t => {
            if (t.type === 'credit') balance += t.tax;
            else balance -= t.tax;
            
            return { ...t, balance };
        });

        setReportData(finalData);
    }, [selectedBranch, startDate, endDate, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, paymentVouchers, normalizeDate]);
    
    useEffect(() => {
        handleViewReport();
    }, [handleViewReport]);

    const totalDebit = reportData.filter(d => d.type === 'debit').reduce((sum, d) => sum + d.tax, 0);
    const totalCredit = reportData.filter(d => d.type === 'credit').reduce((sum, d) => sum + d.tax, 0);
    const netTax = totalCredit - totalDebit;

    const handlePrint = () => {
        const reportContent = document.getElementById('printable-area');
        if (!reportContent) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow?.document.write('<html><head><title>طباعة التقرير</title>');
        printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow?.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
        printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                }
            </style>
        `);
        printWindow?.document.write('</head><body>');
        printWindow?.document.write(reportContent.innerHTML);
        printWindow?.document.write('</body></html>');
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 500);
    };

    const inputStyle = "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

    // Helper to get branch name
    const getBranchName = () => {
        if (!currentUser?.branch) return 'غير محدد';
        const branch = currentUser.branch;
        if (typeof branch === 'string') return branch;
        if (typeof branch === 'object' && branch !== null && 'name' in branch) {
            return (branch as any).name;
        }
        return 'غير محدد';
    };

    const handleLinkedNavigation = (page: string, id?: string | number | null) => {
        if (!id) {
            console.error("Record ID is missing for navigation");
            return;
        }
        const encodedId = encodeURIComponent(String(id));

        if (page === "payment_voucher") {
            window.location.href = `/financials/payment-voucher?voucherId=${encodedId}`;
            return;
        }

        if (page === "sales_invoice") {
            navigate(`/sales/invoice?invoiceId=${encodedId}`);
            return;
        }
        if (page === "sales_return") {
            navigate(`/sales/return?returnId=${encodedId}`);
            return;
        }
        if (page === "purchase_invoice") {
            navigate(`/purchases/invoice?invoiceId=${encodedId}`);
            return;
        }
        if (page === "purchase_return") {
            navigate(`/purchases/return?returnId=${encodedId}`);
            return;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area">
                <ReportHeader title={title} />
                <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
                    <p><strong>الفرع:</strong> {selectedBranch === 'all' ? 'جميع الفروع' : selectedBranch}</p>
                    <p><strong>الفترة من:</strong> {startDate} <strong>إلى:</strong> {endDate}</p>
                    <p><strong>فرع الطباعة:</strong> {getBranchName()}</p>
                    <p><strong>المستخدم:</strong> {currentUser?.fullName || currentUser?.name || 'غير محدد'}</p>
                </div>

                <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <select className={inputStyle} value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                            <option value="all">جميع الفروع</option>
                            {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                        </select>
                        <label className="font-semibold">من:</label>
                        <input type="date" className={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <label className="font-semibold">إلى:</label>
                        <input type="date" className={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
                        <button onClick={handleViewReport} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
                            <SearchIcon className="w-5 h-5" />
                            <span>عرض التقرير</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><ExcelIcon className="w-6 h-6" /></button>
                        <button title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PdfIcon className="w-6 h-6" /></button>
                        <button onClick={handlePrint} title="طباعة" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PrintIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="px-4 py-3 text-right font-semibold uppercase">التاريخ</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase">رقم المستند</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase w-1/3">البيان</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase">مدين (مدخلات)</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase">دائن (مخرجات)</th>
                                <th className="px-4 py-3 text-right font-semibold uppercase">الرصيد (المستحق)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap">{row.date}</td>
                                    <td className="px-4 py-2 whitespace-nowrap font-mono">
                                        {row.link ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleLinkedNavigation(row.link.page, row.refId);
                                                    }}
                                                    className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                                                    title={`فتح ${row.link.label}`}
                                                >
                                                    {row.ref}
                                                </button>
                                                <span className="print:inline hidden">{row.ref}</span>
                                            </>
                                        ) : (
                                            row.ref
                                        )}
                                    </td>
                                    <td className="px-4 py-2">{row.description}</td>
                                    <td className="px-4 py-2 text-green-600 font-bold">{row.type === 'debit' ? formatNumber(row.tax) : '-'}</td>
                                    <td className="px-4 py-2 text-red-600 font-bold">{row.type === 'credit' ? formatNumber(row.tax) : '-'}</td>
                                    <td className="px-4 py-2 font-bold bg-gray-50">{formatNumber(row.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right">الإجمالي</td>
                                <td className="px-4 py-3 text-green-700">{formatNumber(totalDebit)}</td>
                                <td className="px-4 py-3 text-red-700">{formatNumber(totalCredit)}</td>
                                <td className={`px-4 py-3 ${netTax >= 0 ? 'text-red-700' : 'text-green-700'}`}>{formatNumber(netTax)}</td>
                            </tr>
                            <tr className="bg-brand-blue text-white text-lg">
                                <td colSpan={5} className="px-4 py-3 text-right">صافي الضريبة المستحقة</td>
                                <td className="px-4 py-3">{formatNumber(netTax)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VATStatementReport;
