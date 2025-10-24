import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { useCreateItemGroupMutation, useUpdateItemGroupMutation, type ItemGroup } from '../../store/slices/items/itemsApi';
import { addItemGroup, updateItemGroup as updateItemGroupAction } from '../../store/slices/items/items';

interface ItemGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupToEdit: ItemGroup | null;
}

const ItemGroupModal: React.FC<ItemGroupModalProps> = ({ isOpen, onClose, groupToEdit }) => {
    const [name, setName] = useState('');
    const dispatch = useAppDispatch();
    const [createItemGroup, { isLoading: createLoading }] = useCreateItemGroupMutation();
    const [updateItemGroup, { isLoading: updateLoading }] = useUpdateItemGroupMutation();

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
        } else {
            setName('');
        }
    }, [groupToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (groupToEdit) {
                const result = await updateItemGroup({ id: groupToEdit.id, data: { name } }).unwrap();
                dispatch(updateItemGroupAction((result as any).data as ItemGroup));
            } else {
                const result = await createItemGroup({ name }).unwrap();
                dispatch(addItemGroup((result as any).data as ItemGroup));
            }
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
        }
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
                        <button type="submit" disabled={createLoading || updateLoading} className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:opacity-50">
                            {createLoading || updateLoading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemGroupModal;
