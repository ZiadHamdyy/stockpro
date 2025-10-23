import React, { useState, useMemo, useCallback } from 'react';
import type { CompanyInfo, Safe, Bank, Customer, Supplier, Item, Invoice, Voucher, Expense, ExpenseType, User, StoreReceiptVoucher, StoreIssueVoucher, CurrentAccount } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon } from '../../icons';
import ReportHeader from '../reports/ReportHeader';
import { formatNumber, exportToExcel, exportToPdf } from '../../../utils/formatting';

interface BalanceSheetProps {
  title: string;
  companyInfo: CompanyInfo;
  safes: Safe[];
  banks: Bank[];
  customers: Customer[];
  suppliers: Supplier[];
  items: Item[];
  salesInvoices: Invoice[];
  salesReturns: Invoice[];
  purchaseInvoices: Invoice[];
  purchaseReturns: Invoice[];
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  expenses: Expense[];
  expenseTypes: ExpenseType[];
  currentUser: User | null;
  storeReceiptVouchers: StoreReceiptVoucher[];
  storeIssueVouchers: StoreIssueVoucher[];
  currentAccounts: CurrentAccount[];
}

const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
    <td className={`px-4 py-3 ${className || ''}`} {...props}>
        {children}
    </td>
);

const getPreviousDay = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
};

