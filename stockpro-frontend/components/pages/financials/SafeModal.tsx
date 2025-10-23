import React, { useState, useEffect } from 'react';
import type { Safe, Branch } from '../../../types';

interface SafeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (safe: Safe) => void;
    safeToEdit: Safe | null;
    branches: Branch[];
    safes: Safe[];
}

const SafeModal: React.FC<SafeModalProps> = ({ isOpen, onClose, onSave, safeToEdit, branches, safes }) => {
    const [safeData, setSafeData] = useState<Omit<Safe, 'id'>>({ code: '', name: '', branch: '', openingBalance: 0 });

    useEffect(() => {
        if (safeToEdit) {
            setSafeData(safeToEdit);
        } else {
            const nextCodeNumber = safes.length > 0 ? Math.max(...safes.map(s => parseInt(s.code.replace('SF-', ''), 10) || 0)) + 1 : 1;
            const newCode = `SF-${String(nextCodeNumber).padStart(3, '0')}`;
            setSafeData({ code: newCode, name: '', branch: '', openingBalance: 0 });
        }
    }, [safeToEdit, isOpen, safes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSafeData(prev => ({ 
            ...prev, 
            [name]: name === 'openingBalance' ? parseFloat(value) || 0 : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const safeToSave: Safe = {
            ...safeData,
            id: safeToEdit?.id || 0,
        };
        onSave(safeToSave);
        onClose();
    };

    if (!isOpen) return null;

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{safeToEdit ? 'تعديل خزنة' : 'اضافة خزنة جديدة'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">كود الخزنة</label>
                            <input type="text" id="code" name="code" value={safeData.code} className={inputStyle + " bg-gray-200"} required readOnly />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم الخزنة</label>
                            <input type="text" id="name" name="name" value={safeData.name} onChange={handleChange} className={inputStyle} required />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="branch" className="block text-sm font-medium text-gray-700">الفرع</label>
                            <select id="branch" name="branch" value={safeData.branch} onChange={handleChange} className={inputStyle} required>
                                <option value="">اختر فرع...</option>
                                {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">الرصيد الافتتاحي</label>
                            <input type="number" id="openingBalance" name="openingBalance" value={safeData.openingBalance} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SafeModal;