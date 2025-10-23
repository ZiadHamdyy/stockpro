import React, { useState, useEffect } from 'react';
import type { Item, ItemGroup, Unit } from '../../../types';
import { useModal } from '../../common/ModalProvider';
import { useToast } from '../../common/ToastProvider';

interface AddItemProps {
    title: string;
    editingId: number | null;
    items: Item[];
    onSave: (item: Item | Omit<Item, 'id'>) => void;
    onDelete: (id: number) => void;
    itemGroups: ItemGroup[];
    units: Unit[];
    onNavigate: (key: string, label: string, id?: number | null) => void;
}

// FIX: Add missing 'reorderLimit' property to match the 'Item' type.
const emptyItem: Omit<Item, 'id'> = {
    code: '', barcode: '', name: '', group: '', unit: '', purchasePrice: 0, salePrice: 0, stock: 0, reorderLimit: 0,
};

const AddItem: React.FC<AddItemProps> = ({ title, editingId, items, onSave, onDelete, itemGroups, units, onNavigate }) => {
    const [itemData, setItemData] = useState<Item | Omit<Item, 'id'>>(emptyItem);
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const { showModal } = useModal();
    const { showToast } = useToast();

    useEffect(() => {
        let foundIndex = -1;
        if (editingId !== null) {
            foundIndex = items.findIndex(item => item.id === editingId);
        }

        if (foundIndex !== -1) {
            setItemData(items[foundIndex]);
            setCurrentIndex(foundIndex);
            setIsReadOnly(true);
        } else {
            const nextCode = items.length > 0
                ? (Math.max(...items.map(i => parseInt(i.code, 10) || 0)) + 1).toString()
                : '101';
            setItemData({ ...emptyItem, code: nextCode });
            setIsReadOnly(false);
            setCurrentIndex(-1);
        }
    }, [editingId, items]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setItemData(prev => ({
            ...prev,
            // FIX: Add 'reorderLimit' to the list of numeric fields.
            [name]: name === 'purchasePrice' || name === 'salePrice' || name === 'stock' || name === 'reorderLimit' ? (parseFloat(value) || 0) : value
        }));
    };

    const handleSave = () => {
        if (!itemData.code || !itemData.name || !itemData.group || !itemData.unit) {
            showToast("الرجاء تعبئة جميع الحقول المطلوبة.");
            return;
        }
        onSave(itemData);
        showToast(`تم حفظ الصنف "${itemData.name}" بنجاح!`);
        if (!('id' in itemData)) {
            // After saving a new item, parent will handle navigation or state update
        } else {
            setIsReadOnly(true);
        }
    };
    
    const handleDelete = () => {
        if ('id' in itemData) {
            showModal({
                title: 'تأكيد الحذف',
                message: `هل أنت متأكد من حذف الصنف "${itemData.name}"؟`,
                onConfirm: () => {
                    onDelete(itemData.id as number);
                    showToast('تم الحذف بنجاح.');
                },
                type: 'delete',
                showPassword: true,
            });
        }
    };

    const handleEdit = () => {
        if (!('id' in itemData)) return; // Should not happen if button is disabled
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا الصنف؟',
            onConfirm: () => setIsReadOnly(false),
            type: 'edit',
            showPassword: true,
        });
    };

    const navigate = (direction: 'first' | 'prev' | 'next' | 'last') => {
        if (items.length === 0) return;
        let newIndex = currentIndex;
        
        // If on a new item form, determine starting point for navigation
        const isNewItem = currentIndex === -1;

        switch (direction) {
            case 'first':
                newIndex = 0;
                break;
            case 'prev':
                newIndex = isNewItem ? items.length - 1 : Math.max(0, currentIndex - 1);
                break;
            case 'next':
                newIndex = isNewItem ? 0 : Math.min(items.length - 1, currentIndex + 1);
                break;
            case 'last':
                newIndex = items.length - 1;
                break;
        }
        
        if (newIndex !== -1 && items[newIndex] && newIndex !== currentIndex) {
            const newId = items[newIndex].id;
            onNavigate('add_item', `تعديل صنف #${newId}`, newId);
        }
    };

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed";

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">كود الصنف</label>
                        <input type="text" name="code" id="code" value={itemData.code} onChange={handleChange} className={inputStyle} disabled required />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم الصنف</label>
                        <input type="text" name="name" id="name" value={itemData.name} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required />
                    </div>
                    <div className="md:col-span-3">
                        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">الباركود</label>
                        <input type="text" name="barcode" id="barcode" value={itemData.barcode || ''} onChange={handleChange} className={inputStyle} disabled={isReadOnly} placeholder="ادخل الباركود يدوياً أو استخدم الماسح في شاشات البيع والشراء" />
                    </div>
                    <div>
                        <label htmlFor="group" className="block text-sm font-medium text-gray-700">المجموعة</label>
                        <select name="group" id="group" value={itemData.group} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required>
                            <option value="">اختر مجموعة...</option>
                            {itemGroups.map(group => <option key={group.id} value={group.name}>{group.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">الوحدة</label>
                        <select name="unit" id="unit" value={itemData.unit} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required>
                            <option value="">اختر وحدة...</option>
                            {units.map(unit => <option key={unit.id} value={unit.name}>{unit.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700">الرصيد الافتتاحي</label>
                        <input type="number" name="stock" id="stock" value={'stock' in itemData ? itemData.stock : 0} onChange={handleChange} className={inputStyle} disabled={isReadOnly || ('id' in itemData)} />
                    </div>
                    <div>
                        <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">سعر الشراء (يُحدّث من المشتريات)</label>
                        <input type="number" name="purchasePrice" id="purchasePrice" value={itemData.purchasePrice} onChange={handleChange} className={inputStyle} disabled required />
                    </div>
                    <div>
                        <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">سعر البيع</label>
                        <input type="number" name="salePrice" id="salePrice" value={itemData.salePrice} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required />
                    </div>
                    {/* FIX: Add input field for 'reorderLimit'. */}
                    <div>
                        <label htmlFor="reorderLimit" className="block text-sm font-medium text-gray-700">حد إعادة الطلب</label>
                        <input type="number" name="reorderLimit" id="reorderLimit" value={itemData.reorderLimit} onChange={handleChange} className={inputStyle} disabled={isReadOnly} required />
                    </div>
                </div>
                 <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-start space-y-4">
                    <div className="flex justify-start gap-2 flex-wrap">
                        <button type="button" onClick={() => onNavigate('add_item', 'إضافة صنف')} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">جديد</button>
                        <button type="submit" disabled={isReadOnly} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400">حفظ</button>
                        <button type="button" onClick={handleEdit} disabled={!('id' in itemData) || !isReadOnly} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400">تعديل</button>
                        <button type="button" onClick={() => onNavigate('items_list', 'قائمة الأصناف')} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">بحث</button>
                        <button type="button" onClick={handleDelete} disabled={!('id' in itemData)} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400">حذف</button>
                    </div>

                    <div className="flex items-center justify-start gap-2">
                        <button type="button" onClick={() => navigate('first')} disabled={items.length === 0 || currentIndex === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأول</button>
                        <button type="button" onClick={() => navigate('prev')} disabled={items.length === 0 || currentIndex === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">السابق</button>
                        <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
                           <span className="font-bold">{currentIndex > -1 && items.length > 0 ? `${currentIndex + 1} / ${items.length}` : `سجل جديد`}</span>
                        </div>
                        <button type="button" onClick={() => navigate('next')} disabled={items.length === 0 || currentIndex === items.length - 1} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">التالي</button>
                        <button type="button" onClick={() => navigate('last')} disabled={items.length === 0 || currentIndex === items.length - 1} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأخير</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddItem;
