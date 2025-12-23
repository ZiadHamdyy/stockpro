import React, { useState, useMemo, useCallback } from 'react';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { LockIcon, EyeIcon, CheckIcon, XIcon } from '../../icons';
import PermissionWrapper from '../../common/PermissionWrapper';
import { Actions, Resources, buildPermission } from '../../../enums/permissions.enum';
import {
  useGetFiscalYearsQuery,
  useCreateFiscalYearMutation,
  useCloseFiscalYearMutation,
  useReopenFiscalYearMutation,
  type FiscalYear,
} from '../../store/slices/fiscalYear/fiscalYearApiSlice';
import { formatNumber } from '../../../utils/formatting';
import { useGetIncomeStatementQuery } from '../../store/slices/incomeStatement/incomeStatementApiSlice';
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseReturnsQuery } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetStoreReceiptVouchersQuery } from '../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi';
import { useGetStoreIssueVouchersQuery } from '../../store/slices/storeIssueVoucher/storeIssueVoucherApi';
import { useGetStoreTransferVouchersQuery } from '../../store/slices/storeTransferVoucher/storeTransferVoucherApi';
import { useGetStoresQuery } from '../../store/slices/store/storeApi';
import { useGetReceiptVouchersQuery } from '../../store/slices/receiptVoucherApiSlice';

interface FiscalYearsProps {
    title?: string;
}

// Component to calculate and display retained earnings for a single fiscal year
const FiscalYearRow: React.FC<{
    year: FiscalYear;
    onToggleStatus: (year: FiscalYear) => void;
    isClosing: boolean;
    isReopening: boolean;
}> = ({ year, onToggleStatus, isClosing, isReopening }) => {
    const startDate = year.startDate.split('T')[0];
    const endDate = year.endDate.split('T')[0];
    
    // Fetch income statement data for this fiscal year
    const { data: incomeStatementData } = useGetIncomeStatementQuery(
        { startDate, endDate },
        { skip: !startDate || !endDate }
    );

    // Fetch data for inventory and other revenues calculation
    const { data: apiItems = [] } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery();
    const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
    const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery();
    const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery();
    const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
    const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
    const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);
    const { data: stores = [] } = useGetStoresQuery(undefined);
    const { data: apiReceiptVouchers = [] } = useGetReceiptVouchersQuery(undefined);

    // Helper to normalize date
    const normalizeDate = useCallback((date: any): string => {
        if (!date) return "";
        if (typeof date === "string") {
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
            return date.substring(0, 10);
        }
        if (date instanceof Date) {
            return date.toISOString().split("T")[0];
        }
        try {
            const parsed = new Date(date);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split("T")[0];
            }
        } catch {
            // ignore
        }
        return "";
    }, []);

    const toNumber = useCallback((value: any): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }, []);

    // Calculate ending inventory (same logic as IncomeStatement)
    const calculatedEndingInventory = useMemo(() => {
        const normalizedEndDate = normalizeDate(endDate);
        if (!normalizedEndDate) return 0;

        const items = (apiItems as any[])
            .filter((item) => {
                const itemType = (item.type || item.itemType || "").toUpperCase();
                return itemType !== "SERVICE";
            });

        if (items.length === 0) return 0;

        const transformedPurchaseInvoices = (apiPurchaseInvoices as any[]).map((inv) => ({
            ...inv,
            items: inv.items.map((item) => ({
                id: item.id,
                qty: item.qty,
                price: item.price,
            })),
        }));

        const getLastPurchasePrice = (itemCode: string): number | null => {
            const relevantInvoices = transformedPurchaseInvoices
                .filter((inv) => {
                    const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
                    return txDate && txDate <= normalizedEndDate;
                })
                .sort((a, b) => {
                    const dateA = normalizeDate(a.date) || normalizeDate(a.invoiceDate) || "";
                    const dateB = normalizeDate(b.date) || normalizeDate(b.invoiceDate) || "";
                    return dateB.localeCompare(dateA);
                });

            for (const inv of relevantInvoices) {
                for (const invItem of inv.items) {
                    if (invItem.id === itemCode && invItem.price) {
                        return invItem.price;
                    }
                }
            }
            return null;
        };

        const valuationData = items.map((item) => {
            let balance = toNumber((item as any).openingBalance ?? 0);

            const filterByDate = (tx: any) => {
                const txDate = normalizeDate(tx.date) || normalizeDate(tx.invoiceDate) || normalizeDate(tx.transactionDate);
                return txDate && txDate <= normalizedEndDate;
            };

            (apiPurchaseInvoices as any[]).filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance += toNumber(i.qty);
                }),
            );
            (apiSalesReturns as any[]).filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance += toNumber(i.qty);
                }),
            );
            (storeReceiptVouchers as any[]).filter(filterByDate).forEach((v) =>
                v.items.forEach((i) => {
                    if ((i.item?.code || i.itemId) === item.code) balance += toNumber(i.quantity);
                }),
            );

            (apiSalesInvoices as any[]).filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance -= toNumber(i.qty);
                }),
            );
            (apiPurchaseReturns as any[]).filter(filterByDate).forEach((inv) =>
                inv.items.forEach((i) => {
                    if (i.id === item.code) balance -= toNumber(i.qty);
                }),
            );
            (storeIssueVouchers as any[]).filter(filterByDate).forEach((v) =>
                v.items.forEach((i) => {
                    if ((i.item?.code || i.itemId) === item.code) balance -= toNumber(i.quantity);
                }),
            );

            const fallbackPrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);
            const lastPurchasePrice = getLastPurchasePrice(item.code);
            const cost = lastPurchasePrice ?? fallbackPrice;

            return balance * cost;
        });

        return valuationData.reduce((acc, value) => acc + value, 0);
    }, [apiItems, apiSalesInvoices, apiPurchaseInvoices, apiSalesReturns, apiPurchaseReturns, storeReceiptVouchers, storeIssueVouchers, endDate, normalizeDate, toNumber]);

    // Calculate other revenues (same as IncomeStatement)
    const calculatedOtherRevenues = useMemo(() => {
        const normalizedStartDate = normalizeDate(startDate);
        const normalizedEndDate = normalizeDate(endDate);
        
        if (!normalizedStartDate || !normalizedEndDate) return 0;

        return (apiReceiptVouchers as any[])
            .filter((voucher) => {
                if (voucher.entityType !== 'revenue') return false;
                const voucherDate = normalizeDate(voucher.date);
                if (!voucherDate) return false;
                return voucherDate >= normalizedStartDate && voucherDate <= normalizedEndDate;
            })
            .reduce((sum, voucher) => sum + (voucher.amount || 0), 0);
    }, [apiReceiptVouchers, startDate, endDate, normalizeDate]);

    // Calculate net profit using the same formula as IncomeStatement
    const calculatedNetProfit = useMemo(() => {
        if (!incomeStatementData) return null;
        
        return incomeStatementData.netSales - 
               (incomeStatementData.beginningInventory + incomeStatementData.netPurchases - calculatedEndingInventory) + 
               calculatedOtherRevenues - 
               incomeStatementData.totalExpenses;
    }, [incomeStatementData, calculatedEndingInventory, calculatedOtherRevenues]);

    const calculatedValue = calculatedNetProfit;

    return (
        <div className={`border-2 rounded-lg p-4 flex justify-between items-center ${year.status === 'OPEN' ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}>
            <div>
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-brand-dark">{year.name}</h3>
                    {year.status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800 font-bold flex items-center gap-1">
                            <EyeIcon className="w-3 h-3"/> مفتوحة
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-800 font-bold flex items-center gap-1">
                            <LockIcon className="w-3 h-3"/> مغلقة
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                    من: <span className="font-mono font-bold">{startDate}</span> إلى: <span className="font-mono font-bold">{endDate}</span>
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-center px-4 border-l border-gray-300 hidden md:block">
                    <p className="text-xs text-gray-500">الأرباح (الخسائر) المبقاة</p>
                    <p className={`font-bold text-lg ${calculatedValue !== null && calculatedValue !== undefined ? (calculatedValue >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {calculatedValue !== null && calculatedValue !== undefined ? formatNumber(calculatedValue) : '---'}
                    </p>
                </div>
                <PermissionWrapper
                    requiredPermission={buildPermission(
                        Resources.FISCAL_YEARS,
                        Actions.UPDATE
                    )}
                    fallback={
                        <button
                            disabled
                            className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 cursor-not-allowed opacity-50 ${
                                year.status === 'OPEN'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                            }`}
                        >
                            {year.status === 'OPEN' ? (
                                <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                            ) : (
                                <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                            )}
                        </button>
                    }
                >
                    <button 
                        onClick={() => onToggleStatus(year)}
                        disabled={
                            isClosing || 
                            isReopening || 
                            (year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear())
                        }
                        title={
                            year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear()
                                ? "لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية"
                                : undefined
                        }
                        className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            year.status === 'OPEN' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {year.status === 'OPEN' ? (
                            <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                        ) : (
                            <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                        )}
                    </button>
                </PermissionWrapper>
            </div>
        </div>
    );
};

const FiscalYears: React.FC<FiscalYearsProps> = ({ title }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYear, setNewYear] = useState<Partial<FiscalYear>>({
        name: new Date().getFullYear().toString(),
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: `${new Date().getFullYear()}-12-31`,
    });
    const { showToast } = useToast();
    const { showModal } = useModal();

    const { data: fiscalYears = [], isLoading } = useGetFiscalYearsQuery();
    const [createFiscalYear, { isLoading: isCreating }] = useCreateFiscalYearMutation();
    const [closeFiscalYear, { isLoading: isClosing }] = useCloseFiscalYearMutation();
    const [reopenFiscalYear, { isLoading: isReopening }] = useReopenFiscalYearMutation();

    const sortedFiscalYears = useMemo(() => 
        [...fiscalYears].sort((a, b) => b.name.localeCompare(a.name)),
        [fiscalYears]
    );

    const handleAddYear = async () => {
        if (!newYear.name || !newYear.startDate || !newYear.endDate) {
            showToast("الرجاء تعبئة جميع البيانات", "error");
            return;
        }
        
        // Validate date range
        const startDate = new Date(newYear.startDate!);
        const endDate = new Date(newYear.endDate!);
        
        if (startDate >= endDate) {
            showToast("يجب أن يكون تاريخ البداية قبل تاريخ النهاية", "error");
            return;
        }
        
        // Validate that dates are not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate > today) {
            showToast("لا يمكن فتح فترة محاسبية لتاريخ مستقبلي", "error");
            return;
        }
        
        // Validate that the fiscal year is not for a future year
        const startDateYear = startDate.getFullYear();
        const currentYear = new Date().getFullYear();
        if (startDateYear > currentYear) {
            showToast("لا يمكن فتح فترة محاسبية لسنة مستقبلية", "error");
            return;
        }
        
        try {
            await createFiscalYear({
                name: newYear.name,
                startDate: newYear.startDate!,
                endDate: newYear.endDate!,
            }).unwrap();
            setIsModalOpen(false);
            setNewYear({
                name: new Date().getFullYear().toString(),
                startDate: `${new Date().getFullYear()}-01-01`,
                endDate: `${new Date().getFullYear()}-12-31`,
            });
            showToast("تم إضافة السنة المالية بنجاح", "success");
        } catch (error: any) {
            showToast(
                error?.data?.message || "حدث خطأ أثناء إضافة السنة المالية",
                "error"
            );
        }
    };

    const confirmToggleStatus = (year: FiscalYear) => {
        if (year.status === 'CLOSED') {
            // Validate that the fiscal year is not for a future year
            const startDateYear = new Date(year.startDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (startDateYear > currentYear) {
                showToast("لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية", "error");
                return;
            }
            
            showModal({
                title: 'إعادة فتح السنة المالية',
                message: `هل أنت متأكد من إعادة فتح السنة المالية ${year.name}؟ هذا سيسمح بإنشاء وتعديل المستندات المالية في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await reopenFiscalYear(year.id).unwrap();
                        showToast(`تم فتح السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إعادة فتح السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'edit',
            });
        } else {
            showModal({
                title: 'إغلاق السنة المالية',
                message: `هل أنت متأكد من إغلاق السنة المالية ${year.name}؟ سيمنع هذا إنشاء أي مستندات مالية (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await closeFiscalYear(year.id).unwrap();
                        showToast(`تم إغلاق السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إغلاق السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'delete',
            });
        }
    };

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

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
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-brand-dark">{title ?? "الفترات المحاسبية"}</h1>
                <PermissionWrapper
                    requiredPermission={buildPermission(
                        Resources.FISCAL_YEARS,
                        Actions.CREATE
                    )}
                >
                    <button 
                        onClick={() => setIsModalOpen(true)} 
                        className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
                        disabled={isCreating}
                    >
                        {isCreating ? "جاري الإضافة..." : "سنة مالية جديدة"}
                    </button>
                </PermissionWrapper>
            </div>

            {/* Information Banner */}
            <div className="mb-6 p-4 bg-blue-50 border-r-4 border-brand-blue rounded-md">
                <p className="text-sm text-gray-700">
                    <strong className="text-brand-dark">ملاحظة مهمة:</strong> يجب فتح فترة محاسبية أولاً قبل إنشاء أي مستند مالي. 
                    لا يمكن إنشاء المستندات (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) 
                    إلا في الفترات المفتوحة. عند إغلاق الفترة، لن يتم السماح بإنشاء أي مستندات في هذه الفترة.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedFiscalYears.map(year => (
                    <FiscalYearRow
                        key={year.id}
                        year={year}
                        onToggleStatus={confirmToggleStatus}
                        isClosing={isClosing}
                        isReopening={isReopening}
                    />
                ))}
            </div>

            {/* Add New Year Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-brand-dark">إضافة سنة مالية</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">السنة</label>
                                <input type="text" value={newYear.name} onChange={(e) => setNewYear({...newYear, name: e.target.value})} className={inputStyle} placeholder="2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">من تاريخ</label>
                                    <input type="date" value={newYear.startDate} onChange={(e) => setNewYear({...newYear, startDate: e.target.value})} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                                    <input type="date" value={newYear.endDate} onChange={(e) => setNewYear({...newYear, endDate: e.target.value})} className={inputStyle} />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
                            <button onClick={handleAddYear} disabled={isCreating} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isCreating ? "جاري الحفظ..." : "حفظ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalYears;
