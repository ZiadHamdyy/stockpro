import React, { useState, useEffect } from 'react';
import type { Store, Branch, User } from '../../../types';

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (store: Store) => void;
    storeToEdit: Store | null;
    branches: Branch[];
    users: User[];
}

const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose, onSave, storeToEdit, branches, users }) => {
    const [storeData, setStoreData] = useState<Omit<Store, 'id'>>({ name: '', branch: '', manager: '' });

    useEffect(() => {
        if (storeToEdit) {
            setStoreData(storeToEdit);
        } else {
            setStoreData({ name: '', branch: '', manager: '' });
        }
    }, [storeToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStoreData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const storeToSave: Store = {
            ...storeData,
            id: storeToEdit?.id || 0,
        };
        onSave(storeToSave);
        onClose();
    };

    if (!isOpen) return null;

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{storeToEdit ? 'تعديل مخزن' : 'اضافة مخزن جديد'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المخزن</label>
                            <input type="text" id="name" name="name" value={storeData.name} onChange={handleChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="branch" className="block text-sm font-medium text-gray-700">الفرع التابع له</label>
                            <select id="branch" name="branch" value={storeData.branch} onChange={handleChange} className={inputStyle} required>
                                <option value="">اختر فرع...</option>
                                {branches.map(branch => <option key={branch.id} value={branch.name}>{branch.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="manager" className="block text-sm font-medium text-gray-700">أمين المخزن</label>
                            <select id="manager" name="manager" value={storeData.manager} onChange={handleChange} className={inputStyle} required>
                                <option value="">اختر أمين مخزن...</option>
                                {users.map(user => <option key={user.id} value={user.fullName}>{user.fullName}</option>)}
                            </select>
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

export default StoreModal;
