import React, { useState, useEffect } from 'react';
import type { ItemGroup } from '../../../types';

interface ItemGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: ItemGroup) => void;
    groupToEdit: ItemGroup | null;
}

const ItemGroupModal: React.FC<ItemGroupModalProps> = ({ isOpen, onClose, onSave, groupToEdit }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
        } else {
            setName('');
        }
    }, [groupToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const groupToSave: ItemGroup = {
            name,
            id: groupToEdit?.id || 0,
        };
        onSave(groupToSave);
        onClose();
    };

    if (!isOpen) return null;
    
    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{groupToEdit ? 'تعديل مجموعة' : 'اضافة مجموعة جديدة'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المجموعة</label>
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

export default ItemGroupModal;
