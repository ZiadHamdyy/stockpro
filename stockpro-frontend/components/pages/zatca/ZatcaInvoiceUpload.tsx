
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Invoice, CompanyInfo } from '../../../types';
import { 
    CloudUploadIcon, AlertTriangleIcon, SearchIcon, 
    RefreshCwIcon, CheckIcon, BoxIcon, ShieldIcon, XCircleIcon, ArrowLeftIcon, FilterIcon, CalendarIcon
} from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useGetSalesInvoicesQuery } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseReturnsQuery } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import type { SalesInvoice } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import type { PurchaseInvoice } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import type { SalesReturn } from '../../store/slices/salesReturn/salesReturnApiSlice';
import type { PurchaseReturn } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';

interface ZatcaInvoiceUploadProps {
    title: string;
    companyInfo: CompanyInfo;
    invoices: Invoice[]; 
    onUpdateStatus?: (id: string, status: 'reported' | 'failed', details?: string) => void;
}

interface SimulatedInvoice {
    id: string;
    date: string;
    customerName: string;
    amount: number;
    vat: number;
    total: number;
    status: 'pending' | 'processing' | 'reported' | 'failed';
    uuid?: string;
    error?: string;
    submissionTime?: string;
    type: 'Standard' | 'Simplified';
}

// إطار أيقونة احترافي بخلفية ملونة بالكامل (Solid Background)
const IconFrame: React.FC<{ children: React.ReactNode, bgColor?: string, shadowColor?: string }> = ({ children, bgColor = "bg-slate-100", shadowColor = "shadow-slate-200" }) => (
    <div className={`w-20 h-20 rounded-2xl ${bgColor} ${shadowColor} shadow-xl flex items-center justify-center transform transition-transform group-hover:scale-110 duration-300 text-white border-[3px] border-white ring-1 ring-black/5`}>
        {children}
    </div>
);

