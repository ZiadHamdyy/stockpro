
import React, { useState, useEffect, useMemo } from 'react';
import type { CompanyInfo, Item, Store, InventoryCount, InventoryCountItem } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, BoxIcon, DollarSignIcon, ListIcon, DatabaseIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { formatNumber, exportToExcel, exportToPdf } from '../../../utils/formatting';
import DataTableModal from '../../common/DataTableModal';

interface InventoryCountProps {
    title: string;
    companyInfo: CompanyInfo;
    items: Item[];
    stores: Store[];
    onSave: (count: InventoryCount) => void;
    inventoryCounts: InventoryCount[];
}

const InventoryCountPage: React.FC<InventoryCountProps> = ({ title, companyInfo, items, stores, onSave, inventoryCounts }) => {
    const [countId, setCountId] = useState<string>('');
    const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
    const [selectedStore, setSelectedStore] = useState(stores.length > 0 ? stores[0].name : '');
    const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'pending' | 'posted'>('pending');
    
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { showToast } = useToast();
    const { showModal } = useModal();

    // Initialize new count
    const initializeCount = () => {
        const newId = `INV-${Date.now()}`;
        setCountId(newId);
        setNotes('');
        setStatus('pending');
        setDate(new Date().toISOString().substring(0, 10));
        const initialCountItems = items.map(item => ({
            id: item.code,
            name: item.name,
            unit: item.unit,
            systemStock: item.stock,
            actualStock: item.stock,
            difference: 0,
            cost: item.purchasePrice
        }));
        setCountItems(initialCountItems);
    };

    useEffect(() => {
        // Only initialize if we don't have items or explicit ID yet (on mount)
        if (countItems.length === 0) {
            initializeCount();
        }
    }, [items]);

    const handleActualChange = (id: string, val: string) => {
        if (status === 'posted') return; // Read-only if posted

        const actual = parseFloat(val);
        if (isNaN(actual)) return;

        setCountItems(prev => prev.map(item => {
            if (item.id === id) {
                const difference = actual - item.systemStock;
                return { ...item, actualStock: actual, difference };
            }
            return item;
        }));
    };

    const filteredItems = countItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Totals
    const stats = useMemo(() => {
        let totalSurplusVal = 0;
        let totalShortageVal = 0;
        let surplusCount = 0;
        let shortageCount = 0;

        filteredItems.forEach(item => {
            const varianceValue = item.difference * item.cost;
            if (item.difference > 0) {
                totalSurplusVal += varianceValue;
                surplusCount++;
            } else if (item.difference < 0) {
                totalShortageVal += Math.abs(varianceValue);
                shortageCount++;
            }
        });

        return {
            totalItems: filteredItems.length,
            surplusCount,
            shortageCount,
            totalSurplusValue: totalSurplusVal,
            totalShortageValue: totalShortageVal,
            netSettlementValue: totalSurplusVal - totalShortageVal
        };
    }, [filteredItems]);

    const saveCount = (newStatus: 'pending' | 'posted') => {
        const inventoryCount: InventoryCount = {
            id: countId,
            date,
            storeName: selectedStore,
            branchName: stores.find(s => s.name === selectedStore)?.branch || '',
            items: countItems,
            totalVarianceValue: stats.netSettlementValue,
            status: newStatus,
            notes
        };
        onSave(inventoryCount);
        setStatus(newStatus);
    };

    const handleSaveDraft = () => {
        saveCount('pending');
        showToast('تم حفظ الجرد كمسودة بنجاح.');
    };

    const handlePostSettlement = () => {
        const changedItems = countItems.filter(i => i.difference !== 0);
        const message = changedItems.length === 0 
            ? "لا يوجد فروقات في الجرد. سيتم اعتماد الجرد كمطابق. هل أنت متأكد؟"
            : `يوجد فروقات في ${changedItems.length} صنف بقيمة صافية ${formatNumber(stats.netSettlementValue)}. سيتم اعتماد الجرد وإنشاء أذونات تسوية تلقائياً. لا يمكن التراجع عن هذا الإجراء.`;

        showModal({
            title: 'اعتماد التسوية النهائية',
            message: message,
            onConfirm: () => {
                saveCount('posted');
                showToast('تم اعتماد الجرد وإنشاء قيود التسوية بنجاح.');
            },
            type: 'edit',
            showPassword: true
        });
    };

    const loadHistoricalCount = (row: any) => {
        const count = inventoryCounts.find(c => c.id === row.id);
        if (count) {
            setCountId(count.id);
            setDate(count.date);
            setSelectedStore(count.storeName);
            setNotes(count.notes);
            setCountItems(count.items);
            setStatus(count.status);
            setIsHistoryOpen(false);
            showToast(`تم تحميل سجل الجرد رقم ${count.id}`);
        }
    };

    const handleExcelExport = () => {
        const data = filteredItems.map((item, index) => ({
            'م': index + 1,
            'كود الصنف': item.id,
            'اسم الصنف': item.name,
            'الوحدة': item.unit,
            'الرصيد الدفتري': item.systemStock,
            'الرصيد الفعلي': item.actualStock,
            'الفرق': item.difference,
            'الحالة': item.difference > 0 ? 'زيادة' : (item.difference < 0 ? 'عجز' : 'مطابق'),
            'سعر التكلفة': item.cost,
            'قيمة الفرق': (item.difference * item.cost).toFixed(2)
        }));
        exportToExcel(data, `جرد_مخزون_${selectedStore}_${date}`);
    };

    const handlePdfExport = () => {
        const head = [['قيمة الفرق', 'سعر التكلفة', 'الحالة', 'الفرق', 'الرصيد الفعلي', 'الرصيد الدفتري', 'الوحدة', 'اسم الصنف', 'كود الصنف', 'م']];
        const body = filteredItems.map((item, index) => [
            (item.difference * item.cost).toFixed(2),
            item.cost.toFixed(2),
            item.difference !== 0 ? (item.difference > 0 ? 'زيادة' : 'عجز') : 'مطابق',
            item.difference,
            item.actualStock,
            item.systemStock,
            item.unit,
            item.name,
            item.id,
            (index + 1).toString()
        ]);
        
        const footer = [
            ['', '', '', '', '', '', '', '', 'إجمالي الزيادة', formatNumber(stats.totalSurplusValue)],
            ['', '', '', '', '', '', '', '', 'إجمالي العجز', formatNumber(stats.totalShortageValue)],
            ['', '', '', '', '', '', '', '', 'صافي التسوية', formatNumber(stats.netSettlementValue)],
        ];

        exportToPdf(`تقرير جرد مخزن ${selectedStore}`, head, body, `جرد_${date}`, companyInfo, footer);
    };

    const inputStyle = "w-full p-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-200 disabled:cursor-not-allowed";

    return (
        <div className="flex flex-col h-full space-y-4 pr-2">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-lg shadow flex-shrink-0">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-4">
                        {companyInfo.logo && <img src={companyInfo.logo} alt="Logo" className="h-14 w-auto" />}
                        <div>
                            <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {status === 'posted' ? 'معتمد (مرحل)' : 'مسودة (قيد العمل)'}
                                </span>
                                <p className="text-sm text-gray-500">{countId}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsHistoryOpen(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2 border border-gray-300 font-medium">
                            <DatabaseIcon className="w-5 h-5"/>
                            <span>سجل الجرد</span>
                        </button>
                        <button onClick={() => initializeCount()} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-medium">جرد جديد</button>
                        <button onClick={handleExcelExport} title="تصدير Excel" className="p-2 border rounded-md hover:bg-gray-100 text-green-700"><ExcelIcon/></button>
                        <button onClick={handlePdfExport} title="طباعة" className="p-2 border rounded-md hover:bg-gray-100 text-gray-700"><PrintIcon/></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الجرد</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputStyle} disabled={status === 'posted'} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">المخزن</label>
                        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className={inputStyle} disabled={status === 'posted'}>
                            {stores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputStyle} placeholder="ملاحظات عامة على الجرد" disabled={status === 'posted'} />
                    </div>
                </div>
            </div>

            {/* Search & Stats Summary Bar */}
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center flex-shrink-0">
                 <div className="relative w-1/3">
                    <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="بحث بكود أو اسم الصنف..." 
                        className={inputStyle + " pr-10"} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-600"><BoxIcon className="w-4 h-4"/></div>
                        <div>
                            <p className="text-gray-500 text-xs">إجمالي الأصناف</p>
                            <p className="font-bold">{stats.totalItems}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex-grow flex flex-col min-h-[60vh]">
                <div className="overflow-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-16 border-l border-blue-400">م</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold w-32 border-l border-blue-400">الكود</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold border-l border-blue-400">اسم الصنف</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-20 border-l border-blue-400">الوحدة</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold bg-blue-900 w-24 border-l border-blue-400">الرصيد الدفتري</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold bg-green-700 w-32 border-l border-blue-400">الرصيد الفعلي</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 border-l border-blue-400">الفرق</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 border-l border-blue-400">الحالة</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24 bg-gray-600 border-l border-gray-500">السعر</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-32 bg-gray-700">قيمة الفرق</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item, index) => {
                                const varianceValue = item.difference * item.cost;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700 font-mono">{item.id}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-brand-dark">{item.name}</td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-500">{item.unit}</td>
                                        <td className="px-4 py-2 text-center text-sm font-bold bg-blue-50 text-blue-900">{item.systemStock}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input 
                                                type="number" 
                                                value={item.actualStock} 
                                                onChange={(e) => handleActualChange(item.id, e.target.value)}
                                                className="w-24 p-1.5 text-center border border-gray-300 rounded bg-white focus:ring-2 focus:ring-brand-green focus:border-brand-green font-bold text-gray-900 shadow-inner"
                                                onFocus={(e) => e.target.select()}
                                                disabled={status === 'posted'}
                                            />
                                        </td>
                                        <td className={`px-4 py-2 text-center font-bold text-sm ${item.difference < 0 ? 'text-red-600' : item.difference > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {item.difference > 0 ? '+' : ''}{item.difference}
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs">
                                            {item.difference === 0 && <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600 border border-gray-200">مطابق</span>}
                                            {item.difference < 0 && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">عجز</span>}
                                            {item.difference > 0 && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">زيادة</span>}
                                        </td>
                                        <td className="px-4 py-2 text-center text-sm text-gray-600 bg-gray-50">{formatNumber(item.cost)}</td>
                                        <td className={`px-4 py-2 text-center font-bold text-sm bg-gray-50 ${varianceValue < 0 ? 'text-red-600' : varianceValue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {formatNumber(varianceValue)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Totals Section */}
            <div className="bg-white p-4 rounded-lg shadow border-t-4 border-brand-blue flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Total Surplus Card */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-green-800 text-xs font-bold mb-1">إجمالي الزيادة</p>
                                <p className="text-xs text-green-600 font-semibold mb-1">عدد الأصناف: {stats.surplusCount}</p>
                                <p className="text-xl font-bold text-green-700">{formatNumber(stats.totalSurplusValue)} <span className="text-xs">SAR</span></p>
                            </div>
                            <div className="p-2 bg-green-200 rounded-full text-green-700"><DollarSignIcon className="w-5 h-5"/></div>
                        </div>
                    </div>

                    {/* Total Shortage Card */}
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-red-800 text-xs font-bold mb-1">إجمالي العجز</p>
                                <p className="text-xs text-red-600 font-semibold mb-1">عدد الأصناف: {stats.shortageCount}</p>
                                <p className="text-xl font-bold text-red-700">{formatNumber(stats.totalShortageValue)} <span className="text-xs">SAR</span></p>
                            </div>
                            <div className="p-2 bg-red-200 rounded-full text-red-700"><DollarSignIcon className="w-5 h-5"/></div>
                        </div>
                    </div>

                    {/* Net Value Card */}
                    <div className={`p-3 rounded-lg border flex justify-between items-center h-full ${stats.netSettlementValue >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex flex-col justify-center h-full">
                            <p className="text-gray-800 text-sm font-bold mb-2">صافي قيمة التسوية</p>
                            <p className={`text-2xl font-bold ${stats.netSettlementValue >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatNumber(stats.netSettlementValue)} <span className="text-sm">SAR</span></p>
                        </div>
                        <div className="p-2 bg-white rounded-full shadow-sm text-gray-700 font-bold text-xl">=</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handleSaveDraft}
                            disabled={status === 'posted'}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>حفظ مؤقت (مسودة)</span>
                        </button>
                        <button 
                            onClick={handlePostSettlement}
                            disabled={status === 'posted'}
                            className="w-full px-4 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-800 font-bold text-lg shadow-md flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>اعتماد التسوية وترحيل القيود</span>
                        </button>
                    </div>
                </div>
            </div>

            <DataTableModal 
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title="سجل عمليات الجرد"
                columns={[
                    { Header: 'رقم الجرد', accessor: 'id' },
                    { Header: 'التاريخ', accessor: 'date' },
                    { Header: 'المخزن', accessor: 'storeName' },
                    { Header: 'الحالة', accessor: 'status' },
                    { Header: 'صافي الفروقات', accessor: 'totalVarianceValue' },
                ]}
                data={inventoryCounts.map(c => ({...c, totalVarianceValue: formatNumber(c.totalVarianceValue), status: c.status === 'posted' ? 'معتمد' : 'مسودة'}))}
                onSelectRow={loadHistoricalCount}
            />
        </div>
    );
};

export default InventoryCountPage;
