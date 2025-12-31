
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
import { useGetCompanyQuery } from '../../../store/slices/companyApiSlice';

interface ItemProfitabilityReportProps {
    title: string;
}

const ItemProfitabilityReport: React.FC<ItemProfitabilityReportProps> = ({ title }) => {
    const PRINT_PAGE_SIZE = 20;
    const currentYear = new Date().getFullYear();
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch data from Redux
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiSalesReturns = [], isLoading: returnsLoading } = useGetSalesReturnsQuery();
    const { data: companyInfo } = useGetCompanyQuery(undefined);

    const isLoading = itemsLoading || salesLoading || returnsLoading;

    // Transform API data to match component expectations
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

    const items = useMemo<Item[]>(() => {
        return apiItems
            .filter((item) => item.type !== 'SERVICE') // Exclude service items
            .map((item) => ({
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
        return items.map(item => {
            // Sales
            const itemSales = salesInvoices
                .filter(inv => {
                    const invDate = normalizeDate(inv?.date);
                    if (!invDate) return false;
                    return invDate >= startDate && invDate <= endDate;
                })
                .reduce((acc, inv) => {
                    const invItem = inv.items?.find(i => i.id === item.code);
                    if (invItem) {
                        return {
                            qty: acc.qty + (invItem.qty ?? 0),
                            revenue: acc.revenue + ((invItem.qty ?? 0) * (invItem.price ?? 0)) // Using price before tax
                        };
                    }
                    return acc;
                }, { qty: 0, revenue: 0 });

            // Returns
            const itemReturns = salesReturns
                .filter(inv => {
                    const invDate = normalizeDate(inv?.date);
                    if (!invDate) return false;
                    return invDate >= startDate && invDate <= endDate;
                })
                .reduce((acc, inv) => {
                    const invItem = inv.items?.find(i => i.id === item.code);
                    if (invItem) {
                        return {
                            qty: acc.qty + (invItem.qty ?? 0),
                            value: acc.value + ((invItem.qty ?? 0) * (invItem.price ?? 0)) // Using price before tax
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
        ).sort((a, b) => b.marginPercent - a.marginPercent); // Sort by margin % descending
    }, [items, salesInvoices, salesReturns, startDate, endDate, searchTerm, normalizeDate]);

    const printPages = useMemo(() => {
        const pages: typeof reportData[] = [];
        for (let i = 0; i < reportData.length; i += PRINT_PAGE_SIZE) {
            pages.push(reportData.slice(i, i + PRINT_PAGE_SIZE));
        }
        return pages;
    }, [reportData]);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const totalPages = Math.max(printPages.length, 1);
        const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Calculate summary values
        const totalRevenue = reportData.reduce((sum, i) => sum + i.netRevenue, 0);
        const totalProfit = reportData.reduce((sum, i) => sum + i.grossProfit, 0);
        const topPerformers = reportData.slice(0, 3);

        // Company header HTML
        const companyHeader = companyInfo ? `
            <div style="border: 2px solid #1E40AF; border-radius: 8px; margin-bottom: 16px; padding: 16px; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" style="height: 80px; width: auto; object-fit: contain;" />` : ''}
                        <div>
                            <h2 style="font-size: 24px; font-weight: bold; color: #1F2937; margin: 0 0 8px 0;">${companyInfo.name}</h2>
                            <p style="font-size: 14px; color: #4B5563; margin: 4px 0;">${companyInfo.address || ''}</p>
                            <p style="font-size: 14px; color: #4B5563; margin: 4px 0;">هاتف: ${companyInfo.phone || ''}</p>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <h1 style="font-size: 24px; font-weight: bold; color: #1F2937; margin: 0 0 8px 0;">${title}</h1>
                        <div style="font-size: 14px; margin-top: 8px;">
                            <p style="margin: 4px 0;"><span style="font-weight: 600;">الرقم الضريبي:</span> ${companyInfo.taxNumber || ''}</p>
                            <p style="margin: 4px 0;"><span style="font-weight: 600;">السجل التجاري:</span> ${companyInfo.commercialReg || ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div style="border: 2px solid #1E40AF; border-radius: 8px; margin-bottom: 16px; padding: 16px; background: white;">
                <h1 style="font-size: 24px; font-weight: bold; color: #1F2937; margin: 0; text-align: center;">${title}</h1>
            </div>
        `;

        // Date and period info
        const dateInfo = `
            <div style="margin-bottom: 16px; text-align: right;">
                <p style="margin: 4px 0; font-size: 14px;"><span style="font-weight: 600; color: #1F2937;">التاريخ:</span> ${currentDate}</p>
                <div style="display: flex; justify-content: flex-start; align-items: center; gap: 16px; margin-top: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; color: #1F2937;">من:</span>
                        <span style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-weight: 600; color: #111827;">${startDate}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; color: #1F2937;">إلى:</span>
                        <span style="padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; background: white; font-weight: 600; color: #111827;">${endDate}</span>
                    </div>
                </div>
            </div>
        `;

        // Summary cards (only for first page)
        const summaryCards = (pageIndex: number) => {
            if (pageIndex !== 0) return '';
            return `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 12px;">
                        <h3 style="color: #065F46; font-weight: bold; margin-bottom: 12px; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                            <span style="padding: 4px; background: #A7F3D0; border-radius: 50%; width: 16px; height: 16px; display: inline-block;"></span>
                            الأعلى ربحية (Top 3)
                        </h3>
                        ${topPerformers.map((item, idx) => `
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #A7F3D0; ${idx === topPerformers.length - 1 ? 'border-bottom: none; margin-bottom: 0; padding-bottom: 0;' : ''}">
                                <span style="font-weight: 500; color: #064E3B;">${idx + 1}. ${item.name}</span>
                                <span style="font-weight: bold; color: #047857;">${formatNumber(item.grossProfit)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="background: #EFF6FF; border: 1px solid #93C5FD; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center;">
                        <h3 style="color: #1E40AF; font-weight: bold; margin-bottom: 8px; font-size: 14px;">إجمالي المبيعات (للفترة)</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #2563EB; margin: 8px 0 0 0; letter-spacing: -0.5px;">
                            ${formatNumber(totalRevenue)}
                        </p>
                    </div>
                    <div style="background: #EEF2FF; border: 1px solid #A5B4FC; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center;">
                        <h3 style="color: #4338CA; font-weight: bold; margin-bottom: 8px; font-size: 14px;">إجمالي الربح (للفترة)</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #4F46E5; margin: 8px 0 0 0; letter-spacing: -0.5px;">
                            ${formatNumber(totalProfit)}
                        </p>
                    </div>
                </div>
            `;
        };

        // Table header
        const tableHeader = `
            <tr>
                <th style="padding: 12px; text-align: right; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الكود</th>
                <th style="padding: 12px; text-align: right; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الصنف</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الكمية المباعة</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">صافي المبيعات</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">التكلفة التقديرية</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">مجمل الربح</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600; width: 120px;">الهامش %</th>
            </tr>
        `;

        // Generate pages
        const bodyPages = printPages
            .map(
                (pageItems, idx) => `
                <div class="page">
                    <div class="page-header">
                        <h2 class="title">${title}</h2>
                        <div class="page-number">(${totalPages} / ${idx + 1})</div>
                    </div>
                    ${idx === 0 ? companyHeader : `<div style="margin-bottom: 16px; text-align: center;"><h2 style="font-size: 20px; font-weight: bold; color: #1F2937; margin: 0;">${title}</h2></div>`}
                    ${dateInfo}
                    ${summaryCards(idx)}
                    <table>
                        <thead>${tableHeader}</thead>
                        <tbody>
                            ${pageItems
                                .map(
                                    (item) => `
                                    <tr>
                                        <td style="padding: 12px; text-align: right; color: #4B5563;">${item.code}</td>
                                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #1F2937;">${item.name}</td>
                                        <td style="padding: 12px; text-align: center;">${item.netQty}</td>
                                        <td style="padding: 12px; text-align: center; font-weight: 500; color: #2563EB;">${formatNumber(item.netRevenue)}</td>
                                        <td style="padding: 12px; text-align: center; color: #6B7280;">${formatNumber(item.cogs)}</td>
                                        <td style="padding: 12px; text-align: center; font-weight: bold; color: ${item.grossProfit >= 0 ? '#059669' : '#DC2626'};">
                                            ${formatNumber(item.grossProfit)}
                                        </td>
                                        <td style="padding: 12px; text-align: center; vertical-align: middle;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="font-size: 11px; font-weight: bold; width: 40px; text-align: right;">${item.marginPercent.toFixed(1)}%</span>
                                                <div style="flex: 1; height: 8px; background: #E5E7EB; border-radius: 9999px; overflow: hidden;">
                                                    <div 
                                                        style="height: 100%; border-radius: 9999px; width: ${Math.min(100, Math.max(0, item.marginPercent))}%; background: ${item.marginPercent > 30 ? '#10B981' : item.marginPercent > 10 ? '#FBBF24' : '#EF4444'};"
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                `
                                )
                                .join("")}
                        </tbody>
                    </table>
                </div>`
            )
            .join("");

        const html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8" />
                <title>${title}</title>
                <style>
                    @page { 
                        size: A4 landscape; 
                        margin: 10mm;
                        @bottom-center {
                            content: counter(page) " / " counter(pages);
                            font-family: "Cairo", sans-serif;
                            font-size: 12px;
                            color: #1F2937;
                        }
                    }
                    body {
                        font-family: 'Cairo', sans-serif;
                        margin: 0;
                        padding: 10mm;
                        color: #1F2937;
                        background: #FFFFFF;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin: 0 0 12px 0;
                    }
                    .title {
                        margin: 0;
                        font-size: 16px;
                        color: #1F2937;
                    }
                    .page-number {
                        font-size: 12px;
                        font-weight: 700;
                        color: #1F2937;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 13px !important; 
                        margin-top: 16px;
                    }
                    th, td { 
                        border: 1px solid #E5E7EB; 
                        padding: 6px 8px !important; 
                        text-align: right; 
                    }
                    thead { 
                        background: #1E40AF !important; 
                        color: #FFFFFF !important; 
                        display: table-header-group;
                    }
                    tfoot { 
                        display: table-row-group !important; 
                    }
                    tbody tr:first-child { 
                        background: #FFFFFF !important; 
                    }
                    tbody tr:nth-child(2n+2) { 
                        background: #D1D5DB !important; 
                    }
                    tbody tr:nth-child(2n+3) { 
                        background: #FFFFFF !important; 
                    }
                    tfoot tr { 
                        page-break-inside: avoid !important; 
                        break-inside: avoid !important; 
                    }
                    tr { 
                        page-break-inside: avoid; 
                        break-inside: avoid; 
                    }
                    .page { 
                        page-break-after: always; 
                        break-after: page; 
                    }
                    .page:last-of-type { 
                        page-break-after: auto; 
                        break-after: auto; 
                    }
                </style>
            </head>
            <body>
                ${bodyPages}
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 200);
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
                <div className="text-right mb-2">
                    <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
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

                {/* Top Performers Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-3 mb-8 print:mb-4 print:text-sm">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 print:p-3 rounded-xl shadow-sm">
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
                    <div className="bg-blue-50 border border-blue-200 p-4 print:p-3 rounded-xl shadow-sm flex flex-col justify-center">
                        <h3 className="text-blue-800 font-bold mb-1">إجمالي المبيعات (للفترة)</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2 tracking-tight">
                            {formatNumber(reportData.reduce((sum, i) => sum + i.netRevenue, 0))}
                        </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-4 print:p-3 rounded-xl shadow-sm flex flex-col justify-center">
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
