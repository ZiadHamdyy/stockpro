import React, { useState, useEffect } from 'react';
import type { ExpenseType } from '../../../types';

interface ExpenseTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (type: ExpenseType) => void;
    typeToEdit: ExpenseType | null;
}

const ExpenseTypeModal: React.FC<ExpenseTypeModalProps> = ({ isOpen, onClose, onSave, typeToEdit }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (typeToEdit) {
            setName(typeToEdit.name);
        } else {
            setName('');
        }
    }, [typeToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const typeToSave: ExpenseType = {
            name,
            id: typeToEdit?.id || 0,
        };
        onSave(typeToSave);
        onClose();
    };

    if (!isOpen) return null;
    
    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{typeToEdit ? 'تعديل نوع مصروف' : 'اضافة نوع مصروف جديد'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم النوع</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} required />
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

export default ExpenseTypeModal;
