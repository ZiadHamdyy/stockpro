
import React, { useState } from 'react';
import type { FiscalYear } from '../../../types';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { LockIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon } from '../../icons';

interface FiscalYearsProps {
    title?: string;
    fiscalYears?: FiscalYear[];
    onSave: (year: FiscalYear) => void;
    onToggleStatus: (id: number) => void;
}

const FiscalYears: React.FC<FiscalYearsProps> = ({ title, fiscalYears = [], onSave, onToggleStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYear, setNewYear] = useState<Partial<FiscalYear>>({
        name: (new Date().getFullYear() + 1).toString(),
        startDate: `${new Date().getFullYear() + 1}-01-01`,
        endDate: `${new Date().getFullYear() + 1}-12-31`,
        status: 'open'
    });
    const { showToast } = useToast();
    const { showModal } = useModal();

    const handleAddYear = () => {
        if (!newYear.name || !newYear.startDate || !newYear.endDate) {
            showToast("الرجاء تعبئة جميع البيانات");
            return;
        }
        onSave({
            id: Date.now(),
            name: newYear.name,
            startDate: newYear.startDate,
            endDate: newYear.endDate,
            status: 'open',
            isCurrent: false
        } as FiscalYear);
        setIsModalOpen(false);
        showToast("تم إضافة السنة المالية بنجاح");
    };

    const confirmToggleStatus = (year: FiscalYear) => {
        if (year.status === 'closed') {
            showModal({
                title: 'إعادة فتح السنة المالية',
                message: `هل أنت متأكد من إعادة فتح السنة المالية ${year.name}؟ هذا سيسمح بتعديل البيانات.`,
                onConfirm: () => {
                    onToggleStatus(year.id);
                    showToast(`تم فتح السنة المالية ${year.name}`);
                },
                type: 'edit',
                showPassword: true
            });
        } else {
            showModal({
                title: 'إغلاق السنة المالية',
                message: `هل أنت متأكد من إغلاق السنة المالية ${year.name}؟ سيمنع هذا أي تعديلات على البيانات في هذه الفترة.`,
                onConfirm: () => {
                    onToggleStatus(year.id);
                    showToast(`تم إغلاق السنة المالية ${year.name}`);
                },
                type: 'delete', // Using red theme for caution
                showPassword: true
            });
        }
    };

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    const sortedFiscalYears = [...fiscalYears].sort((a, b) =>
        b.name.localeCompare(a.name)
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-brand-dark">{title ?? "الفترات المحاسبية"}</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">
                    سنة مالية جديدة
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedFiscalYears.map(year => (
                    <div key={year.id} className={`border-2 rounded-lg p-4 flex justify-between items-center ${year.status === 'open' ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-brand-dark">{year.name}</h3>
                                {year.status === 'open' ? (
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
                                من: <span className="font-mono font-bold">{year.startDate}</span> إلى: <span className="font-mono font-bold">{year.endDate}</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-center px-4 border-l border-gray-300 hidden md:block">
                                <p className="text-xs text-gray-500">صافي الربح/الخسارة (تقديري)</p>
                                <p className="font-bold text-lg text-brand-blue">---</p>
                            </div>
                            <button 
                                onClick={() => confirmToggleStatus(year)}
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 ${
                                    year.status === 'open' 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                            >
                                {year.status === 'open' ? (
                                    <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                                ) : (
                                    <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                                )}
                            </button>
                        </div>
                    </div>
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
                            <button onClick={handleAddYear} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800">حفظ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalYears;