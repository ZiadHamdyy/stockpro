
import React, { useState, useMemo } from 'react';
import type { Item, Invoice } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, TrendingUpIcon } from '../../../icons';
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
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';

interface ItemProfitabilityReportProps {
    title: string;
}

const ItemProfitabilityReport: React.FC<ItemProfitabilityReportProps> = ({ title }) => {
    const [startDate, setStartDate] = useState(new Date().getFullYear() + '-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch data from Redux
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiSalesReturns = [], isLoading: returnsLoading } = useGetSalesReturnsQuery();

    const isLoading = itemsLoading || salesLoading || returnsLoading;

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

    const salesReturns = useMemo<Invoice[]>(() => {
        return apiSalesReturns.map((ret) => ({
            id: ret.id,
            date: ret.date,
            customerOrSupplier: ret.customer ? {
                id: ret.customer.id,
                name: ret.customer.name
            } : null,
            items: ret.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price: item.price,
                taxAmount: item.taxAmount ?? 0,
                total: item.total ?? (item.qty * item.price)
            })),
            totals: {
                subtotal: ret.subtotal,
                discount: ret.discount,
                tax: ret.tax,
                net: ret.net
            },
            paymentMethod: ret.paymentMethod,
            paymentTargetType: ret.paymentTargetType,
            paymentTargetId: ret.paymentTargetId ? parseInt(ret.paymentTargetId) : null,
            userName: ret.user?.name || '',
            branchName: ret.branch?.name || ''
        }));
    }, [apiSalesReturns]);

    const reportData = useMemo(() => {
        return items.map(item => {
            // Sales
            const itemSales = salesInvoices
                .filter(inv => {
                    if (!inv?.date) return false;
                    return inv.date >= startDate && inv.date <= endDate;
                })
                .reduce((acc, inv) => {
                    const invItem = inv.items?.find(i => i.id === item.code);
                    if (invItem) {
                        return {
                            qty: acc.qty + (invItem.qty ?? 0),
                            revenue: acc.revenue + (invItem.total ?? 0) // Using line total before tax
                        };
                    }
                    return acc;
                }, { qty: 0, revenue: 0 });

            // Returns
            const itemReturns = salesReturns
                .filter(inv => {
                    if (!inv?.date) return false;
                    return inv.date >= startDate && inv.date <= endDate;
                })
                .reduce((acc, inv) => {
                    const invItem = inv.items?.find(i => i.id === item.code);
                    if (invItem) {
                        return {
                            qty: acc.qty + (invItem.qty ?? 0),
                            value: acc.value + (invItem.total ?? 0)
                        };
                    }
                    return acc;
                }, { qty: 0, value: 0 });

            const netQty = itemSales.qty - itemReturns.qty;
            const netRevenue = itemSales.revenue - itemReturns.value;
            
            // COGS (Simplified)
            const cogs = netQty * (item.purchasePrice ?? 0);
            
            const grossProfit = netRevenue - cogs;
            const marginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

            return {
                ...item,
                netQty,
                netRevenue,
                cogs,
                grossProfit,
                marginPercent
            };
        }).filter(item => 
            (item.netQty !== 0) && 
            ((item.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
        ).sort((a, b) => b.grossProfit - a.grossProfit); // Sort by profit descending
    }, [items, salesInvoices, salesReturns, startDate, endDate, searchTerm]);

    const handlePrint = () => {
        window.print();
    };

    const handleExcelExport = () => {
        const data = reportData.map(item => ({
            'الكود': item.code,
            'الصنف': item.name,
            'الكمية المباعة': item.netQty,
            'صافي المبيعات': item.netRevenue,
            'التكلفة': item.cogs,
            'مجمل الربح': item.grossProfit,
            'الهامش %': item.marginPercent.toFixed(2) + '%'
        }));
        exportToExcel(data, 'تحليل_ربحية_الأصناف');
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
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-sm text-gray-700">من:</label>
                            <input type="date" className="p-2 border border-gray-300 rounded-lg text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-sm text-gray-700">إلى:</label>
                            <input type="date" className="p-2 border border-gray-300 rounded-lg text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.ITEM_PROFITABILITY_REPORT,
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

                {/* Top Performers Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
                        <h3 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
                            <div className="p-1 bg-emerald-200 rounded-full"><TrendingUpIcon className="w-4 h-4 text-emerald-800"/></div>
                            الأعلى ربحية (Top 3)
                        </h3>
                        {reportData.slice(0, 3).map((item, idx) => (
                            <div key={item.id} className="flex justify-between text-sm mb-2 border-b border-emerald-100 pb-1 last:border-0 last:pb-0 last:mb-0">
                                <span className="font-medium text-emerald-900">{idx+1}. {item.name}</span>
                                <span className="font-bold text-emerald-700">{formatNumber(item.grossProfit)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm flex flex-col justify-center">
                        <h3 className="text-blue-800 font-bold mb-1">إجمالي المبيعات (للفترة)</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2 tracking-tight">
                            {formatNumber(reportData.reduce((sum, i) => sum + i.netRevenue, 0))}
                        </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm flex flex-col justify-center">
                        <h3 className="text-indigo-800 font-bold mb-1">إجمالي الربح (للفترة)</h3>
                        <p className="text-3xl font-bold text-indigo-600 mt-2 tracking-tight">
                            {formatNumber(reportData.reduce((sum, i) => sum + i.grossProfit, 0))}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="p-3 text-right">الكود</th>
                                <th className="p-3 text-right">الصنف</th>
                                <th className="p-3 text-center">الكمية المباعة</th>
                                <th className="p-3 text-center">صافي المبيعات</th>
                                <th className="p-3 text-center">التكلفة التقديرية</th>
                                <th className="p-3 text-center">مجمل الربح</th>
                                <th className="p-3 text-center w-32">الهامش %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-gray-600">{item.code}</td>
                                    <td className="p-3 font-bold text-gray-800">{item.name}</td>
                                    <td className="p-3 text-center">{item.netQty}</td>
                                    <td className="p-3 text-center font-medium text-blue-600">{formatNumber(item.netRevenue)}</td>
                                    <td className="p-3 text-center text-gray-500">{formatNumber(item.cogs)}</td>
                                    <td className={`p-3 text-center font-bold ${item.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatNumber(item.grossProfit)}
                                    </td>
                                    <td className="p-3 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold w-10 text-right">{item.marginPercent.toFixed(1)}%</span>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${item.marginPercent > 30 ? 'bg-emerald-500' : item.marginPercent > 10 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, item.marginPercent))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ItemProfitabilityReport;
