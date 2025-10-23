import React, { useState, useEffect } from 'react';
import type { Branch } from '../../../types';

interface BranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (branch: Branch) => void;
    branchToEdit: Branch | null;
}

const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, onSave, branchToEdit }) => {
    const [branchData, setBranchData] = useState<Omit<Branch, 'id'>>({ name: '', address: '', phone: '' });

    useEffect(() => {
        if (branchToEdit) {
            setBranchData(branchToEdit);
        } else {
            setBranchData({ name: '', address: '', phone: '' });
        }
    }, [branchToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBranchData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const branchToSave: Branch = {
            ...branchData,
            id: branchToEdit?.id || 0, // 0 for new, will be replaced in parent
        };
        onSave(branchToSave);
        onClose();
    };

    if (!isOpen) return null;

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-brand-dark">{branchToEdit ? 'تعديل فرع' : 'اضافة فرع جديد'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم الفرع</label>
                            <input type="text" id="name" name="name" value={branchData.name} onChange={handleChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">العنوان</label>
                            <input type="text" id="address" name="address" value={branchData.address} onChange={handleChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">الهاتف</label>
                            <input type="text" id="phone" name="phone" value={branchData.phone} onChange={handleChange} className={inputStyle} required />
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

export default BranchModal;
