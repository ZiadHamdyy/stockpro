
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompanyInfo, Branch, User, Invoice } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import PermissionWrapper from '../../../common/PermissionWrapper';
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal } from '../../../../utils/formatting';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetPurchaseReturnsQuery } from '../../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetBranchesQuery } from '../../../store/slices/branch/branchApi';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';
import type { PaymentVoucher } from '../../../store/slices/paymentVoucherApiSlice';
import { useGetReceiptVouchersQuery } from '../../../store/slices/receiptVoucherApiSlice';
import type { ReceiptVoucher } from '../../../store/slices/receiptVoucherApiSlice';
import {
  Actions,
  Resources,
  buildPermission,
} from '../../../../enums/permissions.enum';
import { useUserPermissions } from '../../../hook/usePermissions';

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

interface VATStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const VATStatementReport: React.FC<VATStatementReportProps> = ({ title, companyInfo, currentUser }) => {
    const navigate = useNavigate();
    const { hasPermission } = useUserPermissions();
    
    // Check if user has SEARCH permission to view all branches
    const canSearchAllBranches = useMemo(
        () =>
            hasPermission(
                buildPermission(Resources.VAT_STATEMENT_REPORT, Actions.SEARCH),
            ),
        [hasPermission],
    );
    
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
    const { data: apiReceiptVouchers = [], isLoading: receiptVouchersLoading } =
        useGetReceiptVouchersQuery(undefined);

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
    
    // Get current user's branch ID
    const userBranchId = useMemo(() => getUserBranchId(currentUser), [currentUser]);
    
    // Get user's branch name
    const userBranchName = useMemo(() => {
        if (!userBranchId) return "";
        return branches.find(b => b.id === userBranchId)?.name || "";
    }, [userBranchId, branches]);

    const paymentVouchers = useMemo(() => {
        return (apiPaymentVouchers as PaymentVoucher[]).map((voucher) => ({
            ...voucher,
            branchName: voucher.branch?.name || '',
        }));
    }, [apiPaymentVouchers]);

    const receiptVouchers = useMemo(() => {
        return (apiReceiptVouchers as ReceiptVoucher[]).map((voucher) => ({
            ...voucher,
            branchName: voucher.branch?.name || '',
        }));
    }, [apiReceiptVouchers]);

    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
    
    // Branch filter state - default based on permission
    const [selectedBranch, setSelectedBranch] = useState<string>(() => {
        // Compute initial value based on permission check
        const hasSearchPermission = hasPermission(
            buildPermission(Resources.VAT_STATEMENT_REPORT, Actions.SEARCH),
        );
        return hasSearchPermission ? "all" : "";
    });
    
    // Sync selectedBranch when permission changes or branches load
    useEffect(() => {
        if (!canSearchAllBranches && branches.length > 0 && userBranchName) {
            // If user doesn't have permission, always set to current branch name
            if (selectedBranch !== userBranchName) {
                setSelectedBranch(userBranchName);
            }
        } else if (!canSearchAllBranches && !userBranchName && selectedBranch !== "") {
            setSelectedBranch("");
        }
    }, [canSearchAllBranches, userBranchName, selectedBranch, branches]);
    
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

