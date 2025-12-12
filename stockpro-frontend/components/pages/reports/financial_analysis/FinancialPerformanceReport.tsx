
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Invoice, Voucher } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon } from '../../../icons';
import PermissionWrapper from '../../../common/PermissionWrapper';
import ReportHeader from '../ReportHeader';
import { formatNumber, exportToExcel } from '../../../../utils/formatting';
import {
    Actions,
    Resources,
    buildPermission,
} from '../../../../enums/permissions.enum';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';

declare var Chart: any;

interface FinancialPerformanceReportProps {
    title: string;
}

const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const FinancialPerformanceReport: React.FC<FinancialPerformanceReportProps> = ({ title }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    // Fetch data from Redux
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiPurchaseInvoices = [], isLoading: purchasesLoading } = useGetPurchaseInvoicesQuery();
    const { data: apiPaymentVouchers = [], isLoading: vouchersLoading } = useGetPaymentVouchersQuery();

    const isLoading = salesLoading || purchasesLoading || vouchersLoading;

    // Normalize any date value to yyyy-MM-dd
    const normalizeDate = useMemo(() => {
        return (date: any): string => {
            if (!date) return '';
            if (typeof date === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
                return date.substring(0, 10);
            }
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
            try {
                const parsed = new Date(date);
                if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0];
                }
            } catch {
                // ignore
            }
            return '';
        };
    }, []);

    // Transform API data to match component expectations (and normalize dates)
    const salesInvoices = useMemo<Invoice[]>(() => {
        return apiSalesInvoices.map((inv) => ({
            id: inv.id,
            date: normalizeDate((inv as any).date || (inv as any).invoiceDate || (inv as any).transactionDate),
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
    }, [apiSalesInvoices, normalizeDate]);

    const purchaseInvoices = useMemo<Invoice[]>(() => {
        return apiPurchaseInvoices.map((inv) => ({
            id: inv.id,
            date: normalizeDate((inv as any).date || (inv as any).invoiceDate || (inv as any).transactionDate),
            customerOrSupplier: inv.supplier ? {
                id: inv.supplier.id,
                name: inv.supplier.name
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
    }, [apiPurchaseInvoices, normalizeDate]);

    const paymentVouchers = useMemo<Voucher[]>(() => {
        return apiPaymentVouchers.map((v) => ({
            id: v.id,
            type: 'payment' as const,
            date: normalizeDate((v as any).date || (v as any).transactionDate),
            entity: {
                type: v.entityType as any,
                id: v.customerId || v.supplierId || v.currentAccountId || v.expenseCodeId || null,
                name: v.entityName
            },
            amount: v.amount,
            description: v.description || '',
            paymentMethod: v.paymentMethod as 'safe' | 'bank',
            safeOrBankId: v.safeId || v.bankId ? parseInt(v.safeId || v.bankId || '0') : null,
            userName: '',
            branchName: v.branch?.name || ''
        }));
    }, [apiPaymentVouchers, normalizeDate]);

    const reportData = useMemo(() => {
        const data = months.map((monthName, index) => {
            const monthIndex = index; // 0-11
            
            const filterByMonth = (dateStr?: string) => {
                if (!dateStr) return false;
                const normalized = normalizeDate(dateStr);
                if (!normalized) return false;
                const d = new Date(normalized);
                return d.getFullYear() === year && d.getMonth() === monthIndex;
            };

            const sales = salesInvoices.filter(inv => filterByMonth(inv.date)).reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
            const purchases = purchaseInvoices.filter(inv => filterByMonth(inv.date)).reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
            const expenses = paymentVouchers
                .filter(v => {
                    const entityType = (v.entity?.type || '').toString().toLowerCase();
                    const isExpense = entityType.includes('expense');
                    return isExpense && filterByMonth(v.date);
                })
                .reduce((sum, v) => sum + (v.amount ?? 0), 0);
            
            // Simplified cash flow net
            const net = sales - purchases - expenses;

            return {
                month: monthName,
                sales,
                purchases,
                expenses,
                net
            };
        });
        return data;
    }, [year, salesInvoices, purchaseInvoices, paymentVouchers, normalizeDate]);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstance.current) chartInstance.current.destroy();

                // Create gradient for sales
                const salesGradient = ctx.createLinearGradient(0, 0, 0, 400);
                salesGradient.addColorStop(0, 'rgba(37, 99, 235, 0.6)');
                salesGradient.addColorStop(1, 'rgba(37, 99, 235, 0.05)');

                const netGradient = ctx.createLinearGradient(0, 0, 0, 400);
                netGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                netGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [
                            {
                                label: 'المبيعات',
                                data: reportData.map(d => d.sales),
                                borderColor: '#2563EB', // Blue
                                backgroundColor: salesGradient,
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#2563EB',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7
                            },
                            {
                                label: 'صافي التدفق',
                                data: reportData.map(d => d.net),
                                borderColor: '#10B981', // Emerald
                                backgroundColor: netGradient,
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#10B981',
                                pointBorderWidth: 2,
                                pointRadius: 5,
                                pointHoverRadius: 7
                            },
                            {
                                label: 'المصروفات والمشتريات',
                                data: reportData.map(d => d.purchases + d.expenses),
                                borderColor: '#EF4444', // Red
                                backgroundColor: 'rgba(239, 68, 68, 0.0)',
                                borderDash: [5, 5],
                                tension: 0.3,
                                pointRadius: 0,
                                pointHoverRadius: 0
                            },
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: { position: 'top', labels: { font: { family: 'Cairo' }, usePointStyle: true } },
                            tooltip: { 
                                titleFont: { family: 'Cairo' }, 
                                bodyFont: { family: 'Cairo' },
                                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: true
                            }
                        },
                        scales: { 
                            y: { 
                                beginAtZero: true, 
                                grid: { color: '#f3f4f6', borderDash: [5, 5] },
                                border: { display: false }
                            },
                            x: {
                                grid: { display: false },
                                border: { display: false }
                            }
                        }
                    }
                });
            }
        }
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [reportData]);

    const handlePrint = () => window.print();
    const handleExcelExport = () => {
        exportToExcel(reportData, `التحليل_المالي_${year}`);
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
                
                {/* Controls (screen only) */}
                <div className="flex justify-between items-center my-4 bg-gray-50 p-4 rounded-lg border border-gray-200 print:hidden">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">السنة المالية:</span>
                        <span className="px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900">
                            {year}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <PermissionWrapper
                            requiredPermission={buildPermission(
                                Resources.FINANCIAL_PERFORMANCE_REPORT,
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
                {/* Print-only year display */}
                <div className="hidden print:flex w-full justify-start items-center my-4 text-right gap-2">
                    <span className="font-bold text-gray-800 ml-2">السنة المالية:</span>
                    <span className="px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900">
                        {year}
                    </span>
                </div>

                {/* Vibrant Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 rounded-xl shadow-lg transform transition hover:-translate-y-1">
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider opacity-80">إجمالي المبيعات</p>
                        <p className="text-3xl font-bold mt-2">{formatNumber(reportData.reduce((s, i) => s + i.sales, 0))}</p>
                    </div>
                    <div className="bg-white border-l-4 border-red-500 p-5 rounded-xl shadow-sm">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">إجمالي المشتريات</p>
                        <p className="text-2xl font-bold text-gray-800 mt-2">{formatNumber(reportData.reduce((s, i) => s + i.purchases, 0))}</p>
                    </div>
                    <div className="bg-white border-l-4 border-orange-500 p-5 rounded-xl shadow-sm">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">إجمالي المصروفات</p>
                        <p className="text-2xl font-bold text-gray-800 mt-2">{formatNumber(reportData.reduce((s, i) => s + i.expenses, 0))}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 rounded-xl shadow-lg transform transition hover:-translate-y-1">
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider opacity-80">صافي التدفق النقدي</p>
                        <p className="text-3xl font-bold mt-2">{formatNumber(reportData.reduce((s, i) => s + i.net, 0))}</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="mb-8 h-80 border border-gray-100 rounded-xl p-4 bg-white shadow-sm print:hidden">
                    <canvas ref={chartRef}></canvas>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto border-2 border-blue-100 rounded-lg">
                    <table className="min-w-full text-sm text-center">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="p-3 border-l border-blue-800">الشهر</th>
                                <th className="p-3 border-l border-blue-800 bg-blue-800">المبيعات</th>
                                <th className="p-3 border-l border-blue-800">المشتريات</th>
                                <th className="p-3 border-l border-blue-800">المصروفات</th>
                                <th className="p-3 bg-emerald-700">صافي التدفق</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50">
                                    <td className="p-3 font-bold text-blue-900 bg-blue-50/50">{row.month}</td>
                                    <td className="p-3 font-mono font-medium">{formatNumber(row.sales)}</td>
                                    <td className="p-3 font-mono text-gray-600">{formatNumber(row.purchases)}</td>
                                    <td className="p-3 font-mono text-gray-600">{formatNumber(row.expenses)}</td>
                                    <td className={`p-3 font-mono font-bold ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {formatNumber(row.net)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-blue-900 text-white font-bold">
                            <tr>
                                <td className="p-3 border-l border-blue-800">الإجمالي السنوي</td>
                                <td className="p-3 border-l border-blue-800">{formatNumber(reportData.reduce((s, i) => s + i.sales, 0))}</td>
                                <td className="p-3 border-l border-blue-800">{formatNumber(reportData.reduce((s, i) => s + i.purchases, 0))}</td>
                                <td className="p-3 border-l border-blue-800">{formatNumber(reportData.reduce((s, i) => s + i.expenses, 0))}</td>
                                <td className="p-3 bg-emerald-700 text-lg">{formatNumber(reportData.reduce((s, i) => s + i.net, 0))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialPerformanceReport;
