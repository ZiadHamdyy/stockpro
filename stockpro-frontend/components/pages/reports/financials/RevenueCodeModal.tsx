
import React, { useState, useEffect } from 'react';
import type { RevenueCode } from '../../../../components/store/slices/revenueCode/revenueCodeApiSlice';

interface RevenueCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (code: RevenueCode) => void;
    codeToEdit: RevenueCode | null;
}

const RevenueCodeModal: React.FC<RevenueCodeModalProps> = ({ isOpen, onClose, onSave, codeToEdit }) => {
    const [codeData, setCodeData] = useState<{ code: string; name: string }>({ code: '', name: '' });

    useEffect(() => {
        if (codeToEdit) {
            setCodeData({ code: codeToEdit.code, name: codeToEdit.name });
        } else {
            setCodeData({ code: '', name: '' });
        }
    }, [codeToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCodeData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const codeToSave: RevenueCode = {
            id: codeToEdit?.id || '',
            code: codeToEdit?.code || '',
            name: codeData.name,
            createdAt: codeToEdit?.createdAt || new Date().toISOString(),
            updatedAt: codeToEdit?.updatedAt || new Date().toISOString(),
        };
        onSave(codeToSave);
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
                            <input 
                                type="text" 
                                id="code" 
                                name="code" 
                                value={codeToEdit ? codeData.code : ''} 
                                className={inputStyle + " bg-gray-200"} 
                                required 
                                readOnly 
                            />
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
