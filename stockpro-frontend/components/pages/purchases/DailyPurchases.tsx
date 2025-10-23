import React, { useState, useMemo } from 'react';
import type { CompanyInfo, Invoice } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../icons';
import { exportToExcel, exportToPdf } from '../../../utils/formatting';

interface DailyPurchasesProps {
  title: string;
  companyInfo: CompanyInfo;
  purchaseInvoices: Invoice[];
}

const InvoiceHeader: React.FC<{ companyInfo: CompanyInfo }> = ({ companyInfo }) => (
    <div className="flex justify-between items-start p-4 bg-white">
        <div className="flex items-center gap-4">
            {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-20 w-auto object-contain" />}
            <div>
                <h2 className="text-2xl font-bold text-brand-dark">{companyInfo.name}</h2>
                <p className="text-sm text-gray-600">{companyInfo.address}</p>
                <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
            </div>
        </div>
        <div className="text-left text-sm">
            <p><span className="font-semibold">الرقم الضريبي:</span> {companyInfo.taxNumber}</p>
            <p><span className="font-semibold">السجل التجاري:</span> {companyInfo.commercialReg}</p>
        </div>
    </div>
);

const DailyPurchases: React.FC<DailyPurchasesProps> = ({ title, companyInfo, purchaseInvoices }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 7) + '-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPurchases = useMemo(() => {
        return purchaseInvoices.filter(purchase =>
            purchase.date >= startDate &&
            purchase.date <= endDate &&
            (purchase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (purchase.customerOrSupplier && purchase.customerOrSupplier.name.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [purchaseInvoices, startDate, endDate, searchTerm]);

    const totals = filteredPurchases.reduce((acc, purchase) => {
        acc.subtotal += purchase.totals.subtotal;
        acc.tax += purchase.totals.tax;
        acc.discount += purchase.totals.discount;
        acc.net += purchase.totals.net;
        return acc;
    }, { subtotal: 0, tax: 0, discount: 0, net: 0 });

    const handleExcelExport = () => {
        const dataToExport = filteredPurchases.map(p => ({
            'التاريخ': p.date,
            'رقم الفاتورة': p.id,
            'المورد': p.customerOrSupplier?.name || '-',
            'المبلغ': p.totals.subtotal.toFixed(2),
            'الضريبة': p.totals.tax.toFixed(2),
            'الخصم': p.totals.discount.toFixed(2),
            'صافي المبلغ': p.totals.net.toFixed(2),
        }));
        dataToExport.push({
            'التاريخ': 'الإجمالي',
            'رقم الفاتورة': '',
            'المورد': '',
            'المبلغ': totals.subtotal.toFixed(2),
            'الضريبة': totals.tax.toFixed(2),
            'الخصم': totals.discount.toFixed(2),
            'صافي المبلغ': totals.net.toFixed(2),
        });
        exportToExcel(dataToExport, title);
    };

    const handlePdfExport = () => {
        const head = [['صافي المبلغ', 'الخصم', 'الضريبة', 'المبلغ', 'المورد', 'رقم الفاتورة', 'التاريخ', 'م']];
        const body = filteredPurchases.map((p, i) => [
            p.totals.net.toFixed(2),
            p.totals.discount.toFixed(2),
            p.totals.tax.toFixed(2),
            p.totals.subtotal.toFixed(2),
            p.customerOrSupplier?.name || '-',
            p.id,
            p.date,
            (i + 1).toString(),
        ]);
        const footer = [[
            totals.net.toFixed(2),
            totals.discount.toFixed(2),
            totals.tax.toFixed(2),
            totals.subtotal.toFixed(2),
            '',
            '',
            '',
            'الإجمالي',
        ]];
        
        exportToPdf(title, head, body, title, companyInfo, footer);
    };

    const inputStyle = "p-2 bg-brand-green-bg border-2 border-brand-green rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green";

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="border-2 border-brand-green rounded-lg mb-4">
                <InvoiceHeader companyInfo={companyInfo} />
            </div>

            <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

            <div className="flex justify-between items-center mb-4 no-print bg-gray-50 p-3 rounded-md border-2">
                 <div className="flex items-center gap-4 flex-wrap">
                    <label className="font-semibold">من:</label>
                    <input type="date" className={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <label className="font-semibold">إلى:</label>
                    <input type="date" className={inputStyle} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            className={inputStyle + " pr-10 w-48"}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={handleExcelExport} title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                        <ExcelIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handlePdfExport} title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                        <PdfIcon className="w-6 h-6" />
                    </button>
                    <button title="طباعة" onClick={() => window.print()} className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                        <PrintIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border-2 border-brand-green rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-brand-green">
                        <tr>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">م</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">التاريخ</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">رقم الفاتورة</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">المورد</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">المبلغ</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الضريبة</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الخصم</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">صافي المبلغ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPurchases.map((purchase, index) => (
                            <tr key={purchase.id} className="hover:bg-brand-green-bg">
                                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{purchase.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{purchase.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{purchase.customerOrSupplier?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{purchase.totals.subtotal.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{purchase.totals.tax.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{purchase.totals.discount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold">{purchase.totals.net.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr className="font-bold text-brand-dark">
                            <td colSpan={4} className="px-6 py-3 text-right">الإجمالي</td>
                            <td className="px-6 py-3 text-right">{totals.subtotal.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">{totals.tax.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">{totals.discount.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">{totals.net.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DailyPurchases;