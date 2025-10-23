import React, { useState, useMemo } from 'react';
import type { CompanyInfo, Bank, User, Voucher } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';

interface BankStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  banks: Bank[];
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const BankStatementReport: React.FC<BankStatementReportProps> = ({ title, companyInfo, banks, receiptVouchers, paymentVouchers, currentUser }) => {
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
    const [selectedBankId, setSelectedBankId] = useState<string | null>(banks.length > 0 ? banks[0].id.toString() : null);

    const selectedBank = useMemo(() => banks.find(b => b.id.toString() === selectedBankId), [banks, selectedBankId]);
    const selectedBankName = selectedBank?.name || 'غير محدد';

    const openingBalance = useMemo(() => {
        if (!selectedBank) return 0;
        const receiptsBefore = receiptVouchers.filter(v => v.paymentMethod === 'bank' && v.safeOrBankId === selectedBank.id && v.date < startDate).reduce((sum, v) => sum + v.amount, 0);
        const paymentsBefore = paymentVouchers.filter(v => v.paymentMethod === 'bank' && v.safeOrBankId === selectedBank.id && v.date < startDate).reduce((sum, v) => sum + v.amount, 0);
        return selectedBank.openingBalance + receiptsBefore - paymentsBefore;
    }, [selectedBank, receiptVouchers, paymentVouchers, startDate]);

    const reportData = useMemo(() => {
        if (!selectedBankId) return [];
        const bankId = parseInt(selectedBankId);
        
        const transactions: {date: string, description: string, ref: string, debit: number, credit: number}[] = [];

        receiptVouchers.forEach(v => {
            if(v.paymentMethod === 'bank' && v.safeOrBankId === bankId && v.date >= startDate && v.date <= endDate) {
                transactions.push({ date: v.date, description: `سند قبض من ${v.entity.name}`, ref: v.id, debit: v.amount, credit: 0 });
            }
        });
        paymentVouchers.forEach(v => {
            if(v.paymentMethod === 'bank' && v.safeOrBankId === bankId && v.date >= startDate && v.date <= endDate) {
                transactions.push({ date: v.date, description: `سند صرف إلى ${v.entity.name}`, ref: v.id, debit: 0, credit: v.amount });
            }
        });

        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = openingBalance;
        return transactions.map(t => {
            balance = balance + t.debit - t.credit;
            return { ...t, balance };
        });

    }, [selectedBankId, receiptVouchers, paymentVouchers, startDate, endDate, openingBalance]);

    const totalDebit = reportData.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = reportData.reduce((sum, item) => sum + item.credit, 0);
    const finalBalance = openingBalance + totalDebit - totalCredit;

    const inputStyle = "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

    const handlePrint = () => {
        const reportContent = document.getElementById('printable-area');
        if (!reportContent) return;
        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow?.document.write('<html><head><title>طباعة التقرير</title>');
        printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
        printWindow?.document.write('<style>body { font-family: "Cairo", sans-serif; direction: rtl; } @media print { body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } .no-print { display: none !important; } thead { display: table-header-group; } tfoot { display: table-footer-group; } table { width: 100%; border-collapse: collapse; } .bg-brand-blue { background-color: #1E40AF !important; } .text-white { color: white !important; } }</style>');
        printWindow?.document.write('</head><body>' + reportContent.innerHTML + '</body></html>');
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => { printWindow?.print(); printWindow?.close(); }, 500);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area">
                <ReportHeader title={title} companyInfo={companyInfo} />
                <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
                    <p><strong>البنك:</strong> {selectedBankName}</p>
                    <p><strong>الفترة من:</strong> {startDate} <strong>إلى:</strong> {endDate}</p>
                    <p><strong>فرع الطباعة:</strong> {currentUser?.branch}</p>
                    <p><strong>المستخدم:</strong> {currentUser?.fullName}</p>
                </div>
                
                <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
                    <div className="flex items-center gap-4">
                        <select className={inputStyle} value={selectedBankId || ''} onChange={e => setSelectedBankId(e.target.value)}>
                            <option value="">اختر البنك...</option>
                            {banks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <label className="font-semibold">من:</label>
                        <input type="date" className={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <label className="font-semibold">إلى:</label>
                        <input type="date" className={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
                        <button className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
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
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">التاريخ</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">البيان</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">المرجع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">مدين (إيداع)</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">دائن (سحب)</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">الرصيد</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr className="bg-gray-50"><td colSpan={5} className="px-6 py-3 font-bold">رصيد أول المدة</td><td className="px-6 py-3 font-bold">{formatNumber(openingBalance)}</td></tr>
                            {reportData.map((item, index) => (
                                <tr key={index} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4">{item.date}</td>
                                    <td className="px-6 py-4 font-medium text-brand-dark">{item.description}</td>
                                    <td className="px-6 py-4">{item.ref}</td>
                                    <td className="px-6 py-4 text-green-600">{formatNumber(item.debit)}</td>
                                    <td className="px-6 py-4 text-red-600">{formatNumber(item.credit)}</td>
                                    <td className="px-6 py-4 font-bold">{formatNumber(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr className="font-bold text-brand-dark">
                                <td colSpan={3} className="px-6 py-3 text-right">الإجمالي</td>
                                <td className="px-6 py-3 text-right text-green-600">{formatNumber(totalDebit)}</td>
                                <td className="px-6 py-3 text-right text-red-600">{formatNumber(totalCredit)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(finalBalance)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BankStatementReport;