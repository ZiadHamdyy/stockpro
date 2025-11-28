
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

    const handlePrint = () => {
        const printContents = document.getElementById('printable-quotation')?.innerHTML;
        if (printContents) {
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write('<html><head><title>طباعة عرض سعر</title>');
            printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
             printWindow?.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">');
            printWindow?.document.write('<style>body { font-family: "Cairo", sans-serif; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } @page { size: A4; margin: 0; } </style>');
            printWindow?.document.write('</head><body dir="rtl">');
            printWindow?.document.write(printContents);
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
                    <div id="printable-quotation" className="p-10 bg-white relative min-h-[297mm]">
                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                            <h1 className="text-[150px] font-bold -rotate-45 text-gray-400">عرض سعر</h1>
                        </div>

                        <header className="flex justify-between items-start pb-6 border-b-4 border-amber-500 mb-8">
                             <div className="flex items-center gap-4">
                                {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-24 w-auto object-contain" />}
                                <div>
                                    <h2 className="text-3xl font-bold text-black">{companyInfo.name}</h2>
                                    <p className="text-sm text-gray-600 mt-1">{companyInfo.address}</p>
                                    <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <h1 className="text-4xl font-bold text-amber-600">عرض أسعار</h1>
                                <p className="text-xl font-semibold text-gray-500 tracking-widest uppercase">Price Quotation</p>
                            </div>
                        </header>

                        <section className="flex justify-between mb-8">
                            <div className="w-1/2 pr-4">
                                <h3 className="font-bold text-amber-700 text-lg mb-2 border-b border-amber-200 inline-block pb-1">مقدم إلى:</h3>
                                <p className="text-xl font-bold mb-1">{customer?.name || 'عميل نقدي'}</p>
                                <p className="text-gray-600 text-sm">عناية السيد/ مدير المشتريات</p>
                            </div>
                            <div className="w-1/3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-600">رقم العرض:</span>
                                    <span className="font-mono font-bold">{details.id}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-600">تاريخ العرض:</span>
                                    <span className="font-mono">{details.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-600">صالح حتى:</span>
                                    <span className="font-mono text-red-600">{details.expiryDate}</span>
                                </div>
                            </div>
                        </section>
                        
                        <table className="w-full text-sm mb-8">
                            <thead className="bg-amber-600 text-white">
                                <tr>
                                    <th className="p-3 text-right rounded-tr-lg">#</th>
                                    <th className="p-3 text-right w-1/2">وصف الصنف / الخدمة</th>
                                    <th className="p-3 text-center">الكمية</th>
                                    <th className="p-3 text-center">الوحدة</th>
                                    <th className="p-3 text-center">السعر الإفرادي</th>
                                    <th className="p-3 text-center rounded-tl-lg">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                               {items.map((item, index) => (
                                   <tr key={index} className="odd:bg-white even:bg-gray-50">
                                       <td className="p-3 text-center font-mono text-gray-500">{index + 1}</td>
                                       <td className="p-3 font-semibold">{item.name}</td>
                                       <td className="p-3 text-center font-mono">{item.qty}</td>
                                       <td className="p-3 text-center text-gray-500">{item.unit}</td>
                                       <td className="p-3 text-center font-mono">{item.price.toFixed(2)}</td>
                                       <td className="p-3 text-center font-mono font-bold">{item.total.toFixed(2)}</td>
                                   </tr>
                               ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end mb-8">
                            <div className="w-1/3">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-semibold text-gray-600">المجموع الفرعي</span>
                                    <span className="font-mono font-bold">{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="font-semibold text-gray-600">الخصم</span>
                                    <span className="font-mono">{totals.discount.toFixed(2)}</span>
                                </div>
                                {isVatEnabled && (
                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                        <span className="font-semibold text-gray-600">الضريبة ({vatRate}%)</span>
                                        <span className="font-mono">{totals.tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-3 bg-amber-600 text-white rounded-md px-2 mt-2 shadow-lg">
                                    <span className="font-bold text-lg">الإجمالي النهائي</span>
                                    <span className="font-mono font-bold text-lg">{totals.net.toFixed(2)} {companyInfo.currency}</span>
                                </div>
                                <p className="text-xs text-center mt-2 text-gray-500">{tafqeet(totals.net, companyInfo.currency)}</p>
                            </div>
                        </div>

                        <div className="border-t-2 border-gray-200 pt-4 mb-8">
                            <h4 className="font-bold text-amber-700 mb-2">الشروط والأحكام:</h4>
                            <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-4 rounded border border-gray-200">
                                <p>1. {details.notes}</p>
                                <p>2. الأسعار أعلاه تشمل ضريبة القيمة المضافة (إن وجدت).</p>
                                <p>3. التوصيل خلال 3-5 أيام عمل من تاريخ تعميد العرض.</p>
                                <p>4. الدفع: 50% مقدم و 50% عند الاستلام.</p>
                            </div>
                        </div>

                        <footer className="flex justify-between items-end mt-auto pt-8 border-t border-gray-300">
                            <div className="text-center">
                                <p className="font-bold mb-8">إعداد المبيعات</p>
                                <p className="font-semibold border-t border-black pt-1 w-40 inline-block">{details.userName}</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold mb-8">اعتماد الإدارة</p>
                                <p className="border-t border-black pt-1 w-40 inline-block">....................</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationPrintPreview;