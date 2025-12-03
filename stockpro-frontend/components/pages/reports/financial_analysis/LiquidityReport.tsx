
import React, { useMemo } from 'react';
import type { Safe, Bank, Customer, Supplier, Item, Invoice, Voucher } from '../../../../types';
import { PrintIcon, ShieldIcon, ActivityIcon, TrendingUpIcon, AlertTriangleIcon } from '../../../icons';
import ReportHeader from '../ReportHeader';
import { formatNumber } from '../../../../utils/formatting';
import { useGetSafesQuery } from '../../../store/slices/safe/safeApiSlice';
import { useGetBanksQuery } from '../../../store/slices/bank/bankApiSlice';
import { useGetCustomersQuery } from '../../../store/slices/customer/customerApiSlice';
import { useGetSuppliersQuery } from '../../../store/slices/supplier/supplierApiSlice';
import { useGetItemsQuery } from '../../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetReceiptVouchersQuery } from '../../../store/slices/receiptVoucherApiSlice';
import { useGetPaymentVouchersQuery } from '../../../store/slices/paymentVoucherApiSlice';

interface LiquidityReportProps {
    title: string;
}

const LiquidityReport: React.FC<LiquidityReportProps> = ({ title }) => {
    // Fetch data from Redux
    const { data: apiSafes = [], isLoading: safesLoading } = useGetSafesQuery();
    const { data: apiBanks = [], isLoading: banksLoading } = useGetBanksQuery();
    const { data: apiCustomers = [], isLoading: customersLoading } = useGetCustomersQuery();
    const { data: apiSuppliers = [], isLoading: suppliersLoading } = useGetSuppliersQuery();
    const { data: apiItems = [], isLoading: itemsLoading } = useGetItemsQuery(undefined);
    const { data: apiSalesInvoices = [], isLoading: salesLoading } = useGetSalesInvoicesQuery();
    const { data: apiPurchaseInvoices = [], isLoading: purchasesLoading } = useGetPurchaseInvoicesQuery();
    const { data: apiReceiptVouchers = [], isLoading: receiptsLoading } = useGetReceiptVouchersQuery();
    const { data: apiPaymentVouchers = [], isLoading: paymentsLoading } = useGetPaymentVouchersQuery();

    const isLoading = safesLoading || banksLoading || customersLoading || suppliersLoading || itemsLoading || salesLoading || purchasesLoading || receiptsLoading || paymentsLoading;

    // Transform API data to match component expectations
    const safes = useMemo<Safe[]>(() => {
        return apiSafes.map((safe) => ({
            id: safe.id,
            code: safe.code,
            name: safe.name,
            branchId: safe.branchId || '',
            branchName: safe.branchName || '',
            openingBalance: safe.openingBalance || 0,
            currentBalance: safe.currentBalance || 0,
            createdAt: safe.createdAt || '',
            updatedAt: safe.updatedAt || ''
        }));
    }, [apiSafes]);

    const banks = useMemo<Bank[]>(() => {
        return apiBanks.map((bank) => ({
            id: bank.id,
            code: bank.code,
            name: bank.name,
            accountNumber: bank.accountNumber || '',
            iban: bank.iban || '',
            openingBalance: bank.openingBalance || 0
        }));
    }, [apiBanks]);

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

    const suppliers = useMemo<Supplier[]>(() => {
        return apiSuppliers.map((supplier) => ({
            id: supplier.id,
            code: supplier.code,
            name: supplier.name,
            commercialReg: supplier.commercialReg || '',
            taxNumber: supplier.taxNumber || '',
            nationalAddress: supplier.nationalAddress || '',
            phone: supplier.phone || '',
            openingBalance: supplier.openingBalance || 0,
            currentBalance: supplier.currentBalance || 0
        }));
    }, [apiSuppliers]);

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

    const purchaseInvoices = useMemo<Invoice[]>(() => {
        return apiPurchaseInvoices.map((inv) => ({
            id: inv.id,
            date: inv.date,
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
    }, [apiPurchaseInvoices]);

    const receiptVouchers = useMemo<Voucher[]>(() => {
        return apiReceiptVouchers.map((v) => ({
            id: v.id,
            type: 'receipt' as const,
            date: v.date,
            entity: {
                type: v.entityType as any,
                id: v.customerId || v.supplierId || v.currentAccountId || null,
                name: v.entityName
            },
            amount: v.amount,
            description: v.description || '',
            paymentMethod: v.paymentMethod as 'safe' | 'bank',
            safeOrBankId: v.safeId || v.bankId ? parseInt(v.safeId || v.bankId || '0') : null,
            userName: '',
            branchName: v.branch?.name || ''
        }));
    }, [apiReceiptVouchers]);

    const paymentVouchers = useMemo<Voucher[]>(() => {
        return apiPaymentVouchers.map((v) => ({
            id: v.id,
            type: 'payment' as const,
            date: v.date,
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
    }, [apiPaymentVouchers]);

    const analysis = useMemo(() => {
        const today = new Date().toISOString().substring(0, 10);
        
        // 1. Current Assets (الأصول المتداولة)
        // Cash + Bank
        const totalCash = safes.reduce((sum, s) => sum + (s.openingBalance ?? 0), 0) 
            + receiptVouchers.filter(v => v.paymentMethod === 'safe').reduce((sum, v) => sum + (v.amount ?? 0), 0)
            - paymentVouchers.filter(v => v.paymentMethod === 'safe').reduce((sum, v) => sum + (v.amount ?? 0), 0)
            + salesInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'safe').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0); 

        const totalBank = banks.reduce((sum, b) => sum + (b.openingBalance ?? 0), 0)
             + receiptVouchers.filter(v => v.paymentMethod === 'bank').reduce((sum, v) => sum + (v.amount ?? 0), 0)
             - paymentVouchers.filter(v => v.paymentMethod === 'bank').reduce((sum, v) => sum + (v.amount ?? 0), 0)
             + salesInvoices.filter(i => i.paymentMethod === 'cash' && i.paymentTargetType === 'bank').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0);

        // Accounts Receivable (Customers)
        const totalReceivables = customers.reduce((sum, c) => sum + (c.openingBalance ?? 0), 0)
            + salesInvoices.filter(i => i.paymentMethod === 'credit').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0)
            - receiptVouchers.filter(v => v.entity?.type === 'customer').reduce((sum, v) => sum + (v.amount ?? 0), 0);

        // Inventory Value (Simplified Logic - assumes current stock * purchase price)
        const totalInventory = items.reduce((sum, item) => sum + ((item.stock ?? 0) * (item.purchasePrice ?? 0)), 0);

        const currentAssets = totalCash + totalBank + totalReceivables + totalInventory;
        const liquidAssets = totalCash + totalBank + totalReceivables; // Excluding inventory (Quick Ratio)

        // 2. Current Liabilities (الالتزامات المتداولة)
        // Accounts Payable (Suppliers)
        const totalPayables = Math.abs(suppliers.reduce((sum, s) => sum + (s.openingBalance ?? 0), 0))
            + purchaseInvoices.filter(i => i.paymentMethod === 'credit').reduce((sum, i) => sum + (i.totals?.net ?? 0), 0)
            - paymentVouchers.filter(v => v.entity?.type === 'supplier').reduce((sum, v) => sum + (v.amount ?? 0), 0);

        // VAT Payable (Simplified)
        const vatPayable = (salesInvoices.reduce((sum, i) => sum + (i.totals?.tax ?? 0), 0)) - (purchaseInvoices.reduce((sum, i) => sum + (i.totals?.tax ?? 0), 0));
        
        const currentLiabilities = totalPayables + (vatPayable > 0 ? vatPayable : 0);

        // 3. Ratios
        const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 999 : 0);
        const quickRatio = currentLiabilities > 0 ? (liquidAssets / currentLiabilities) : (liquidAssets > 0 ? 999 : 0);
        const cashRatio = currentLiabilities > 0 ? ((totalCash + totalBank) / currentLiabilities) : ((totalCash + totalBank) > 0 ? 999 : 0);

        // 4. Safety Status Assessment
        let safetyStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
        let safetyMessage = "";

        if (currentRatio >= 2.0) {
            safetyStatus = 'excellent';
            safetyMessage = "وضع مالي ممتاز (آمن جداً). الأصول تغطي الالتزامات بضعف القيمة.";
        } else if (currentRatio >= 1.5) {
            safetyStatus = 'good';
            safetyMessage = "وضع مالي جيد ومستقر.";
        } else if (currentRatio >= 1.0) {
            safetyStatus = 'warning';
            safetyMessage = "وضع حرج (مقبول). الأصول تكاد تغطي الالتزامات.";
        } else {
            safetyStatus = 'critical';
            safetyMessage = "وضع مالي خطر! الالتزامات تفوق الأصول المتداولة. يرجى الانتباه.";
        }

        return {
            totalCash, totalBank, totalReceivables, totalInventory, currentAssets,
            totalPayables, vatPayable, currentLiabilities,
            currentRatio, quickRatio, cashRatio,
            safetyStatus, safetyMessage
        };
    }, [safes, banks, customers, suppliers, items, salesInvoices, purchaseInvoices, receiptVouchers, paymentVouchers]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'excellent': return 'bg-emerald-100 text-emerald-800 border-emerald-500';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-500';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
            case 'critical': return 'bg-red-100 text-red-800 border-red-500';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handlePrint = () => window.print();

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
        <div className="bg-white p-6 rounded-lg shadow space-y-8">
            <div className="flex justify-between items-center border-b pb-4 no-print">
                <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
                <button onClick={handlePrint} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><PrintIcon/></button>
            </div>

            {/* Safety Indicator Banner */}
            <div className={`p-6 rounded-xl border-l-8 shadow-sm flex items-center gap-6 ${getStatusColor(analysis.safetyStatus)}`}>
                <div className="p-4 bg-white/50 rounded-full backdrop-blur-sm">
                    {analysis.safetyStatus === 'excellent' || analysis.safetyStatus === 'good' ? <ShieldIcon className="w-12 h-12"/> : <AlertTriangleIcon className="w-12 h-12"/>}
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold mb-1">حالة السيولة: {
                        analysis.safetyStatus === 'excellent' ? 'ممتازة' : 
                        analysis.safetyStatus === 'good' ? 'جيدة' : 
                        analysis.safetyStatus === 'warning' ? 'حذرة' : 'خطرة'
                    }</h2>
                    <p className="text-lg opacity-90 font-medium">{analysis.safetyMessage}</p>
                </div>
                <div className="mr-auto text-center hidden md:block">
                    <p className="text-sm uppercase tracking-widest opacity-70 font-bold">نسبة التداول</p>
                    <p className="text-4xl font-black">{analysis.currentRatio.toFixed(2)}</p>
                </div>
            </div>

            {/* Ratios Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة التداول (Current Ratio)</h3>
                        <ActivityIcon className="text-blue-500 w-6 h-6"/>
                    </div>
                    <p className="text-3xl font-bold text-brand-dark">{analysis.currentRatio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: 1.5 - 2.0</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">قدرة الشركة على سداد ديونها قصيرة الأجل باستخدام جميع أصولها المتداولة.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة السيولة السريعة (Quick)</h3>
                        <TrendingUpIcon className="text-purple-500 w-6 h-6"/>
                    </div>
                    <p className="text-3xl font-bold text-brand-dark">{analysis.quickRatio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">المعيار المقبول: {'>'} 1.0</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">القدرة على السداد دون الحاجة لبيع المخزون (النقد + الذمم المدينة).</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-600">نسبة النقدية (Cash Ratio)</h3>
                        <ShieldIcon className="text-green-500 w-6 h-6"/>
                    </div>
                    <p className="text-3xl font-bold text-brand-dark">{analysis.cashRatio.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">المعيار: يعتمد على النشاط</p>
                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-2 rounded">السيولة النقدية الفورية المتوفرة لتغطية الالتزامات الحالية.</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                        <h3 className="font-bold text-blue-800">الأصول المتداولة (Current Assets)</h3>
                        <span className="font-mono font-bold text-blue-700 text-lg">{formatNumber(analysis.currentAssets)}</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">النقدية بالخزينة</span>
                            <span className="font-bold">{formatNumber(analysis.totalCash)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الأرصدة البنكية</span>
                            <span className="font-bold">{formatNumber(analysis.totalBank)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الذمم المدينة (العملاء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalReceivables)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2">
                            <span className="text-gray-600">قيمة المخزون (بسعر الشراء)</span>
                            <span className="font-bold">{formatNumber(analysis.totalInventory)}</span>
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                        <h3 className="font-bold text-red-800">الالتزامات المتداولة (Current Liabilities)</h3>
                        <span className="font-mono font-bold text-red-700 text-lg">{formatNumber(analysis.currentLiabilities)}</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                            <span className="text-gray-600">الذمم الدائنة (الموردين)</span>
                            <span className="font-bold">{formatNumber(analysis.totalPayables)}</span>
                        </div>
                        <div className="flex justify-between text-sm pb-2">
                            <span className="text-gray-600">الضريبة المستحقة</span>
                            <span className="font-bold">{formatNumber(analysis.vatPayable > 0 ? analysis.vatPayable : 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiquidityReport;
