
import React, { useState, useMemo } from 'react';
import type { CompanyInfo, Customer, Invoice, Voucher } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, ClockIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber, exportToExcel } from '../../../../utils/formatting';

interface DebtAgingReportProps {
    title: string;
    companyInfo: CompanyInfo;
    customers: Customer[];
    salesInvoices: Invoice[];
    salesReturns: Invoice[];
    receiptVouchers: Voucher[];
    paymentVouchers: Voucher[];
}

const DebtAgingReport: React.FC<DebtAgingReportProps> = ({ title, companyInfo, customers = [], salesInvoices = [], salesReturns = [], receiptVouchers = [], paymentVouchers = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const reportData = useMemo(() => {
        const today = new Date();

        return customers.map(customer => {
            const customerIdStr = (customer.id ?? '').toString();
            const customerId = customer.id;

            // Calculate Total Balance First
            const totalSales = salesInvoices.filter(i => i.customerOrSupplier?.id === customerIdStr).reduce((sum, i) => sum + (i.totals?.net ?? 0), 0);
            const totalReturns = salesReturns.filter(i => i.customerOrSupplier?.id === customerIdStr).reduce((sum, i) => sum + (i.totals?.net ?? 0), 0);
            const totalReceipts = receiptVouchers.filter(v => v.entity?.type === 'customer' && v.entity?.id == customerId).reduce((sum, v) => sum + (v.amount ?? 0), 0);
            const totalRefunds = paymentVouchers.filter(v => v.entity?.type === 'customer' && v.entity?.id == customerId).reduce((sum, v) => sum + (v.amount ?? 0), 0);

            // Positive balance = Customer owes us
            const openingBalance = customer.openingBalance ?? 0;
            let currentBalance = openingBalance + totalSales + totalRefunds - totalReturns - totalReceipts;

            // If no debt, return empty buckets
            if (currentBalance <= 0) {
                return {
                    id: customer.id,
                    name: customer.name,
                    code: customer.code,
                    totalBalance: currentBalance,
                    buckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
                };
            }

            // Logic to distribute balance into aging buckets (FIFO - First In First Out assumption for unpaid invoices)
            // We look at the LATEST invoices. The balance is attributed to the most recent sales first? 
            // NO, usually aging means: How old is the debt?
            // If I owe 100, and I bought 50 yesterday and 50 a year ago.
            // If I paid nothing, I have 50 in "0-30" and 50 in "365+".
            // If I paid 50, usually it pays off the OLD debt first. So remaining debt is new (0-30).
            
            // Simplified Algorithm:
            // 1. Get all invoices sorted by date DESCENDING.
            // 2. Allocate 'currentBalance' to these invoices starting from the newest.
            // 3. Calculate age of the portion allocated to each invoice.
            
            const customerInvoices = salesInvoices
                .filter(i => i.customerOrSupplier?.id === customerIdStr && i.date)
                .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()); // Newest first

            const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
            let remainingBalanceToAllocate = currentBalance;

            // First, allocate to opening balance if invoices are exhausted or opening balance is the source
            // (For simplicity, we treat unallocated balance after invoices as oldest debt)

            for (const invoice of customerInvoices) {
                if (remainingBalanceToAllocate <= 0) break;

                const invDate = new Date(invoice.date ?? today.toISOString());
                const diffTime = Math.abs(today.getTime() - invDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const amountToAllocate = Math.min(remainingBalanceToAllocate, invoice.totals.net);
                
                if (diffDays <= 30) buckets['0-30'] += amountToAllocate;
                else if (diffDays <= 60) buckets['31-60'] += amountToAllocate;
                else if (diffDays <= 90) buckets['61-90'] += amountToAllocate;
                else buckets['90+'] += amountToAllocate;

                remainingBalanceToAllocate -= amountToAllocate;
            }

            // If there is still balance (e.g. from Opening Balance), put it in 90+
            if (remainingBalanceToAllocate > 0) {
                buckets['90+'] += remainingBalanceToAllocate;
            }

            return {
                id: customer.id,
                name: customer.name,
                code: customer.code,
                totalBalance: currentBalance,
                buckets
            };

        }).filter(c => c.totalBalance > 0 && c.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => b.totalBalance - a.totalBalance);

    }, [customers, salesInvoices, salesReturns, receiptVouchers, paymentVouchers, searchTerm]);

    const totals = reportData.reduce((acc, item) => {
        acc.total += item.totalBalance;
        acc.b30 += item.buckets['0-30'];
        acc.b60 += item.buckets['31-60'];
        acc.b90 += item.buckets['61-90'];
        acc.b90plus += item.buckets['90+'];
        return acc;
    }, { total: 0, b30: 0, b60: 0, b90: 0, b90plus: 0 });

    const handlePrint = () => window.print();

    const handleExcelExport = () => {
        const data = reportData.map(c => ({
            'الكود': c.code,
            'العميل': c.name,
            'الرصيد الحالي': c.totalBalance,
            '1-30 يوم': c.buckets['0-30'],
            '31-60 يوم': c.buckets['31-60'],
            '61-90 يوم': c.buckets['61-90'],
            'أكثر من 90 يوم': c.buckets['90+'],
        }));
        exportToExcel(data, 'تحليل_أعمار_الديون');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area">
                <ReportHeader title={title} companyInfo={companyInfo} />
                
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
                        <button onClick={handleExcelExport} className="p-2 border rounded hover:bg-gray-100 text-green-700"><ExcelIcon/></button>
                        <button onClick={handlePrint} className="p-2 border rounded hover:bg-gray-100 text-gray-700"><PrintIcon/></button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 no-print">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-blue-800 font-bold mb-1">إجمالي المديونية</p>
                        <p className="text-xl font-bold text-blue-900">{formatNumber(totals.total)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-green-800 font-bold mb-1">1-30 يوم (جيدة)</p>
                        <p className="text-xl font-bold text-green-900">{formatNumber(totals.b30)}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-yellow-800 font-bold mb-1">31-60 يوم (متوسطة)</p>
                        <p className="text-xl font-bold text-yellow-900">{formatNumber(totals.b60)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center">
                        <p className="text-xs text-orange-800 font-bold mb-1">61-90 يوم (حذرة)</p>
                        <p className="text-xl font-bold text-orange-900">{formatNumber(totals.b90)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center animate-pulse">
                        <p className="text-xs text-red-800 font-bold mb-1">+90 يوم (متعثرة)</p>
                        <p className="text-xl font-bold text-red-900">{formatNumber(totals.b90plus)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm text-center">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="p-3 text-right">العميل</th>
                                <th className="p-3 font-bold bg-blue-800">الرصيد القائم</th>
                                <th className="p-3 bg-green-600">1-30 يوم</th>
                                <th className="p-3 bg-yellow-500 text-yellow-900">31-60 يوم</th>
                                <th className="p-3 bg-orange-500">61-90 يوم</th>
                                <th className="p-3 bg-red-600">أكثر من 90 يوم</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50">
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
                        <tfoot className="bg-gray-100 font-bold">
                            <tr>
                                <td className="p-3 text-right">الإجمالي</td>
                                <td className="p-3 text-blue-800">{formatNumber(totals.total)}</td>
                                <td className="p-3 text-green-700">{formatNumber(totals.b30)}</td>
                                <td className="p-3 text-yellow-700">{formatNumber(totals.b60)}</td>
                                <td className="p-3 text-orange-700">{formatNumber(totals.b90)}</td>
                                <td className="p-3 text-red-700">{formatNumber(totals.b90plus)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div className="mt-6 text-xs text-gray-500">
                    * يتم احتساب أعمار الديون بناءً على مبدأ ما يرد أولاً يصرف أولاً (FIFO) للرصيد القائم مقابل أحدث الفواتير.
                </div>
            </div>
        </div>
    );
};

export default DebtAgingReport;