    // Calculate opening balance based on transactions before start date
    const openingBalance = useMemo(() => {
        const normalizedStartDate = normalizeDate(startDate);
        
        const filterByBranch = (inv: Invoice) => selectedBranch === 'all' || inv.branchName === selectedBranch;
        const filterBeforeStartDate = (inv: Invoice) => {
            const invDate = normalizeDate(inv.date);
            return invDate < normalizedStartDate;
        };
        const filterVoucherByBranch = (v: PaymentVoucher & { branchName?: string }) => 
            selectedBranch === 'all' || v.branchName === selectedBranch;
        const filterVoucherBeforeStartDate = (v: PaymentVoucher) => {
            const vDate = normalizeDate(v.date);
            return vDate < normalizedStartDate;
        };
        const filterReceiptVoucherByBranch = (v: ReceiptVoucher & { branchName?: string }) => 
            selectedBranch === 'all' || v.branchName === selectedBranch;
        const filterReceiptVoucherBeforeStartDate = (v: ReceiptVoucher) => {
            const vDate = normalizeDate(v.date);
            return vDate < normalizedStartDate;
        };

        // Calculate debit (VAT collected) before start date
        const debitBefore = 
            // Sales Invoices tax
            salesInvoices.filter(filterBeforeStartDate).filter(filterByBranch).reduce((sum, inv) => sum + (inv.tax || 0), 0) +
            // Purchase Returns tax
            purchaseReturns.filter(filterBeforeStartDate).filter(filterByBranch).reduce((sum, inv) => sum + (inv.tax || 0), 0) +
            // VAT from Receipt Vouchers
            receiptVouchers
                .filter(v => v.entityType === 'vat' && v.amount && v.amount > 0)
                .filter(filterReceiptVoucherBeforeStartDate)
                .filter(filterReceiptVoucherByBranch)
                .reduce((sum, v) => sum + (v.amount || 0), 0);

        // Calculate credit (VAT paid) before start date
        const creditBefore = 
            // Purchase Invoices tax
            purchaseInvoices.filter(filterBeforeStartDate).filter(filterByBranch).reduce((sum, inv) => sum + (inv.tax || 0), 0) +
            // Sales Returns tax
            salesReturns.filter(filterBeforeStartDate).filter(filterByBranch).reduce((sum, inv) => sum + (inv.tax || 0), 0) +
            // Expense-Type Tax from Payment Vouchers
            paymentVouchers
                .filter(v => v.entityType === 'expense-Type' && v.taxPrice && v.taxPrice > 0)
                .filter(filterVoucherBeforeStartDate)
                .filter(filterVoucherByBranch)
                .reduce((sum, v) => sum + (v.taxPrice || 0), 0) +
            // VAT from Payment Vouchers
            paymentVouchers
                .filter(v => v.entityType === 'vat' && v.amount && v.amount > 0)
                .filter(filterVoucherBeforeStartDate)
                .filter(filterVoucherByBranch)
                .reduce((sum, v) => sum + (v.amount || 0), 0);

        // Opening balance = Credit - Debit (positive means we owe VAT, negative means we're owed VAT)
        return creditBefore - debitBefore;
    }, [selectedBranch, startDate, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, paymentVouchers, receiptVouchers, normalizeDate]);

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
        const filterReceiptVoucherByBranch = (v: ReceiptVoucher & { branchName?: string }) => 
            selectedBranch === 'all' || v.branchName === selectedBranch;
        const filterReceiptVoucherByDate = (v: ReceiptVoucher) => {
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

        // VAT from Receipt Vouchers (Debit - VAT collected)
        receiptVouchers
            .filter(v => v.entityType === 'vat' && v.amount && v.amount > 0)
            .filter(filterReceiptVoucherByDate)
            .filter(filterReceiptVoucherByBranch)
            .forEach(v => {
                transactions.push({
                    date: normalizeDate(v.date),
                    ref: v.code,
                    refId: v.id,
                    description: `سند قبض - ${v.entityName || 'ضريبة القيمة المضافة'}`,
                    amount: v.amount || 0,
                    tax: v.amount || 0,
                    type: 'debit',
                    link: { page: 'receipt_voucher', label: 'سند قبض' }
                });
            });

        // VAT from Payment Vouchers (Credit - VAT paid)
        paymentVouchers
            .filter(v => v.entityType === 'vat' && v.amount && v.amount > 0)
            .filter(filterVoucherByDate)
            .filter(filterVoucherByBranch)
            .forEach(v => {
                transactions.push({
                    date: normalizeDate(v.date),
                    ref: v.code,
                    refId: v.id,
                    description: `سند صرف - ${v.entityName || 'ضريبة القيمة المضافة'}`,
                    amount: v.amount || 0,
                    tax: v.amount || 0,
                    type: 'credit',
                    link: { page: 'payment_voucher', label: 'سند صرف' }
                });
            });

        // Sort by date
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate running balance starting from opening balance
        let balance = openingBalance;
        const finalData = transactions.map(t => {
            if (t.type === 'credit') balance += t.tax;
            else balance -= t.tax;
            
            return { ...t, balance };
        });

        setReportData(finalData);
    }, [selectedBranch, startDate, endDate, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, paymentVouchers, receiptVouchers, openingBalance, normalizeDate]);
    
    useEffect(() => {
        handleViewReport();
    }, [handleViewReport]);

    const totalDebit = reportData.filter(d => d.type === 'debit').reduce((sum, d) => sum + d.tax, 0);
    const totalCredit = reportData.filter(d => d.type === 'credit').reduce((sum, d) => sum + d.tax, 0);
    const netTax = openingBalance + totalCredit - totalDebit;

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

        if (page === "receipt_voucher") {
            window.location.href = `/financials/receipt-voucher?voucherId=${encodedId}`;
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
                <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2 text-right">
                            <p className="text-lg font-bold text-gray-800">
                                <span className="text-brand-blue">الفرع:</span> {selectedBranch === 'all' ? 'جميع الفروع' : selectedBranch}
                            </p>
                            <p className="text-base text-gray-700">
                                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
                            </p>
                        </div>
                        <div className="space-y-2 text-right">
                            <p className="text-base text-gray-700">
                                <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-base text-gray-700">
                                <span className="font-semibold text-gray-800">المستخدم:</span> {currentUser?.fullName || currentUser?.name || 'غير محدد'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
                    <div className="flex items-center gap-4 flex-wrap no-print">
                        <select 
                            className={inputStyle} 
                            value={selectedBranch} 
                            onChange={e => setSelectedBranch(e.target.value)}
                            disabled={!canSearchAllBranches}
                            size={branches.length > 5 ? 5 : undefined}
                            style={branches.length > 5 ? { overflowY: 'auto' } : {}}
                        >
                            {canSearchAllBranches && <option value="all">جميع الفروع</option>}
                            {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                            {!canSearchAllBranches && !branches.find(b => b.name === selectedBranch) && userBranchName && (
                                <option value={userBranchName}>
                                    {userBranchName}
                                </option>
                            )}
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
                    <PermissionWrapper
                        requiredPermission={buildPermission(
                            Resources.VAT_STATEMENT_REPORT,
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
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                                    التاريخ
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                                    رقم المستند
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                                    البيان
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-green-200 uppercase">
                                    مدين (مدخلات)
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                                    دائن (مخرجات)
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                                    الرصيد (المستحق)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="px-6 py-3">
                                    رصيد أول المدة
                                </td>
                                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                                    {formatNumber(openingBalance)}
                                </td>
                            </tr>
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4 w-36">{row.date.substring(0, 10)}</td>
                                    <td className="px-6 py-4 font-medium text-brand-dark">
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
                                    <td className="px-6 py-4 font-medium text-brand-dark">
                                        {row.description}
                                    </td>
                                    <td className={`px-6 py-4 text-green-600 ${getNegativeNumberClass(row.type === 'credit' ? row.tax : 0)}`}>
                                        {row.type === 'credit' ? formatNumber(row.tax) : '-'}
                                    </td>
                                    <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(row.type === 'debit' ? row.tax : 0)}`}>
                                        {row.type === 'debit' ? formatNumber(row.tax) : '-'}
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(row.balance)}`}>
                                        {formatNumber(row.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-brand-blue text-white">
                            <tr className="font-bold text-white">
                                <td colSpan={3} className="px-6 py-3 text-right text-white">
                                    الإجمالي
                                </td>
                                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totalDebit) || "text-green-200"}`}>
                                    {formatNumber(totalCredit)}
                                </td>
                                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totalCredit) || "text-red-200"}`}>
                                    {formatNumber(totalDebit)}
                                </td>
                                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(netTax)}`}>
                                    {formatNumber(netTax)}
                                </td>
                            </tr>
                            <tr className="bg-brand-blue-bg border-t border-brand-blue text-brand-dark font-semibold">
                                <td colSpan={5} className="px-6 py-3 text-right">
                                    صافي الضريبة المستحقة
                                </td>
                                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(netTax)}`}>
                                    {formatNumber(netTax)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VATStatementReport;
