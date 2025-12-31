
import React, { useState, useMemo } from 'react';
import type { Customer, Invoice } from '../../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, TrophyIcon, MedalIcon, StarIcon } from '../../../icons';
import PermissionWrapper from '../../../common/PermissionWrapper';
import ReportHeader from '../ReportHeader';
import { formatNumber, exportToExcel } from '../../../../utils/formatting';
import {
    Actions,
    Resources,
    buildPermission,
} from '../../../../enums/permissions.enum';
import { useGetCustomersQuery } from '../../../store/slices/customer/customerApiSlice';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../../store/slices/salesReturn/salesReturnApiSlice';

interface VIPCustomersReportProps {
    title: string;
}

const VIPCustomersReport: React.FC<VIPCustomersReportProps> = ({ title }) => {
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

    // Fetch data from Redux
    const { data: apiCustomers = [], isLoading: customersLoading } = useGetCustomersQuery();
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiSalesReturns = [], isLoading: returnsLoading } = useGetSalesReturnsQuery();

    const isLoading = customersLoading || salesLoading || returnsLoading;

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
                // ignore parse errors
            }
            return '';
        };
    }, []);

    // Transform API data to match component expectations
    const customers = useMemo<Customer[]>(() => {
        return apiCustomers.map((customer) => ({
            id: customer.id,
            code: customer.code,
            name: customer.name,
            commercialReg: customer.commercialReg || '',
            taxNumber: customer.taxNumber || '',
            nationalAddress: customer.nationalAddress || '',
            phone: customer.phone || '',
            openingBalance: customer.openingBalance || 0,
            currentBalance: customer.currentBalance || 0
        }));
    }, [apiCustomers]);

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

    const salesReturns = useMemo<Invoice[]>(() => {
        return apiSalesReturns.map((ret) => ({
            id: ret.id,
            date: normalizeDate((ret as any).date || (ret as any).invoiceDate || (ret as any).transactionDate),
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
    }, [apiSalesReturns, normalizeDate]);

    const reportData = useMemo(() => {
        const DEFAULT_CUSTOMER_NAME = 'عميل نقدي';
        const DEFAULT_CUSTOMER_ID = '__DEFAULT_CASH_CUSTOMER__';

        const customerSales = customers.map(customer => {
            const customerIdStr = (customer.id ?? '').toString();
            
            const invoices = salesInvoices.filter(inv => {
                const invDate = normalizeDate(inv?.date);
                return inv.customerOrSupplier?.id === customerIdStr &&
                    invDate &&
                    invDate >= startDate &&
                    invDate <= endDate;
            });

            const returns = salesReturns.filter(inv => {
                const invDate = normalizeDate(inv?.date);
                return inv.customerOrSupplier?.id === customerIdStr &&
                    invDate &&
                    invDate >= startDate &&
                    invDate <= endDate;
            });

            const totalSales = invoices.reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
            const totalReturns = returns.reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
            const netRevenue = totalSales - totalReturns;
            const invoicesCount = invoices.length;

            return {
                id: customer.id,
                name: customer.name,
                invoicesCount,
                netRevenue
            };
        });

        // Handle default cash customer (invoices without a customer)
        const defaultCustomerInvoices = salesInvoices.filter(inv => {
            const invDate = normalizeDate(inv?.date);
            return !inv.customerOrSupplier &&
                invDate &&
                invDate >= startDate &&
                invDate <= endDate;
        });

        const defaultCustomerReturns = salesReturns.filter(inv => {
            const invDate = normalizeDate(inv?.date);
            return !inv.customerOrSupplier &&
                invDate &&
                invDate >= startDate &&
                invDate <= endDate;
        });

        const defaultCustomerTotalSales = defaultCustomerInvoices.reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
        const defaultCustomerTotalReturns = defaultCustomerReturns.reduce((sum, inv) => sum + (inv.totals?.net ?? 0), 0);
        const defaultCustomerNetRevenue = defaultCustomerTotalSales - defaultCustomerTotalReturns;
        const defaultCustomerInvoicesCount = defaultCustomerInvoices.length;

        // Add default customer if it has sales
        if (defaultCustomerNetRevenue > 0) {
            customerSales.push({
                id: DEFAULT_CUSTOMER_ID,
                name: DEFAULT_CUSTOMER_NAME,
                invoicesCount: defaultCustomerInvoicesCount,
                netRevenue: defaultCustomerNetRevenue
            });
        }

        // Filter out customers with zero sales and sort by revenue descending
        const activeCustomers = customerSales
            .filter(c => c.netRevenue > 0)
            .sort((a, b) => b.netRevenue - a.netRevenue);

        const totalRevenueAll = activeCustomers.reduce((sum, c) => sum + c.netRevenue, 0);

        return activeCustomers.map((c, index) => ({
            ...c,
            rank: index + 1,
            percentage: totalRevenueAll > 0 ? (c.netRevenue / totalRevenueAll) * 100 : 0
        }));

    }, [customers, salesInvoices, salesReturns, startDate, endDate, normalizeDate]);

    const totals = useMemo(() => {
        return reportData.reduce(
            (acc, item) => {
                acc.invoices += item.invoicesCount;
                acc.netRevenue += item.netRevenue;
                return acc;
            },
            { invoices: 0, netRevenue: 0 }
        );
    }, [reportData]);

    const handlePrint = () => window.print();

    const handleExcelExport = () => {
        const data = reportData.map(c => ({
            'الترتيب': c.rank,
            'العميل': c.name,
            'عدد الفواتير': c.invoicesCount,
            'إجمالي المشتريات': c.netRevenue,
            'النسبة': c.percentage.toFixed(2) + '%'
        }));
        exportToExcel(data, 'تحليل_كبار_العملاء');
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

    // Top 3 for Podium
    const top1 = reportData[0];
    const top2 = reportData[1];
    const top3 = reportData[2];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <style>{`
                @page {
                    @bottom-center {
                        content: counter(page) " / " counter(pages);
                        font-family: "Cairo", sans-serif;
                        font-size: 12px;
                        color: #1F2937;
                    }
                }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-row-group !important; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
                    th { font-size: 13px !important; font-weight: bold !important; padding: 6px 8px !important; }
                    td { font-size: 13px !important; padding: 6px 8px !important; }
                    tbody tr:first-child { background: #FFFFFF !important; }
                    tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
                    tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
                    tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                }
            `}</style>
            <div id="printable-area">
                <ReportHeader title={title} />
                <div className="text-right mb-2">
                    <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
                <div className="flex justify-between items-center my-6 bg-gray-50 p-4 rounded-lg border border-gray-200 no-print">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-sm text-gray-700">من:</label>
                            <input type="date" className="p-2 border border-gray-300 rounded-lg text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="font-bold text-sm text-gray-700">إلى:</label>
                            <input type="date" className="p-2 border border-gray-300 rounded-lg text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <PermissionWrapper
                        requiredPermission={buildPermission(
                            Resources.VIP_CUSTOMERS_REPORT,
                            Actions.PRINT,
                        )}
                        fallback={
                            <div className="flex gap-2">
                                <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><ExcelIcon/></button>
                                <button disabled className="p-2 border rounded cursor-not-allowed opacity-50 text-gray-400"><PrintIcon/></button>
                            </div>
                        }
                    >
                        <div className="flex gap-2">
                            <button onClick={handleExcelExport} className="p-2 border rounded hover:bg-gray-100 text-green-700"><ExcelIcon/></button>
                            <button onClick={handlePrint} className="p-2 border rounded hover:bg-gray-100 text-gray-700"><PrintIcon/></button>
                        </div>
                    </PermissionWrapper>
                </div>
                {/* Print-only period display */}
                <div className="hidden print:flex w-full justify-start items-center my-4 text-right gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">من:</span>
                        <span className="px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900">
                            {startDate}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">إلى:</span>
                        <span className="px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold text-gray-900">
                            {endDate}
                        </span>
                    </div>
                </div>

                {/* Podium / Hall of Fame */}
                {top1 && (
                    <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end px-4 no-print">
                        {/* 2nd Place */}
                        <div className="order-2 md:order-1 flex flex-col items-center">
                            {top2 && (
                                <div className="bg-gradient-to-b from-gray-100 to-gray-300 w-full rounded-t-xl p-6 relative mt-8 flex flex-col items-center border-t-4 border-gray-400 shadow-lg">
                                    <div className="absolute -top-6">
                                        <MedalIcon className="w-12 h-12 text-gray-400 drop-shadow-md" />
                                    </div>
                                    <h3 className="font-bold text-gray-700 mt-4 text-lg">{top2.name}</h3>
                                    <p className="text-2xl font-bold text-gray-800 mt-2">{formatNumber(top2.netRevenue)}</p>
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded mt-2">Rank #2</span>
                                </div>
                            )}
                        </div>

                        {/* 1st Place */}
                        <div className="order-1 md:order-2 flex flex-col items-center z-10">
                            <div className="bg-gradient-to-b from-yellow-100 to-yellow-300 w-full rounded-t-xl p-8 relative flex flex-col items-center border-t-4 border-yellow-500 shadow-2xl transform md:scale-110">
                                <div className="absolute -top-8">
                                    <TrophyIcon className="w-16 h-16 text-yellow-500 drop-shadow-lg" />
                                </div>
                                <h3 className="font-bold text-yellow-900 mt-6 text-xl">{top1.name}</h3>
                                <p className="text-3xl font-black text-yellow-800 mt-2">{formatNumber(top1.netRevenue)}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <StarIcon className="w-4 h-4 text-yellow-600" />
                                    <span className="text-xs font-bold text-yellow-700 uppercase">Elite Customer</span>
                                    <StarIcon className="w-4 h-4 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="order-3 md:order-3 flex flex-col items-center">
                            {top3 && (
                                <div className="bg-gradient-to-b from-orange-100 to-orange-200 w-full rounded-t-xl p-6 relative mt-12 flex flex-col items-center border-t-4 border-orange-400 shadow-lg">
                                    <div className="absolute -top-6">
                                        <MedalIcon className="w-12 h-12 text-orange-600 drop-shadow-md" />
                                    </div>
                                    <h3 className="font-bold text-orange-800 mt-4 text-lg">{top3.name}</h3>
                                    <p className="text-2xl font-bold text-orange-900 mt-2">{formatNumber(top3.netRevenue)}</p>
                                    <span className="text-xs bg-orange-200 px-2 py-1 rounded mt-2">Rank #3</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                        <thead className="bg-brand-blue text-white">
                            <tr>
                                <th className="p-3 text-center w-16">الترتيب</th>
                                <th className="p-3 text-right">اسم العميل</th>
                                <th className="p-3 text-center">عدد الفواتير</th>
                                <th className="p-3 text-center">إجمالي المبيعات (الصافي)</th>
                                <th className="p-3 text-center w-48">نسبة المساهمة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reportData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-center">
                                        {item.rank <= 3 ? (
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold mx-auto ${
                                                item.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                                                item.rank === 2 ? 'bg-gray-100 text-gray-600' : 
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {item.rank}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-gray-500">#{item.rank}</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-bold text-gray-800">{item.name}</td>
                                    <td className="p-3 text-center text-gray-600">{item.invoicesCount}</td>
                                    <td className="p-3 text-center font-bold text-blue-700">{formatNumber(item.netRevenue)}</td>
                                    <td className="p-3 align-middle">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold w-10 text-right">{item.percentage.toFixed(1)}%</span>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full bg-blue-500"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">لا توجد مبيعات في هذه الفترة.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-brand-blue text-white font-bold">
                            <tr>
                                <td className="p-3 text-center">—</td>
                                <td className="p-3 text-right">الإجمالي</td>
                                <td className="p-3 text-center">{totals.invoices}</td>
                                <td className="p-3 text-center">{formatNumber(totals.netRevenue)}</td>
                                <td className="p-3 text-center">—</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VIPCustomersReport;