const ZatcaInvoiceUpload: React.FC<ZatcaInvoiceUploadProps> = ({ title, companyInfo, invoices, onUpdateStatus }) => {
    const { showToast } = useToast();
    
    // --- Data Fetching ---
    const { data: salesInvoices = [] } = useGetSalesInvoicesQuery();
    const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
    const { data: salesReturns = [] } = useGetSalesReturnsQuery();
    const { data: purchaseReturns = [] } = useGetPurchaseReturnsQuery();
    
    // --- State ---
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().substring(0, 10);
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().substring(0, 10));
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reported' | 'failed'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
    const [dataList, setDataList] = useState<SimulatedInvoice[]>([]);

    // Refs for programmatic date picking
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    // --- Transformation Functions ---
    const transformSalesInvoice = (invoice: SalesInvoice): SimulatedInvoice => {
        const hasCustomer = !!invoice.customer;
        return {
            id: invoice.code,
            date: invoice.date.substring(0, 10), // Ensure YYYY-MM-DD format
            customerName: invoice.customer?.name || 'عميل نقدي',
            amount: invoice.subtotal,
            vat: invoice.tax,
            total: invoice.net,
            status: 'pending',
            type: hasCustomer ? 'Standard' : 'Simplified',
        };
    };

    const transformPurchaseInvoice = (invoice: PurchaseInvoice): SimulatedInvoice => {
        const hasSupplier = !!invoice.supplier;
        return {
            id: invoice.code,
            date: invoice.date.substring(0, 10), // Ensure YYYY-MM-DD format
            customerName: invoice.supplier?.name || 'مورد نقدي',
            amount: invoice.subtotal,
            vat: invoice.tax,
            total: invoice.net,
            status: 'pending',
            type: hasSupplier ? 'Standard' : 'Simplified',
        };
    };

    const transformSalesReturn = (returnRecord: SalesReturn): SimulatedInvoice => {
        const hasCustomer = !!returnRecord.customer;
        return {
            id: returnRecord.code,
            date: returnRecord.date.substring(0, 10), // Ensure YYYY-MM-DD format
            customerName: returnRecord.customer?.name || 'عميل نقدي',
            amount: returnRecord.subtotal,
            vat: returnRecord.tax,
            total: returnRecord.net,
            status: 'pending',
            type: hasCustomer ? 'Standard' : 'Simplified',
        };
    };

    const transformPurchaseReturn = (returnRecord: PurchaseReturn): SimulatedInvoice => {
        const hasSupplier = !!returnRecord.supplier;
        return {
            id: returnRecord.code,
            date: returnRecord.date.substring(0, 10), // Ensure YYYY-MM-DD format
            customerName: returnRecord.supplier?.name || 'مورد نقدي',
            amount: returnRecord.subtotal,
            vat: returnRecord.tax,
            total: returnRecord.net,
            status: 'pending',
            type: hasSupplier ? 'Standard' : 'Simplified',
        };
    };

    // --- Combine All Data Sources ---
    useEffect(() => {
        const transformedData: SimulatedInvoice[] = [
            ...salesInvoices.map(transformSalesInvoice),
            ...purchaseInvoices.map(transformPurchaseInvoice),
            ...salesReturns.map(transformSalesReturn),
            ...purchaseReturns.map(transformPurchaseReturn),
        ];
        setDataList(transformedData);
    }, [salesInvoices, purchaseInvoices, salesReturns, purchaseReturns]);

    // --- Computed Values ---
    const filteredData = useMemo(() => {
        return dataList.filter(item => {
            const dateMatch = item.date >= startDate && item.date <= endDate;
            const statusMatch = filterStatus === 'all' || item.status === filterStatus;
            return dateMatch && statusMatch;
        });
    }, [dataList, startDate, endDate, filterStatus]);

    const stats = useMemo(() => {
        return {
            total: filteredData.length,
            pending: filteredData.filter(i => i.status === 'pending').length,
            reported: filteredData.filter(i => i.status === 'reported').length,
            failed: filteredData.filter(i => i.status === 'failed').length,
        };
    }, [filteredData]);

    // --- Actions ---
    const toggleSelectAll = () => {
        const uploadableItems = filteredData.filter(i => i.status === 'pending' || i.status === 'failed');
        if (selectedIds.size === uploadableItems.length && uploadableItems.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(uploadableItems.map(i => i.id)));
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // Helper to open picker on container click
    const showPicker = (ref: React.RefObject<HTMLInputElement>) => {
        try {
            if (ref.current) {
                if ('showPicker' in ref.current && typeof (ref.current as any).showPicker === 'function') {
                    (ref.current as any).showPicker();
                } else {
                    ref.current.focus();
                    ref.current.click();
                }
            }
        } catch (error) {
            // Fallback
        }
    };

    const handleSimulateUpload = async () => {
        const idsToUpload = Array.from(selectedIds);
        if (idsToUpload.length === 0) {
            showToast('الرجاء تحديد فواتير أولاً');
            return;
        }

        setIsGlobalProcessing(true);
        showToast('جاري الاتصال بمنصة "فاتورة" (ZATCA)...');

        // Simulate processing one by one
        for (const id of idsToUpload) {
            setDataList(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'processing' } : inv));
            await new Promise(resolve => setTimeout(resolve, 800)); // Network delay
            const isSuccess = Math.random() > 0.2; // 80% success rate

            setDataList(prev => prev.map(inv => {
                if (inv.id === id) {
                    const status = isSuccess ? 'reported' : 'failed';
                    // Update parent status if provided
                    if (onUpdateStatus) onUpdateStatus(id, status);
                    
                    return {
                        ...inv,
                        status: status,
                        uuid: isSuccess ? `urn:uuid:${Math.random().toString(36).substr(2, 9)}-zatca-compliant` : undefined,
                        error: isSuccess ? undefined : 'خطأ: الختم الرقمي (Cryptographic Stamp) غير صالح.',
                        submissionTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                    };
                }
                return inv;
            }));
        }

        setIsGlobalProcessing(false);
        setSelectedIds(new Set());
        showToast('تمت عملية المزامنة.');
    };

    return (
        <div 
            className="p-6 min-h-screen font-cairo text-slate-800 animate-fade-in pb-20 relative overflow-hidden"
            style={{
                backgroundColor: '#f0fdf4', // emerald-50 base
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    rgba(16, 185, 129, 0.03) 0px,
                    rgba(16, 185, 129, 0.03) 2px,
                    transparent 2px,
                    transparent 12px
                )`
            }}
        >
             {/* Styles to remove date picker icon and customize checkbox */}
            <style>{`
                /* Hide the default date picker icon (The small square) */
                input[type="date"]::-webkit-inner-spin-button,
                input[type="date"]::-webkit-calendar-picker-indicator {
                    display: none;
                    -webkit-appearance: none;
                }

                .custom-checkbox {
                    appearance: none;
                    background-color: #fff;
                    margin: 0;
                    font: inherit;
                    color: currentColor;
                    width: 1.5em;
                    height: 1.5em;
                    border: 2px solid #94a3b8;
                    border-radius: 0.35em;
                    display: grid;
                    place-content: center;
                    transition: all 0.2s ease-in-out;
                    cursor: pointer;
                }

                .custom-checkbox::before {
                    content: "";
                    width: 0.85em;
                    height: 0.85em;
                    transform: scale(0);
                    transition: 120ms transform ease-in-out;
                    box-shadow: inset 1em 1em white;
                    transform-origin: center;
                    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                }

                .custom-checkbox:checked {
                    background-color: #047857; /* Emerald-700 for ZATCA */
                    border-color: #047857;
                }
                
                .custom-checkbox:checked::before {
                    transform: scale(1);
                }

                .custom-checkbox:disabled {
                    background-color: #e2e8f0;
                    border-color: #cbd5e1;
                    cursor: not-allowed;
                }

                .animate-spin-slow { animation: spin 3s linear infinite; }
            `}</style>

            
            {/* Main Content Wrapper */}
            <div className="relative z-10">
                {/* Header Section Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12 items-center">
                    
                    {/* 1. Date Picker - Solid Green Container, Gray Inputs */}
                    <div className="flex flex-col md:flex-row justify-start items-center gap-3 order-1 xl:order-1">
                         <div className="bg-[#15803d] text-white p-3 rounded-2xl shadow-xl border border-emerald-600 flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                                <CalendarIcon className="w-6 h-6 text-white"/>
                            </div>
                            
                            {/* Start Date Input - Gray Box */}
                            <div 
                                className="flex items-center gap-2 group p-1"
                            >
                                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">من</span>
                                <div 
                                    className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 hover:bg-white transition-all shadow-inner relative cursor-pointer group-hover:ring-2 group-hover:ring-emerald-400"
                                    onClick={() => showPicker(startDateRef)}
                                >
                                    <input 
                                        ref={startDateRef}
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                        className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer w-32 outline-none text-center"
                                    />
                                </div>
                            </div>
                            
                            <ArrowLeftIcon className="w-4 h-4 text-emerald-300 hidden sm:block opacity-70"/>
                            
                            {/* End Date Input - Gray Box */}
                            <div 
                                className="flex items-center gap-2 group p-1"
                            >
                                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">إلى</span>
                                <div 
                                    className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 hover:bg-white transition-all shadow-inner relative cursor-pointer group-hover:ring-2 group-hover:ring-emerald-400"
                                    onClick={() => showPicker(endDateRef)}
                                >
                                    <input 
                                        ref={endDateRef}
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                        className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer w-32 outline-none text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* 2. ZATCA Word - BIG & CENTERED */}
                    <div className="hidden xl:flex justify-center items-center order-2 xl:order-2 w-full relative h-20">
                        <h1 className="text-8xl md:text-9xl font-black text-emerald-800/10 tracking-[0.2em] select-none scale-y-125 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-0">
                            ZATCA
                        </h1>
                        <h1 className="text-4xl font-black text-emerald-800 tracking-[0.5em] select-none z-10 relative">
                            ZATCA
                        </h1>
                    </div>

                    {/* 3. Page Title - LEFT Column (RTL) */}
                    <div className="flex flex-col items-end order-3 xl:order-3">
                        <h1 className="text-4xl font-black text-emerald-900 tracking-tight text-left drop-shadow-sm mb-1">الربط والفوترة الإلكترونية</h1>
                         <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs font-bold text-emerald-800 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                                المرحلة الثانية (ZATCA Phase 2)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards - FULL COLORED ICONS & LARGE TEXT */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total (Blue) */}
                    <div 
                        onClick={() => setFilterStatus('all')}
                        className={`bg-white border-b-4 border-blue-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${filterStatus === 'all' ? 'ring-2 ring-blue-500 transform scale-[1.02]' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2 pl-2">
                            <div>
                                <span className="text-base font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-blue-600 transition-colors">الكل (الإجمالي)</span>
                                <p className="text-6xl font-black text-slate-800 leading-none group-hover:text-blue-700 transition-colors">{stats.total}</p>
                            </div>
                            <IconFrame bgColor="bg-blue-600" shadowColor="shadow-blue-200">
                                <BoxIcon className="w-10 h-10 text-white"/>
                            </IconFrame>
                        </div>
                    </div>

                    {/* Pending (Amber) */}
                    <div 
                        onClick={() => setFilterStatus('pending')}
                        className={`bg-white border-b-4 border-amber-500 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${filterStatus === 'pending' ? 'ring-2 ring-amber-500 transform scale-[1.02]' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2 pl-2">
                            <div>
                                <span className="text-base font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-amber-600 transition-colors">قيد الانتظار</span>
                                <p className="text-6xl font-black text-slate-800 leading-none group-hover:text-amber-600 transition-colors">{stats.pending}</p>
                            </div>
                            <IconFrame bgColor="bg-amber-500" shadowColor="shadow-amber-200">
                                <CloudUploadIcon className="w-10 h-10 text-white"/>
                            </IconFrame>
                        </div>
                    </div>

                    {/* Reported (Green) */}
                    <div 
                        onClick={() => setFilterStatus('reported')}
                        className={`bg-white border-b-4 border-emerald-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${filterStatus === 'reported' ? 'ring-2 ring-emerald-600 transform scale-[1.02]' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2 pl-2">
                            <div>
                                <span className="text-base font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-emerald-700 transition-colors">تم الاعتماد</span>
                                <p className="text-6xl font-black text-slate-800 leading-none group-hover:text-emerald-700 transition-colors">{stats.reported}</p>
                            </div>
                            <IconFrame bgColor="bg-emerald-600" shadowColor="shadow-emerald-200">
                                <ShieldIcon className="w-10 h-10 text-white"/>
                            </IconFrame>
                        </div>
                    </div>

                    {/* Failed (Red) */}
                    <div 
                        onClick={() => setFilterStatus('failed')}
                        className={`bg-white border-b-4 border-rose-600 p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group ${filterStatus === 'failed' ? 'ring-2 ring-rose-500 transform scale-[1.02]' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2 pl-2">
                            <div>
                                <span className="text-base font-bold text-slate-500 uppercase tracking-wider block mb-1 group-hover:text-rose-600 transition-colors">مرفوضة / خطأ</span>
                                <p className="text-6xl font-black text-slate-800 leading-none group-hover:text-rose-600 transition-colors">{stats.failed}</p>
                            </div>
                            <IconFrame bgColor="bg-rose-600" shadowColor="shadow-rose-200">
                                <AlertTriangleIcon className="w-10 h-10 text-white"/>
                            </IconFrame>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-emerald-100 sticky top-4 z-20">
                    <div className="flex p-1 bg-slate-100 rounded-xl w-full lg:w-auto gap-1">
                        {/* Filter Buttons */}
                        {['all', 'pending', 'reported', 'failed'].map((status) => {
                            const label = status === 'all' ? 'الكل' : status === 'pending' ? 'المعلقة' : status === 'reported' ? 'المرسلة' : 'المرفوضة';
                            const activeColor = status === 'all' ? 'bg-blue-600' : status === 'pending' ? 'bg-amber-500' : status === 'reported' ? 'bg-emerald-600' : 'bg-rose-600';
                            const shadowColor = status === 'all' ? 'shadow-blue-200' : status === 'pending' ? 'shadow-amber-200' : status === 'reported' ? 'shadow-emerald-200' : 'shadow-rose-200';
                            
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status as any)}
                                    className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-xs font-black transition-all ${
                                        filterStatus === status 
                                        ? `${activeColor} text-white shadow-lg ${shadowColor}` 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
                        {selectedIds.size > 0 && (
                            <div className="text-xs font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 animate-fade-in flex items-center gap-2">
                                <CheckIcon className="w-4 h-4 text-emerald-600"/>
                                تم تحديد <span className="text-indigo-700 mx-1 text-lg">{selectedIds.size}</span> فاتورة
                            </div>
                        )}
                        <button 
                            onClick={handleSimulateUpload}
                            disabled={selectedIds.size === 0 || isGlobalProcessing}
                            className={`
                                px-6 py-2.5 rounded-xl font-bold text-white text-sm shadow-xl flex items-center gap-3 transition-all transform active:scale-95 border-b-4
                                ${selectedIds.size === 0 
                                    ? 'bg-slate-300 border-slate-400 cursor-not-allowed shadow-none text-slate-500' 
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-900 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-200'
                                }
                            `}
                        >
                            {isGlobalProcessing ? (
                                <>
                                    <RefreshCwIcon className="w-5 h-5 animate-spin"/>
                                    جاري الاتصال...
                                </>
                            ) : (
                                <>
                                    <CloudUploadIcon className="w-5 h-5"/>
                                    رفع إلى الهيئة
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div 
                    className="rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden relative min-h-[400px] bg-white/80 backdrop-blur-sm"
                >
                     {/* 2. TABLE WATERMARK (ZATCA) - Large and Centered */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                        <div className="transform -rotate-12 opacity-[0.05] select-none text-center">
                            <h1 className="text-[12rem] md:text-[16rem] font-black text-emerald-900 tracking-tighter leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>ZATCA</h1>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <table className="min-w-full divide-y divide-emerald-100/50">
                            <thead className="bg-[#0f172a] text-white">
                                <tr>
                                    <th className="w-20 px-6 py-5 text-center border-b border-slate-700">
                                        <div className="flex justify-center items-center">
                                            <input 
                                                type="checkbox" 
                                                className="custom-checkbox"
                                                onChange={toggleSelectAll}
                                                checked={filteredData.length > 0 && filteredData.filter(i => i.status === 'pending' || i.status === 'failed').every(i => selectedIds.has(i.id)) && selectedIds.size > 0}
                                            />
                                        </div>
                                    </th>
                                    <th className="px-6 py-5 text-right text-sm font-black uppercase tracking-wider border-b border-slate-700">بيانات الفاتورة</th>
                                    <th className="px-6 py-5 text-right text-sm font-black uppercase tracking-wider border-b border-slate-700">النوع / العميل</th>
                                    <th className="px-6 py-5 text-center text-sm font-black uppercase tracking-wider border-b border-slate-700">الإجمالي</th>
                                    <th className="px-6 py-5 text-center text-sm font-black uppercase tracking-wider border-b border-slate-700">الحالة</th>
                                    <th className="px-6 py-5 text-left text-sm font-black uppercase tracking-wider w-1/3 border-b border-slate-700">الرد (Response)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100/50 bg-transparent">
                                {filteredData.map((row) => {
                                    const isSelected = selectedIds.has(row.id);
                                    const isProcessing = row.status === 'processing';

                                    return (
                                        <tr 
                                            key={row.id} 
                                            className={`group transition-all duration-200 ${isSelected ? 'bg-emerald-100/50' : 'hover:bg-white/60'}`}
                                        >
                                            <td className="px-6 py-5 text-center">
                                                 <div className="flex justify-center items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="custom-checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelection(row.id)}
                                                        disabled={row.status === 'reported' || isProcessing}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-800 font-mono tracking-tight w-fit rounded mb-1">{row.id}</span>
                                                    <span className="text-xs text-slate-500 font-bold">{row.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">{row.customerName}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100/80 w-fit px-2 py-1 rounded mt-1 border border-slate-200">
                                                        {row.type === 'Standard' ? 'ضريبية (Standard)' : 'مبسطة (Simplified)'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-lg font-black text-slate-900 block">{row.total.toLocaleString()}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">SAR</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {row.status === 'pending' && (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                                        معلق
                                                    </span>
                                                )}
                                                {row.status === 'processing' && (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                                        <RefreshCwIcon className="w-3 h-3 animate-spin"/>
                                                        جاري المعالجة
                                                    </span>
                                                )}
                                                {row.status === 'reported' && (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                                        <CheckIcon className="w-3 h-3"/>
                                                        تم الإرسال
                                                    </span>
                                                )}
                                                {row.status === 'failed' && (
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
                                                        <XCircleIcon className="w-3 h-3"/>
                                                        فشل
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-left align-top">
                                                {row.status === 'reported' && (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider bg-emerald-50/80 w-fit px-2 py-1 rounded border border-emerald-100 shadow-sm">
                                                            <ShieldIcon className="w-3 h-3"/>
                                                            تم الاعتماد / مبلغة
                                                            <span className="text-emerald-500 font-medium normal-case ml-2 border-l border-emerald-200 pl-2">{row.submissionTime}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 font-mono truncate max-w-[220px] block select-all cursor-text font-bold" title={row.uuid}>
                                                                UUID: {row.uuid}
                                                            </code>
                                                        </div>
                                                    </div>
                                                )}
                                                {row.status === 'failed' && (
                                                    <div className="bg-rose-50/80 border border-rose-100 p-2 rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-2 text-rose-700 text-xs font-bold mb-1">
                                                            <AlertTriangleIcon className="w-3 h-3"/>
                                                            مرفوضة من الهيئة
                                                            <span className="text-rose-400 font-medium ml-auto">{row.submissionTime}</span>
                                                        </div>
                                                        <p className="text-[10px] text-rose-600 leading-snug font-bold">{row.error}</p>
                                                    </div>
                                                )}
                                                {(row.status === 'pending' || row.status === 'processing') && (
                                                    <span className="text-slate-400 text-xs font-bold italic pl-1 bg-white/50 px-2 py-1 rounded">
                                                        ... بانتظار الرد
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <div className="bg-slate-100 p-6 rounded-full mb-4">
                                                    <FilterIcon className="w-12 h-12 text-slate-400"/>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد فواتير</h3>
                                                <p className="text-sm text-slate-500">حاول تغيير معايير البحث أو التاريخ</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZatcaInvoiceUpload;
