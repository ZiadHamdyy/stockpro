
import React from 'react';
import type { CompanyInfo, InvoiceItem } from '../../../types';
import { tafqeet } from '../../../utils/tafqeet';
import { PrintIcon, XIcon } from '../../icons';

interface QuotationPrintPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    quotationData: {
        companyInfo: CompanyInfo;
        items: InvoiceItem[];
        totals: { subtotal: number; discount: number; tax: number; net: number };
        customer: { id: string; name: string } | null;
        details: { id: string; date: string; expiryDate: string; notes: string; userName: string; };
        isVatEnabled: boolean;
        vatRate: number;
    };
}

const QuotationPrintPreview: React.FC<QuotationPrintPreviewProps> = ({ isOpen, onClose, quotationData }) => {
    if (!isOpen) return null;

    const { companyInfo, items, totals, customer, details, isVatEnabled, vatRate } = quotationData;

    // Determine if we should display VAT columns/rows:
    // - VAT must be enabled on the company info
    // - And there must be tax values on the quotation (totals or per item)
    const hasTaxData = totals.tax > 0 || items.some((item) => (item.taxAmount || 0) > 0);
    const shouldDisplayTaxColumn = companyInfo.isVatEnabled && hasTaxData;

    const handlePrint = () => {
        const printContents = document.getElementById('printable-quotation')?.innerHTML;
        if (printContents) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>طباعة عرض سعر</title>');
            printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow?.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
            printWindow?.document.write(`
              <style>
                body {
                  font-family: "Cairo", sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  direction: rtl;
                  margin: 0;
                  background: #fff;
                }
                @page {
                  size: A4;
                  margin: 0;
                }
              </style>
            `);
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(`<div style="margin:0 auto;max-width:23cm;padding:0.6cm;">${printContents}</div>`);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => {
                printWindow?.print();
                printWindow?.close();
            }, 250);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center print:hidden bg-amber-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-amber-800">معاينة طباعة عرض السعر</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={handlePrint} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-semibold flex items-center">
                            <PrintIcon className="ml-2 w-5 h-5"/> طباعة
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-brand-dark p-2 rounded-full hover:bg-gray-200">
                            <XIcon />
                        </button>
                    </div>
                </div>
                
                <div className="overflow-y-auto">
                    <div id="printable-quotation" className="p-8 bg-white">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                            <h1 className="text-[150px] font-bold -rotate-45 text-gray-400">عرض سعر</h1>
                        </div>

                        <header className="flex justify-between items-start pb-4 border-b-2 border-amber-500">
                            <div className="flex items-center gap-4">
                                {companyInfo.logo && (
                                    <img
                                        src={companyInfo.logo}
                                        alt="Company Logo"
                                        className="h-20 w-auto object-contain"
                                    />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold text-black">{companyInfo.name}</h2>
                                    <p className="text-sm text-gray-600">{companyInfo.address}</p>
                                    <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl font-bold text-amber-600">عرض أسعار</h1>
                                <p className="text-sm font-semibold text-gray-500 tracking-widest uppercase">
                                    Price Quotation
                                </p>
                            </div>
                        </header>

                        <section className="grid grid-cols-2 gap-x-8 text-sm my-6">
                            <div className="border border-gray-300 rounded-md p-3">
                                <h3 className="font-bold text-base mb-2 text-amber-700">مقدم إلى:</h3>
                                <p className="text-lg font-bold mb-1">{customer?.name || 'عميل نقدي'}</p>
                                <p className="text-gray-600 text-sm">عناية السيد/ مدير المشتريات</p>
                            </div>
                            <div className="border border-gray-300 rounded-md p-3">
                                <p>
                                    <span className="font-semibold">رقم العرض:</span>{' '}
                                    <span className="font-mono font-bold">{details.id}</span>
                                </p>
                                <p>
                                    <span className="font-semibold">تاريخ العرض:</span>{' '}
                                    <span className="font-mono">{details.date}</span>
                                </p>
                                <p>
                                    <span className="font-semibold">صالح حتى:</span>{' '}
                                    <span className="font-mono text-red-600">{details.expiryDate}</span>
                                </p>
                            </div>
                        </section>

                        <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
                            <thead className="bg-amber-600 text-white">
                                <tr>
                                    <th className="p-2 border border-amber-500">م</th>
                                    <th
                                        className="p-2 border border-amber-500 text-right"
                                        style={{ width: '40%' }}
                                    >
                                        وصف الصنف / الخدمة
                                    </th>
                                    <th className="p-2 border border-amber-500">الوحدة</th>
                                    <th className="p-2 border border-amber-500">الكمية</th>
                                    <th className="p-2 border border-amber-500">السعر الإفرادي</th>
                                    {shouldDisplayTaxColumn && (
                                        <th className="p-2 border border-amber-500">
                                            الضريبة ({companyInfo.vatRate || vatRate}%)
                                        </th>
                                    )}
                                    <th className="p-2 border border-amber-500">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="p-2 border border-gray-300 text-center font-mono text-gray-600">
                                            {index + 1}
                                        </td>
                                        <td
                                            className="p-2 border border-gray-300 font-semibold"
                                            style={{ width: '40%' }}
                                        >
                                            {item.name}
                                        </td>
                                        <td className="p-2 border border-gray-300 text-center text-gray-600">
                                            {item.unit}
                                        </td>
                                        <td className="p-2 border border-gray-300 text-center font-mono">
                                            {item.qty}
                                        </td>
                                        <td className="p-2 border border-gray-300 text-center font-mono">
                                            {item.price.toFixed(2)}
                                        </td>
                                        {shouldDisplayTaxColumn && (
                                            <td className="p-2 border border-gray-300 text-center font-mono">
                                                {(item.taxAmount || 0).toFixed(2)}
                                            </td>
                                        )}
                                        <td className="p-2 border border-gray-300 text-center font-mono font-bold">
                                            {item.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-6">
                            <div className="w-1/3 text-sm">
                                <table className="w-full border-collapse border border-gray-300">
                                    <tbody>
                                        <tr>
                                            <td className="font-semibold p-2 border border-gray-300">
                                                المجموع الفرعي
                                            </td>
                                            <td className="p-2 border border-gray-300 text-left font-mono font-bold">
                                                {totals.subtotal.toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="font-semibold p-2 border border-gray-300">الخصم</td>
                                            <td className="p-2 border border-gray-300 text-left font-mono">
                                                {totals.discount.toFixed(2)}
                                            </td>
                                        </tr>
                                        {shouldDisplayTaxColumn && (
                                            <tr>
                                                <td className="font-semibold p-2 border border-gray-300">
                                                    الضريبة ({vatRate}%)
                                                </td>
                                                <td className="p-2 border border-gray-300 text-left font-mono">
                                                    {totals.tax.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="bg-amber-600 text-white font-bold text-base">
                                            <td className="p-2 border border-amber-500">الإجمالي النهائي</td>
                                            <td className="p-2 border border-amber-500 text-left font-mono">
                                                {totals.net.toFixed(2)} {companyInfo.currency}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 text-center text-xs font-semibold text-gray-700 rounded-md">
                                    {tafqeet(totals.net, companyInfo.currency)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 text-sm text-gray-700 border-t-2 border-dashed border-gray-300">
                            <h4 className="font-bold text-amber-700 mb-2">الشروط والأحكام:</h4>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-1">
                                <p>{details.notes}</p>
                            </div>
                        </div>

                        <footer className="flex justify-between items-end mt-8 pt-6 border-t border-gray-300 text-sm">
                            <div className="text-center">
                                <p className="font-bold mb-6">إعداد المبيعات</p>
                                <p className="font-semibold border-t border-black pt-1 w-40 inline-block">
                                    {details.userName}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold mb-6">اعتماد الإدارة</p>
                                <p className="border-t border-black pt-1 w-40 inline-block">
                                    ....................
                                </p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPrintPreview;