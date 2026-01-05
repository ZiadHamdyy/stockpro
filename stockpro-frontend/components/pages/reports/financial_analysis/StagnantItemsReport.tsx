
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
import { useGetCompanyQuery } from '../../../store/slices/companyApiSlice';

interface StagnantItemsReportProps {
    title: string;
}

/**
 * Stagnant Items Report Component
 * 
 * IMPORTANT: This component displays COMPANY-WIDE financial data.
 * All calculations aggregate data across ALL branches regardless of:
 * - User's branch assignment
 * - User permissions
 * - Branch filters
 * 
 * The report shows stagnant items analysis aggregated across the entire company.
 */
const StagnantItemsReport: React.FC<StagnantItemsReportProps> = ({ title }) => {
    const PRINT_PAGE_SIZE = 20;
    const [thresholdDays, setThresholdDays] = useState(90);
    const [searchTerm, setSearchTerm] = useState('');

    // COMPANY-WIDE DATA FETCHING: All queries use undefined to fetch ALL company data
    // Backend APIs filter by companyId only, ensuring all branches are included
    // Fetch data from Redux
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery(undefined);
    const { data: apiStoreIssueVouchers = [], isLoading: vouchersLoading } = useGetStoreIssueVouchersQuery(undefined);
    const { data: companyInfo } = useGetCompanyQuery(undefined);

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
            
            // Format date to show only day, month, and year (no time)
            const formatDateOnly = (dateStr: string): string => {
                if (isNeverMoved) return 'لم يتحرك أبداً';
                try {
                    const date = new Date(dateStr);
                    if (isNaN(date.getTime())) return dateStr; // Return original if invalid
                    // Extract only the date part (YYYY-MM-DD) and format it
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                } catch {
                    // If date string is already in YYYY-MM-DD format, extract just that part
                    const datePart = dateStr.split('T')[0].split(' ')[0];
                    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                        return datePart;
                    }
                    return dateStr;
                }
            };
            
            const stockValue = (item.stock ?? 0) * (item.purchasePrice ?? 0);

            return {
                ...item,
                lastMovementDate: formatDateOnly(lastDateStr),
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

    const printPages = useMemo(() => {
        const pages: typeof reportData[] = [];
        // First page has extra headers (company header, date info, alert banner), so reduce items significantly
        // Headers take up approximately 12-15 rows worth of space, so use only 6 items on first page to be safe
        const FIRST_PAGE_SIZE = 6;
        // Subsequent pages also need to account for page header, so use slightly less than full size
        // Reduce to 15 items to ensure no overflow even with variable content heights
        const SUBSEQUENT_PAGE_SIZE = PRINT_PAGE_SIZE - 5; // Reduced to 15 to prevent overflow
        if (reportData.length > 0) {
            // First page with reduced size
            pages.push(reportData.slice(0, FIRST_PAGE_SIZE));
            // Remaining pages with adjusted size to prevent overflow
            let remaining = reportData.length - FIRST_PAGE_SIZE;
            let currentIdx = FIRST_PAGE_SIZE;
            while (remaining > 0) {
                // For the last page, if it would have very few items (1-3), merge with previous page
                // BUT only if merging won't make the previous page >= 16 items (which would cause overflow)
                if (remaining <= 3 && pages.length > 0) {
                    const lastPage = pages[pages.length - 1];
                    const mergedSize = lastPage.length + remaining;
                    // Only merge if the resulting page won't be >= 16 items (SUBSEQUENT_PAGE_SIZE + 1)
                    if (mergedSize < 16) {
                        // Merge last few items with previous page
                        pages[pages.length - 1] = [...lastPage, ...reportData.slice(currentIdx)];
                        break;
                    }
                    // If merging would cause overflow, create a separate small page instead
                }
                const pageSize = Math.min(SUBSEQUENT_PAGE_SIZE, remaining);
                pages.push(reportData.slice(currentIdx, currentIdx + pageSize));
                currentIdx += pageSize;
                remaining -= pageSize;
            }
        }
        return pages;
    }, [reportData]);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        // Since we now prevent pages with >= 16 items in printPages, totalPages should equal printPages.length
        const totalPages = Math.max(printPages.length, 1);
        const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

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

        // Date and threshold info
        const dateInfo = `
            <div style="margin-bottom: 16px; text-align: right;">
                <p style="margin: 4px 0; font-size: 14px;"><span style="font-weight: 600; color: #1F2937;">التاريخ:</span> ${currentDate}</p>
                <div style="display: flex; justify-content: flex-start; align-items: center; gap: 16px; margin-top: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; background: #FEF2F2; padding: 8px 12px; border: 1px solid #FECACA; border-radius: 8px;">
                        <span style="font-weight: 600; color: #991B1B;">عرض الأصناف الراكدة منذ:</span>
                        <span style="padding: 4px 8px; border: 1px solid #FCA5A5; border-radius: 6px; background: white; font-weight: bold; color: #991B1B;">${thresholdDays} يوم</span>
                    </div>
                </div>
            </div>
        `;

        // Alert banner (only for first page)
        const alertBanner = (pageIndex: number) => {
            if (pageIndex !== 0) return '';
            return `
                <div style="background: #FEF2F2; border-left: 8px solid #DC2626; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div>
                            <h3 style="font-size: 18px; font-weight: bold; color: #991B1B; margin: 0 0 4px 0;">قيمة المخزون المجمد (Dead Capital)</h3>
                            <p style="color: #B91C1C; font-size: 14px; margin: 0;">إجمالي تكلفة الأصناف التي لم تتحرك منذ ${thresholdDays} يوم</p>
                        </div>
                    </div>
                    <p style="font-size: 32px; font-weight: 900; color: #991B1B; margin: 0; letter-spacing: -0.5px;">
                        ${formatNumber(totalStagnantValue)} <span style="font-size: 14px; font-weight: 500; color: #DC2626;">SAR</span>
                    </p>
                </div>
            `;
        };

        // Table header
        const tableHeader = `
            <tr>
                <th style="padding: 12px; text-align: right; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الكود</th>
                <th style="padding: 12px; text-align: right; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الصنف</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">الرصيد الحالي</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">قيمة المخزون (تكلفة)</th>
                <th style="padding: 12px; text-align: center; background: #1E40AF; color: #FFFFFF; font-weight: 600;">تاريخ آخر حركة</th>
                <th style="padding: 12px; text-align: center; background: #B91C1C; color: #FFFFFF; font-weight: 600;">أيام الركود</th>
            </tr>
        `;

        // Generate pages
        const bodyPages = printPages
            .map(
                (pageItems, idx) => {
                    return `
                <div class="page">
                    ${idx === 0 ? companyHeader : ''}
                    ${idx === 0 ? dateInfo : ''}
                    ${alertBanner(idx)}
                    <table>
                        <thead>${tableHeader}</thead>
                        <tbody>
                            ${pageItems.length === 0 ? `
                                <tr>
                                    <td colspan="6" style="padding: 32px; text-align: center; color: #6B7280;">
                                        ممتاز! لا توجد أصناف راكدة تتجاوز المدة المحددة.
                                    </td>
                                </tr>
                            ` : pageItems
                                .map(
                                    (item) => `
                                    <tr>
                                        <td style="padding: 12px; text-align: right; color: #4B5563;">${item.code}</td>
                                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #1F2937;">${item.name}</td>
                                        <td style="padding: 12px; text-align: center; font-weight: bold;">${item.stock}</td>
                                        <td style="padding: 12px; text-align: center; color: #6B7280;">${formatNumber(item.stockValue)}</td>
                                        <td style="padding: 12px; text-align: center; color: #6B7280;">${item.lastMovementDate}</td>
                                        <td style="padding: 12px; text-align: center; vertical-align: middle;">
                                            <span style="padding: 6px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; ${item.daysDormant >= 180 ? 'background: #FEE2E2; color: #991B1B;' : 'background: #FED7AA; color: #9A3412;'}">
                                                ${item.daysDormant === 999 ? 'لم يتحرك' : `${item.daysDormant} يوم`}
                                            </span>
                                        </td>
                                    </tr>
                                `
                                )
                                .join("")}
                        </tbody>
                    </table>
                </div>`;
                }
            )
            .join("") + 
            // Overflow page generation should not be needed now since we prevent pages with >= 16 items
            // But keep it as a safety net
            (totalPages > printPages.length ? (() => {
                return Array.from({ length: totalPages - printPages.length }, (_, i) => {
                    const overflowPageIdx = printPages.length + i;
                    return `
                    <div class="page">
                        <table>
                            <thead>${tableHeader}</thead>
                            <tbody>
                                <!-- Overflow content will be rendered here by browser -->
                            </tbody>
                        </table>
                    </div>
                `;
                }).join("");
            })() : "");

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
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 13px !important; 
                        margin-top: 0;
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
                    thead tr {
                        page-break-after: avoid;
                        page-break-inside: avoid;
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
