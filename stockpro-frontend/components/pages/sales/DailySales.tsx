import React, { useState, useMemo } from 'react';
import type { CompanyInfo, Invoice } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../icons';
import { exportToExcel, exportToPdf } from '../../../utils/formatting';

interface DailySalesProps {
  title: string;
  companyInfo: CompanyInfo;
  salesInvoices: Invoice[];
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


const DailySales: React.FC<DailySalesProps> = ({ title, companyInfo, salesInvoices }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 7) + '-01'); // Start of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10)); // Today
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSales = useMemo(() => {
        return salesInvoices.filter(sale =>
            sale.date >= startDate &&
            sale.date <= endDate &&
            (sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sale.customerOrSupplier && sale.customerOrSupplier.name.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [salesInvoices, startDate, endDate, searchTerm]);

    const totals = filteredSales.reduce((acc, sale) => {
        acc.subtotal += sale.totals.subtotal;
        acc.tax += sale.totals.tax;
        acc.discount += sale.totals.discount;
        acc.net += sale.totals.net;
        return acc;
    }, { subtotal: 0, tax: 0, discount: 0, net: 0 });

    const handleExcelExport = () => {
        const dataToExport = filteredSales.map(s => ({
            'التاريخ': s.date,
            'رقم الفاتورة': s.id,
            'العميل': s.customerOrSupplier?.name || 'عميل نقدي',
            'المبلغ': s.totals.subtotal.toFixed(2),
            'الضريبة': s.totals.tax.toFixed(2),
            'الخصم': s.totals.discount.toFixed(2),
            'صافي المبلغ': s.totals.net.toFixed(2),
        }));
        dataToExport.push({
            'التاريخ': 'الإجمالي',
            'رقم الفاتورة': '',
            'العميل': '',
            'المبلغ': totals.subtotal.toFixed(2),
            'الضريبة': totals.tax.toFixed(2),
            'الخصم': totals.discount.toFixed(2),
            'صافي المبلغ': totals.net.toFixed(2),
        });
        exportToExcel(dataToExport, title);
    };

    const handlePdfExport = () => {
        const head = [['صافي المبلغ', 'الخصم', 'الضريبة', 'المبلغ', 'العميل', 'رقم الفاتورة', 'التاريخ', 'م']];
        const body = filteredSales.map((s, i) => [
            s.totals.net.toFixed(2),
            s.totals.discount.toFixed(2),
            s.totals.tax.toFixed(2),
            s.totals.subtotal.toFixed(2),
            s.customerOrSupplier?.name || 'عميل نقدي',
            s.id,
            s.date,
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

    const inputStyle = "p-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="border-2 border-brand-blue rounded-lg mb-4">
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

            <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-brand-blue">
                        <tr>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">م</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">التاريخ</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">رقم الفاتورة</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">العميل</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">المبلغ</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الضريبة</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الخصم</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">صافي المبلغ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSales.map((sale, index) => (
                            <tr key={sale.id} className="hover:bg-brand-blue-bg">
                                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{sale.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{sale.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{sale.customerOrSupplier?.name || 'عميل نقدي'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{sale.totals.subtotal.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{sale.totals.tax.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{sale.totals.discount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold">{sale.totals.net.toFixed(2)}</td>
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

export default DailySales;