const BalanceSheet: React.FC<BalanceSheetProps> = (props) => {
    const { title, companyInfo, safes, banks, customers, suppliers, items, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, receiptVouchers, paymentVouchers, expenses, currentUser, storeReceiptVouchers, storeIssueVouchers, currentAccounts } = props;
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    
    const calculatedData = useMemo(() => {
        const filterByDate = (date: string) => date <= endDate;

        const calculateInventoryValue = (targetDate: string): number => {
            let totalValue = 0;
            items.forEach(item => {
                let balance = item.stock; 
    
                const allTransactions = [
                    ...purchaseInvoices.map(inv => ({ ...inv, factor: 1, items: inv.items })),
                    ...salesReturns.map(inv => ({ ...inv, factor: 1, items: inv.items })),
                    ...storeReceiptVouchers.map(v => ({...v, factor: 1, items: v.items})),
                    ...salesInvoices.map(inv => ({ ...inv, factor: -1, items: inv.items })),
                    ...purchaseReturns.map(inv => ({ ...inv, factor: -1, items: inv.items })),
                    ...storeIssueVouchers.map(v => ({ ...v, factor: -1, items: v.items })),
                ];
    
                allTransactions.forEach(tx => {
                    if (filterByDate(tx.date)) { 
                        (tx.items || []).forEach((txItem: any) => {
                            if (txItem.id === item.code) {
                                balance += txItem.qty * tx.factor;
                            }
                        });
                    }
                });
                totalValue += balance * item.purchasePrice;
            });
            return totalValue > 0 ? totalValue : 0;
        };
        
        // --- ASSETS ---
        const cashInSafes = safes.reduce((total, safe) => {
            let balance = safe.openingBalance;
            balance += receiptVouchers.filter(v => v.paymentMethod === 'safe' && v.safeOrBankId === safe.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance -= paymentVouchers.filter(v => v.paymentMethod === 'safe' && v.safeOrBankId === safe.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance += salesInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'safe' && i.paymentTargetId === safe.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance += purchaseReturns.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'safe' && i.paymentTargetId === safe.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= purchaseInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'safe' && i.paymentTargetId === safe.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= salesReturns.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'safe' && i.paymentTargetId === safe.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            return total + balance;
        }, 0);

        const cashInBanks = banks.reduce((total, bank) => {
             let balance = bank.openingBalance;
            balance += receiptVouchers.filter(v => v.paymentMethod === 'bank' && v.safeOrBankId === bank.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance -= paymentVouchers.filter(v => v.paymentMethod === 'bank' && v.safeOrBankId === bank.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance += salesInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank' && i.paymentTargetId === bank.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance += purchaseReturns.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank' && i.paymentTargetId === bank.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= purchaseInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank' && i.paymentTargetId === bank.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= salesReturns.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank' && i.paymentTargetId === bank.id && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            return total + balance;
        }, 0);

        const totalReceivables = customers.reduce((total, customer) => {
            let balance = customer.openingBalance;
            balance += salesInvoices.filter(i => i.customerOrSupplier?.id === customer.id.toString() && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= salesReturns.filter(i => i.customerOrSupplier?.id === customer.id.toString() && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance -= receiptVouchers.filter(v => v.entity.type === 'customer' && v.entity.id === customer.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance += paymentVouchers.filter(v => v.entity.type === 'customer' && v.entity.id === customer.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0); // Refunds
            return total + (balance > 0 ? balance : 0);
        }, 0);

        const inventoryValue = calculateInventoryValue(endDate);
        const totalAssets = cashInSafes + cashInBanks + totalReceivables + inventoryValue;

        // --- LIABILITIES ---
        const totalPayables = suppliers.reduce((total, supplier) => {
            let balance = supplier.openingBalance;
            balance -= purchaseInvoices.filter(i => i.customerOrSupplier?.id === supplier.id.toString() && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance += purchaseReturns.filter(i => i.customerOrSupplier?.id === supplier.id.toString() && filterByDate(i.date)).reduce((sum, i) => sum + i.totals.net, 0);
            balance += paymentVouchers.filter(v => v.entity.type === 'supplier' && v.entity.id === supplier.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
            balance -= receiptVouchers.filter(v => v.entity.type === 'supplier' && v.entity.id === supplier.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0); // Refunds
            return total + (balance < 0 ? Math.abs(balance) : 0);
        }, 0);
        
        // VAT Payable Calculation
        const salesTax = salesInvoices.filter(filterByDate).reduce((sum, i) => sum + i.totals.tax, 0);
        const salesReturnsTax = salesReturns.filter(filterByDate).reduce((sum, i) => sum + i.totals.tax, 0);
        const purchasesTax = purchaseInvoices.filter(filterByDate).reduce((sum, i) => sum + i.totals.tax, 0);
        const purchaseReturnsTax = purchaseReturns.filter(filterByDate).reduce((sum, i) => sum + i.totals.tax, 0);
        const outputVat = salesTax - salesReturnsTax;
        const inputVat = purchasesTax - purchaseReturnsTax;
        const vatPayable = outputVat - inputVat;
        
        const totalLiabilities = totalPayables + vatPayable;

        // --- EQUITY ---
        const netProfit = (() => {
            const periodStartDate = new Date(endDate).getFullYear() + '-01-01';
            const filterByPeriod = (i: { date: string }) => i.date >= periodStartDate && i.date <= endDate;
            const netSales = salesInvoices.filter(filterByPeriod).reduce((s, i) => s + i.totals.subtotal, 0) - salesReturns.filter(filterByPeriod).reduce((s, i) => s + i.totals.subtotal, 0);
            const netPurchases = purchaseInvoices.filter(filterByPeriod).reduce((s, i) => s + i.totals.subtotal, 0) - purchaseReturns.filter(filterByPeriod).reduce((s, i) => s + i.totals.subtotal, 0);
            const beginningInventory = calculateInventoryValue(getPreviousDay(periodStartDate));
            const cogs = beginningInventory + netPurchases - inventoryValue;
            const grossProfit = netSales - cogs;
            const totalExpenses = paymentVouchers.filter(v => v.entity.type === 'expense' && filterByPeriod(v)).reduce((s, e) => s + e.amount, 0);
            return grossProfit - totalExpenses;
        })();
        
        const partnersTotalBalance = currentAccounts
            .reduce((total, account) => {
                let balance = account.openingBalance;
                balance -= receiptVouchers.filter(v => v.entity.type === 'current_account' && v.entity.id === account.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
                balance += paymentVouchers.filter(v => v.entity.type === 'current_account' && v.entity.id === account.id && filterByDate(v.date)).reduce((sum, v) => sum + v.amount, 0);
                return total + balance;
            }, 0);
        
        const capital = companyInfo.capital || 0;
        const totalEquity = capital + partnersTotalBalance + netProfit;
        
        return {
            assets: { cashInSafes, cashInBanks, receivables: totalReceivables, inventory: inventoryValue, total: totalAssets },
            liabilities: { payables: totalPayables, vatPayable, total: totalLiabilities },
            equity: { capital, partnersBalance: partnersTotalBalance, retainedEarnings: netProfit, total: totalEquity },
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity
        };
    }, [endDate, safes, banks, customers, suppliers, items, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, receiptVouchers, paymentVouchers, companyInfo.capital, storeReceiptVouchers, storeIssueVouchers, currentAccounts]);

    const handlePrint = () => {
        const reportContent = document.getElementById('printable-area-balance-sheet');
        if (!reportContent) return;
        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow?.document.write('<html><head><title>طباعة التقرير</title>');
        printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow?.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
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
        printWindow?.document.write('</head><body>' + reportContent.innerHTML + '</body></html>');
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 500);
    };

    const handleExcelExport = () => {
        const data = [
            { Item: "الأصول", Value: "" },
            { Item: "  النقدية بالخزن", Value: calculatedData.assets.cashInSafes },
            { Item: "  النقدية بالبنوك", Value: calculatedData.assets.cashInBanks },
            { Item: "  الذمم المدينة (العملاء)", Value: calculatedData.assets.receivables },
            { Item: "  المخزون", Value: calculatedData.assets.inventory },
            { Item: "إجمالي الأصول", Value: calculatedData.assets.total },
            { Item: "", Value: ""}, // Spacer
            { Item: "الالتزامات", Value: "" },
            { Item: "  الموردون (ذمم دائنة)", Value: calculatedData.liabilities.payables },
            { Item: "  ضريبة القيمة المضافة المستحقة", Value: calculatedData.liabilities.vatPayable },
            { Item: "إجمالي الالتزامات", Value: calculatedData.liabilities.total },
            { Item: "", Value: ""}, // Spacer
            { Item: "حقوق الملكية", Value: "" },
            { Item: "  رأس المال", Value: calculatedData.equity.capital },
            { Item: "  جاري الشركاء", Value: calculatedData.equity.partnersBalance },
            { Item: "  الأرباح المحتجزة (أرباح الفترة)", Value: calculatedData.equity.retainedEarnings },
            { Item: "إجمالي حقوق الملكية", Value: calculatedData.equity.total },
            { Item: "", Value: ""}, // Spacer
            { Item: "إجمالي الالتزامات وحقوق الملكية", Value: calculatedData.totalLiabilitiesAndEquity },
        ];
        exportToExcel(data, "قائمة-المركز-المالي");
    };

    const handlePdfExport = () => {
        const head = [['المبلغ', 'البيان']];
        const body = [
            [{ content: 'الأصول', colSpan: 2, styles: { halign: 'center', fillColor: '#2563EB', textColor: '#FFFFFF' } }],
            [formatNumber(calculatedData.assets.cashInSafes), 'النقدية بالخزن'],
            [formatNumber(calculatedData.assets.cashInBanks), 'النقدية بالبنوك'],
            [formatNumber(calculatedData.assets.receivables), 'الذمم المدينة (العملاء)'],
            [formatNumber(calculatedData.assets.inventory), 'المخزون'],
            [{ content: formatNumber(calculatedData.assets.total), styles: { fontStyle: 'bold', fillColor: '#DBEAFE' } }, { content: 'إجمالي الأصول', styles: { fontStyle: 'bold', fillColor: '#DBEAFE' } }],
            
            [{ content: 'الالتزامات', colSpan: 2, styles: { halign: 'center', fillColor: '#DC2626', textColor: '#FFFFFF' } }],
            [formatNumber(calculatedData.liabilities.payables), 'الموردون (ذمم دائنة)'],
            [formatNumber(calculatedData.liabilities.vatPayable), 'ضريبة القيمة المضافة المستحقة'],
            [{ content: formatNumber(calculatedData.liabilities.total), styles: { fontStyle: 'bold', fillColor: '#FEE2E2' } }, { content: 'إجمالي الالتزامات', styles: { fontStyle: 'bold', fillColor: '#FEE2E2' } }],

            [{ content: 'حقوق الملكية', colSpan: 2, styles: { halign: 'center', fillColor: '#16A34A', textColor: '#FFFFFF' } }],
            [formatNumber(calculatedData.equity.capital), 'رأس المال'],
            [formatNumber(calculatedData.equity.partnersBalance), 'جاري الشركاء'],
            [formatNumber(calculatedData.equity.retainedEarnings), 'الأرباح المحتجزة (أرباح الفترة)'],
            [{ content: formatNumber(calculatedData.equity.total), styles: { fontStyle: 'bold', fillColor: '#D1FAE5' } }, { content: 'إجمالي حقوق الملكية', styles: { fontStyle: 'bold', fillColor: '#D1FAE5' } }],

            [{ content: formatNumber(calculatedData.totalLiabilitiesAndEquity), styles: { fontStyle: 'bold', fillColor: '#4B5563', textColor: '#FFFFFF' } }, { content: 'إجمالي الالتزامات وحقوق الملكية', styles: { fontStyle: 'bold', fillColor: '#4B5563', textColor: '#FFFFFF' } }],
        ];
        exportToPdf(title, head, body, 'قائمة-المركز-المالي', companyInfo);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area-balance-sheet">
                <ReportHeader title={title} companyInfo={companyInfo} />
                <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
                    <p><strong>التقرير حتى تاريخ:</strong> {endDate}</p>
                    <p><strong>المستخدم:</strong> {currentUser?.fullName}</p>
                </div>

                <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="font-semibold">حتى تاريخ:</label>
                        <input type="date" className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExcelExport} title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><ExcelIcon className="w-6 h-6" /></button>
                        <button onClick={handlePdfExport} title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PdfIcon className="w-6 h-6" /></button>
                        <button onClick={handlePrint} title="طباعة" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"><PrintIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="overflow-x-auto border-2 border-gray-300 rounded-lg mt-4">
                    <table className="min-w-full text-base">
                         <tbody className="divide-y divide-gray-200">
                            {/* Assets */}
                            <tr className="bg-blue-600 text-white font-bold"><Td colSpan={2} className="text-lg">الأصول</Td></tr>
                            <tr><Td>النقدية بالخزن</Td><Td className="text-left font-mono">{formatNumber(calculatedData.assets.cashInSafes)}</Td></tr>
                            <tr><Td>النقدية بالبنوك</Td><Td className="text-left font-mono">{formatNumber(calculatedData.assets.cashInBanks)}</Td></tr>
                            <tr><Td>الذمم المدينة (العملاء)</Td><Td className="text-left font-mono">{formatNumber(calculatedData.assets.receivables)}</Td></tr>
                            <tr><Td>المخزون</Td><Td className="text-left font-mono">{formatNumber(calculatedData.assets.inventory)}</Td></tr>
                            <tr className="font-bold bg-blue-100 text-brand-dark"><Td>إجمالي الأصول</Td><Td className="text-left font-mono text-lg">{formatNumber(calculatedData.assets.total)}</Td></tr>

                             {/* Liabilities */}
                            <tr className="bg-red-600 text-white font-bold"><Td colSpan={2} className="text-lg">الالتزامات</Td></tr>
                            <tr><Td>الموردون (ذمم دائنة)</Td><Td className="text-left font-mono">{formatNumber(calculatedData.liabilities.payables)}</Td></tr>
                            <tr><Td>ضريبة القيمة المضافة المستحقة</Td><Td className="text-left font-mono">{formatNumber(calculatedData.liabilities.vatPayable)}</Td></tr>
                            <tr className="font-bold bg-red-100 text-red-800"><Td>إجمالي الالتزامات</Td><Td className="text-left font-mono text-lg">{formatNumber(calculatedData.liabilities.total)}</Td></tr>

                             {/* Equity */}
                            <tr className="bg-green-600 text-white font-bold"><Td colSpan={2} className="text-lg">حقوق الملكية</Td></tr>
                            <tr><Td>رأس المال</Td><Td className="text-left font-mono">{formatNumber(calculatedData.equity.capital)}</Td></tr>
                            <tr><Td>جاري الشركاء</Td><Td className="text-left font-mono">{formatNumber(calculatedData.equity.partnersBalance)}</Td></tr>
                            <tr><Td>الأرباح المحتجزة (أرباح الفترة)</Td><Td className="text-left font-mono">{formatNumber(calculatedData.equity.retainedEarnings)}</Td></tr>
                            <tr className="font-bold bg-green-100 text-green-800"><Td>إجمالي حقوق الملكية</Td><Td className="text-left font-mono text-lg">{formatNumber(calculatedData.equity.total)}</Td></tr>

                            {/* Total Liabilities & Equity */}
                             <tr className="font-bold bg-gray-700 text-white text-lg">
                                <Td>إجمالي الالتزامات وحقوق الملكية</Td>
                                <Td className="text-left font-mono">{formatNumber(calculatedData.totalLiabilitiesAndEquity)}</Td>
                             </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;