import React, { useState } from 'react';
import type { CompanyInfo, User } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';

interface TotalCurrentAccountsReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const accountsSummary = [
    { id: 1, code: '20101', name: 'جاري الشريك أ', opening: 0.00, debit: 10000.00, credit: 50000.00, balance: 40000.00 },
    { id: 2, code: '20102', name: 'جاري الشريك ب', opening: 15000.00, debit: 5000.00, credit: 55000.00, balance: 65000.00 },
    { id: 3, code: '10501', name: 'سلفة موظف', opening: 0.00, debit: 2000.00, credit: 0.00, balance: -2000.00 },
];

const TotalCurrentAccountsReport: React.FC<TotalCurrentAccountsReportProps> = ({ title, companyInfo, currentUser }) => {
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

    const totals = accountsSummary.reduce((acc, item) => {
        acc.opening += item.opening;
        acc.debit += item.debit;
        acc.credit += item.credit;
        acc.balance += item.balance;
        return acc;
    }, { opening: 0, debit: 0, credit: 0, balance: 0 });

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
                }
            </style>
        `);
        printWindow?.document.write('</head><body>');
        printWindow?.document.write(reportContent.innerHTML);
        printWindow?.document.write('</body></html>');
        printWindow?.document.close();
        printWindow?.focus();
        setTimeout(() => {
            printWindow?.print();
            printWindow?.close();
        }, 500);
    };
    
    const inputStyle = "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area">
                <ReportHeader title={title} companyInfo={companyInfo} />
                <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2">
                    <p><strong>فرع الطباعة:</strong> {currentUser?.branch}</p>
                    <p><strong>المستخدم:</strong> {currentUser?.fullName}</p>
                </div>
                
                <div className="flex justify-between items-center my-4 no-print">
                    <div className="flex items-center gap-4">
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
                        <button title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <ExcelIcon className="w-6 h-6" />
                        </button>
                        <button title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PdfIcon className="w-6 h-6" />
                        </button>
                        <button onClick={handlePrint} title="طباعة" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PrintIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">كود الحساب</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">اسم الحساب</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">رصيد أول المدة</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">إجمالي مدين</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">إجمالي دائن</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">الرصيد الحالي</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {accountsSummary.map((item) => (
                                <tr key={item.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4">{item.code}</td>
                                    <td className="px-6 py-4 font-medium text-brand-dark">{item.name}</td>
                                    <td className="px-6 py-4">{formatNumber(item.opening)}</td>
                                    <td className="px-6 py-4 text-red-600">{formatNumber(item.debit)}</td>
                                    <td className="px-6 py-4 text-green-600">{formatNumber(item.credit)}</td>
                                    <td className={`px-6 py-4 font-bold ${item.balance < 0 ? 'text-red-600' : ''}`}>{formatNumber(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-brand-blue text-white">
                            <tr className="font-bold">
                                <td colSpan={2} className="px-6 py-3 text-right">الإجمالي</td>
                                <td className="px-6 py-3 text-right">{formatNumber(totals.opening)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(totals.debit)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(totals.credit)}</td>
                                <td className={`px-6 py-3 text-right ${totals.balance < 0 ? 'text-red-300' : ''}`}>{formatNumber(totals.balance)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TotalCurrentAccountsReport;