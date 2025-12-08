
import React, { useState, useMemo } from 'react';
import type { Item, Invoice, StoreIssueVoucher } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, AlertTriangleIcon } from '../../../icons';
import PermissionWrapper from '../../../common/PermissionWrapper';
import ReportHeader from '../ReportHeader';
import { formatNumber, exportToExcel } from '../../../../utils/formatting';
import {
    Actions,
    Resources,
    buildPermission,
} from '../../../../enums/permissions.enum';
import { useGetItemsQuery } from '../../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetStoreIssueVouchersQuery } from '../../../store/slices/storeIssueVoucher/storeIssueVoucherApi';

interface StagnantItemsReportProps {
    title: string;
}

const StagnantItemsReport: React.FC<StagnantItemsReportProps> = ({ title }) => {
    const [thresholdDays, setThresholdDays] = useState(90);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch data from Redux
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiStoreIssueVouchers = [], isLoading: vouchersLoading } = useGetStoreIssueVouchersQuery();

    const isLoading = itemsLoading || salesLoading || vouchersLoading;

    // Transform API data to match component expectations
    const items = useMemo<Item[]>(() => {
        return apiItems.map((item) => ({
            id: parseInt(item.id) || 0,
            code: item.code,
            name: item.name,
            group: item.group?.name || '',
            unit: item.unit?.name || '',
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
            stock: item.stock,
            reorderLimit: item.reorderLimit
        }));
    }, [apiItems]);

    const salesInvoices = useMemo<Invoice[]>(() => {
        return apiSalesInvoices.map((inv) => ({
            id: inv.id,
            date: inv.date,
            customerOrSupplier: inv.customer ? {
                id: inv.customer.id,
                name: inv.customer.name
            } : null,
            items: inv.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price: item.price,
                taxAmount: item.taxAmount ?? 0,
                total: item.total ?? (item.qty * item.price)
            })),
            totals: {
                subtotal: inv.subtotal,
                discount: inv.discount,
                tax: inv.tax,
                net: inv.net
            },
            paymentMethod: inv.paymentMethod,
            paymentTargetType: inv.paymentTargetType,
            paymentTargetId: inv.paymentTargetId ? parseInt(inv.paymentTargetId) : null,
            userName: inv.user?.name || '',
            branchName: inv.branch?.name || ''
        }));
    }, [apiSalesInvoices]);

    const storeIssueVouchers = useMemo<StoreIssueVoucher[]>(() => {
        return apiStoreIssueVouchers.map((v) => ({
            id: v.voucherNumber || v.id,
            date: v.date,
            branch: v.store?.branch?.name || '',
            items: v.items.map((item) => ({
                id: item.item?.code || item.itemId,
                name: item.item?.name || '',
                unit: item.item?.unit?.name || '',
                qty: item.quantity,
                code: item.item?.code || item.itemId,
                price: item.unitPrice
            }))
        }));
    }, [apiStoreIssueVouchers]);

    const reportData = useMemo(() => {
        const today = new Date();

        return items.map(item => {
            // Find last transaction date (Sales or Issues)
            let lastDateStr = '2000-01-01'; // Default old date

            // Check Sales
            salesInvoices.forEach(inv => {
                if (inv.items?.some(i => i.id === item.code)) {
                    if (inv.date && inv.date > lastDateStr) lastDateStr = inv.date;
                }
            });

            // Check Issues
            storeIssueVouchers.forEach(v => {
                if (v.items?.some(i => i.id === item.code)) {
                    if (v.date && v.date > lastDateStr) lastDateStr = v.date;
                }
            });

            const lastDate = new Date(lastDateStr);
            // If default date remains, it means never sold. Use created date? Assume 365 days.
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const daysSinceLastMove = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const isNeverMoved = lastDateStr === '2000-01-01';
            
            const stockValue = (item.stock ?? 0) * (item.purchasePrice ?? 0);

            return {
                ...item,
                lastMovementDate: isNeverMoved ? 'لم يتحرك أبداً' : lastDateStr,
                daysDormant: isNeverMoved ? 999 : daysSinceLastMove,
                stockValue
            };
        }).filter(item => 
            (item.stock ?? 0) > 0 && // Only items with stock
            item.daysDormant >= thresholdDays && 
            ((item.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => b.daysDormant - a.daysDormant);

    }, [items, salesInvoices, storeIssueVouchers, thresholdDays, searchTerm]);

    const totalStagnantValue = reportData.reduce((sum, item) => sum + item.stockValue, 0);

    const handlePrint = () => window.print();

    const handleExcelExport = () => {
        const data = reportData.map(item => ({
            'الكود': item.code,
            'الصنف': item.name,
            'الرصيد الحالي': item.stock,
            'قيمة المخزون': item.stockValue,
            'آخر حركة': item.lastMovementDate,
            'أيام الركود': item.daysDormant === 999 ? 'لم يتحرك' : item.daysDormant
        }));
        exportToExcel(data, 'تحليل_المخزون_الراكد');
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
                        <p className="text-gray-600">جاري تحميل البيانات...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div id="printable-area">
                <ReportHeader title={title} />
                
                <div className="flex justify-between items-center my-6 bg-gray-50 p-4 rounded-lg border border-gray-200 no-print">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative">
                            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="بحث عن صنف..." 
                                className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none w-64"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                            <label className="font-bold text-sm text-red-800">عرض الأصناف الراكدة منذ (أيام):</label>
                            <input 
                                type="number" 
                                className="p-1 border border-red-300 rounded-md w-20 text-center font-bold focus:ring-red-500" 
                                value={thresholdDays} 
                                onChange={e => setThresholdDays(parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.STAGNANT_ITEMS_REPORT,
                                Actions.PRINT,
                            )}
                            fallback={
                                <>
                                    <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><ExcelIcon/></button>
                                    <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><PrintIcon/></button>
                                </>
                            }
                        >
                            <button onClick={handleExcelExport} className="p-2 border rounded hover:bg-gray-100 text-green-700"><ExcelIcon/></button>
                            <button onClick={handlePrint} className="p-2 border rounded hover:bg-gray-100 text-gray-700"><PrintIcon/></button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* Alert Banner */}
                <div className="bg-red-100 border-l-8 border-red-600 p-4 mb-6 rounded-r-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangleIcon className="w-10 h-10 text-red-600" />
                        <div>
                            <h3 className="text-lg font-bold text-red-900">قيمة المخزون المجمد (Dead Capital)</h3>
                            <p className="text-red-700 text-sm">إجمالي تكلفة الأصناف التي لم تتحرك منذ {thresholdDays} يوم</p>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-red-800 tracking-tight">{formatNumber(totalStagnantValue)} <span className="text-sm text-red-600 font-medium">SAR</span></p>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm text-center">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="p-3 text-right">الكود</th>
                                <th className="p-3 text-right">الصنف</th>
                                <th className="p-3">الرصيد الحالي</th>
                                <th className="p-3">قيمة المخزون (تكلفة)</th>
                                <th className="p-3">تاريخ آخر حركة</th>
                                <th className="p-3 bg-red-700">أيام الركود</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map(item => (
                                <tr key={item.id} className="hover:bg-red-50/30">
                                    <td className="p-3 text-gray-600 text-right">{item.code}</td>
                                    <td className="p-3 font-bold text-gray-800 text-right">{item.name}</td>
                                    <td className="p-3 font-bold">{item.stock}</td>
                                    <td className="p-3 text-gray-600">{formatNumber(item.stockValue)}</td>
                                    <td className="p-3 text-gray-500">{item.lastMovementDate}</td>
                                    <td className="p-3 align-middle">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.daysDormant >= 180 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}>
                                            {item.daysDormant === 999 ? 'لم يتحرك' : `${item.daysDormant} يوم`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        ممتاز! لا توجد أصناف راكدة تتجاوز المدة المحددة.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StagnantItemsReport;
