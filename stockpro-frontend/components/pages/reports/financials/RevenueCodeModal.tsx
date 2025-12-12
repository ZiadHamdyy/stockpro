
import React, { useState, useEffect } from 'react';
import type { RevenueCode } from '../../../../types';

interface RevenueCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (code: RevenueCode) => void;
    codeToEdit: RevenueCode | null;
    codes: RevenueCode[];
}

const RevenueCodeModal: React.FC<RevenueCodeModalProps> = ({ isOpen, onClose, onSave, codeToEdit, codes }) => {
    const [codeData, setCodeData] = useState<Omit<RevenueCode, 'id'>>({ code: '', name: '' });

    useEffect(() => {
        if (codeToEdit) {
            setCodeData(codeToEdit);
        } else {
            const existingNumbers = codes
                .map(c => c.code.startsWith('REV-') ? parseInt(c.code.substring(4), 10) : NaN)
                .filter(n => !isNaN(n));
            const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
            const newCode = `REV-${String(maxNumber + 1).padStart(3, '0')}`;

            setCodeData({ code: newCode, name: '' });
        }
    }, [codeToEdit, isOpen, codes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCodeData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const codeToSave: RevenueCode = {
            ...codeData,
            id: codeToEdit?.id || Date.now(),
        };
        onSave(codeToSave);
        onClose();
    };

    if (!isOpen) return null;
    
    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{codeToEdit ? 'تعديل بند إيراد' : 'اضافة بند إيراد جديد'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                         <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">كود البند</label>
                            <input type="text" id="code" name="code" value={codeData.code} className={inputStyle + " bg-gray-200"} required readOnly />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم بند الإيراد</label>
                            <input type="text" id="name" name="name" value={codeData.name} onChange={handleChange} className={inputStyle} required />
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

export default RevenueCodeModal;
