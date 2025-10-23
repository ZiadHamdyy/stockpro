
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// FIX: Add Store to type imports
import type { CompanyInfo, Branch, User, Item, Invoice, StoreReceiptVoucher, StoreIssueVoucher, StoreTransferVoucher, Store } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';

interface ItemBalanceReportProps {
  title: string;
  companyInfo: CompanyInfo;
  items: Item[];
  branches: Branch[];
  currentUser: User | null;
  salesInvoices: Invoice[];
  salesReturns: Invoice[];
  purchaseInvoices: Invoice[];
  purchaseReturns: Invoice[];
  storeReceiptVouchers: StoreReceiptVoucher[];
  storeIssueVouchers: StoreIssueVoucher[];
  storeTransferVouchers: StoreTransferVoucher[];
  // FIX: Add stores to props to resolve 'Cannot find name' error
  stores: Store[];
}

const ItemBalanceReport: React.FC<ItemBalanceReportProps> = ({ 
    title, companyInfo, items, branches, currentUser,
    salesInvoices, salesReturns, purchaseInvoices, purchaseReturns,
    storeReceiptVouchers, storeIssueVouchers, storeTransferVouchers,
    // FIX: Destructure stores from props
    stores
}) => {
    const [reportData, setReportData] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('all');
    
    const handleViewReport = useCallback(() => {
        const balanceData = items.map(item => {
            let balance = item.stock; // Opening balance

            const filterByBranch = (tx: any) => selectedBranch === 'all' || tx.branch === selectedBranch || tx.branchName === selectedBranch;

            purchaseInvoices.filter(filterByBranch).forEach(inv => inv.items.forEach(i => { if (i.id === item.code) balance += i.qty; }));
            salesReturns.filter(filterByBranch).forEach(inv => inv.items.forEach(i => { if (i.id === item.code) balance += i.qty; }));
            storeReceiptVouchers.filter(filterByBranch).forEach(v => v.items.forEach(i => { if (i.id === item.code) balance += i.qty; }));
            
            salesInvoices.filter(filterByBranch).forEach(inv => inv.items.forEach(i => { if (i.id === item.code) balance -= i.qty; }));
            purchaseReturns.filter(filterByBranch).forEach(inv => inv.items.forEach(i => { if (i.id === item.code) balance -= i.qty; }));
            storeIssueVouchers.filter(filterByBranch).forEach(v => v.items.forEach(i => { if (i.id === item.code) balance -= i.qty; }));
            
            // Store transfers are neutral for total inventory but matter for branch-specific inventory
            if (selectedBranch !== 'all') {
                storeTransferVouchers.forEach(v => {
                    const fromStore = stores.find(s => s.name === v.fromStore);
                    const toStore = stores.find(s => s.name === v.toStore);
                    v.items.forEach(i => {
                        if (i.id === item.code) {
                            if (fromStore?.branch === selectedBranch) balance -= i.qty;
                            if (toStore?.branch === selectedBranch) balance += i.qty;
                        }
                    });
                });
            }

            return {
                ...item,
                balance: balance
            };
        });
        setReportData(balanceData);
        // FIX: Add stores to dependency array
    }, [items, selectedBranch, salesInvoices, salesReturns, purchaseInvoices, purchaseReturns, storeReceiptVouchers, storeIssueVouchers, storeTransferVouchers, stores]);

    useEffect(() => {
        handleViewReport();
    }, [handleViewReport]);


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
                        <label className="font-semibold">الفرع:</label>
                        <select 
                            className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                            <option value="all">جميع الفروع</option>
                            {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                        </select>
                        <button onClick={handleViewReport} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
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
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">كود الصنف</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">اسم الصنف</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">الوحدة</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">الرصيد الحالي</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.map((item) => (
                                <tr key={item.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4">{item.code}</td>
                                    <td className="px-6 py-4 font-medium text-brand-dark">{item.name}</td>
                                    <td className="px-6 py-4">{item.unit}</td>
                                    <td className="px-6 py-4 font-bold">{formatNumber(item.balance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ItemBalanceReport;
