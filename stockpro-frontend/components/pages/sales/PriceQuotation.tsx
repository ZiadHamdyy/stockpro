
import React, { useState, useEffect, useRef, useMemo } from 'react';
import DataTableModal from '../../common/DataTableModal';
import DocumentHeader from '../../common/DocumentHeader';
import { BarcodeIcon, ListIcon, PrintIcon, TrashIcon } from '../../icons';
import { tafqeet } from '../../../utils/tafqeet';
import type { CompanyInfo, InvoiceItem, Customer } from '../../../types';
import QuotationPrintPreview from './QuotationPrintPreview.tsx';
import { useModal } from '../../common/ModalProvider';
import { useToast } from '../../common/ToastProvider';
import { useGetCompanyQuery } from '../../store/slices/companyApiSlice';
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetCustomersQuery } from '../../store/slices/customer/customerApiSlice';
import {
    useCreatePriceQuotationMutation,
    useDeletePriceQuotationMutation,
    useGetPriceQuotationsQuery,
    useUpdatePriceQuotationMutation,
    type PriceQuotation as PriceQuotationRecord,
} from '../../store/slices/priceQuotation/priceQuotationApiSlice';
import { useAppSelector } from '../../store/hooks';

type SelectableItem = {id: string, name: string, unit: string, price: number, stock: number, barcode?: string};

interface PriceQuotationProps {
    title: string;
}

const PriceQuotation: React.FC<PriceQuotationProps> = ({ title }) => {
    const currentUser = useAppSelector(state => state.auth.user);
    const { data: company } = useGetCompanyQuery();
    const computedVatRate = company?.vatRate ?? 0;
    const computedIsVatEnabled = company?.isVatEnabled ?? false;
    const companyInfo: CompanyInfo = company || {
        name: '',
        activity: '',
        address: '',
        phone: '',
        taxNumber: '',
        commercialReg: '',
        currency: 'SAR',
        logo: null,
        capital: 0,
        vatRate: computedVatRate,
        isVatEnabled: computedIsVatEnabled,
    };
    const vatRate = companyInfo.vatRate ?? 0;
    const isVatEnabled = companyInfo.isVatEnabled ?? false;

    const { data: itemsData = [] } = useGetItemsQuery();
    const selectableItems: SelectableItem[] = useMemo(
        () =>
            itemsData.map((item: any) => ({
                id: item.code,
                name: item.name,
                unit: item.unit?.name || '',
                price: item.salePrice ?? item.price ?? 0,
                stock: item.stock ?? 0,
                barcode: item.barcode,
            })),
        [itemsData]
    );
    const { data: customersData = [] } = useGetCustomersQuery();
    const allCustomers: Customer[] = customersData;
    const { data: quotationsData } = useGetPriceQuotationsQuery();
    const quotations: PriceQuotationRecord[] = quotationsData ?? [];
    const [createPriceQuotation, { isLoading: isCreatingQuotation }] = useCreatePriceQuotationMutation();
    const [updatePriceQuotation, { isLoading: isUpdatingQuotation }] = useUpdatePriceQuotationMutation();
    const [deletePriceQuotation, { isLoading: isDeletingQuotation }] = useDeletePriceQuotationMutation();

    const createEmptyItem = (): InvoiceItem => ({id: '', name: '', unit: '', qty: 1, price: 0, taxAmount: 0, total: 0});
    const isMutating = isCreatingQuotation || isUpdatingQuotation || isDeletingQuotation;
    
    const [items, setItems] = useState<InvoiceItem[]>(Array(6).fill(null).map(createEmptyItem));
    const [totals, setTotals] = useState({ subtotal: 0, discount: 0, tax: 0, net: 0 });
    const [quotationDetails, setQuotationDetails] = useState({ id: '', date: new Date().toISOString().substring(0, 10), expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().substring(0, 10), notes: 'عرض السعر صالح لمدة أسبوع من تاريخه.' });
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);
    const { showModal } = useModal();
    const { showToast } = useToast();
    
    const [customerQuery, setCustomerQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<{id: string, name: string} | null>(null);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerRef = useRef<HTMLDivElement>(null);

    const [activeItemSearch, setActiveItemSearch] = useState<{ index: number; query: string } | null>(null);
    const itemSearchRef = useRef<HTMLTableSectionElement>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    
    const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const priceInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const filteredCustomers = customerQuery ? allCustomers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase())) : allCustomers;
    const filteredItems = (activeItemSearch && typeof activeItemSearch.query === 'string') ? selectableItems.filter(item => 
        (item.name && item.name.toLowerCase().includes(activeItemSearch.query.toLowerCase())) ||
        (item.id && typeof item.id === 'string' && item.id.toLowerCase().includes(activeItemSearch.query.toLowerCase()))
    ) : [];

    const handleNew = () => {
        setCurrentIndex(-1);
        setItems(Array(6).fill(null).map(createEmptyItem));
        setTotals({ subtotal: 0, discount: 0, tax: 0, net: 0 });
        setQuotationDetails({
            id: '',
            date: new Date().toISOString().substring(0, 10),
            expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().substring(0, 10),
            notes: 'عرض السعر صالح لمدة أسبوع من تاريخه.'
        });
        setSelectedCustomer(null);
        setCustomerQuery('');
        setIsReadOnly(false);
        setPendingSelectionId(null);
    };

    useEffect(() => {
        if (pendingSelectionId && quotations.length) {
            const idx = quotations.findIndex(q => q.id === pendingSelectionId);
            if (idx !== -1) {
                setCurrentIndex(idx);
                setPendingSelectionId(null);
            }
        }
    }, [pendingSelectionId, quotations]);

    useEffect(() => {
        if (!quotations.length && currentIndex !== -1) {
            setCurrentIndex(-1);
            return;
        }
        if (quotations.length > 0 && currentIndex >= quotations.length) {
            setCurrentIndex(quotations.length - 1);
        }
    }, [quotations.length, currentIndex]);

    useEffect(() => {
        if (currentIndex >= 0 && quotations[currentIndex]) {
            const quote = quotations[currentIndex];
            setQuotationDetails({ 
                id: quote.code,
                date: quote.date ? quote.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
                expiryDate: quote.expiryDate ? quote.expiryDate.substring(0, 10) : new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().substring(0, 10),
                notes: quote.notes || 'عرض السعر صالح لمدة أسبوع من تاريخه.'
            });
            setSelectedCustomer(quote.customer ? { id: quote.customer.id, name: quote.customer.name } : null);
            setCustomerQuery(quote.customer?.name || '');
            setItems(quote.items as InvoiceItem[]);
            setTotals(quote.totals || { subtotal: 0, discount: 0, tax: 0, net: 0 });
            setIsReadOnly(true);
        } else {
            handleNew();
        }
    }, [currentIndex, quotations]);

    useEffect(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
        const taxTotal = isVatEnabled ? items.reduce((acc, item) => acc + item.taxAmount, 0) : 0;
        const net = subtotal + taxTotal - totals.discount;
        setTotals(prev => ({ ...prev, subtotal, tax: taxTotal, net }));
    }, [items, totals.discount, isVatEnabled]);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        let item = { ...newItems[index], [field]: value };
        if (field === 'name') setActiveItemSearch({ index, query: value });
        if (field === 'qty' || field === 'price') {
            const qty = parseFloat(item.qty as any) || 0;
            const price = parseFloat(item.price as any) || 0;
            const total = qty * price;
            item.total = total;
            item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
        }
        newItems[index] = item;
        setItems(newItems);
    }

    const handleSelectItem = (index: number, selectedItem: SelectableItem) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        const item = { ...currentItem, ...selectedItem, qty: currentItem.qty || 1 };
        const total = (item.qty) * (item.price || 0);
        item.total = total;
        item.taxAmount = isVatEnabled ? total * (vatRate / 100) : 0;
        newItems[index] = item;
        setItems(newItems);
        setActiveItemSearch(null);
        setTimeout(() => { qtyInputRefs.current[index]?.focus(); }, 0);
    };

    const handleSelectItemFromModal = (selectedItem: SelectableItem) => {
        if (editingItemIndex === null) return;
        handleSelectItem(editingItemIndex, selectedItem);
        setIsItemModalOpen(false);
        setEditingItemIndex(null);
    };

    const handleSave = async () => {
        const finalItems = items.filter(i => i.id && i.name && i.qty > 0);
        if (finalItems.length === 0) {
            showToast('الرجاء إضافة صنف واحد على الأقل.');
            return;
        }
        const sanitizedItems = finalItems.map(item => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            qty: Number(item.qty) || 0,
            price: Number(item.price) || 0,
            taxAmount: Number(item.taxAmount) || 0,
            total: Number(item.total) || 0,
        }));

        const payload = {
            customerId: selectedCustomer?.id,
            date: quotationDetails.date,
            expiryDate: quotationDetails.expiryDate,
            items: sanitizedItems,
            totals,
            notes: quotationDetails.notes,
            status: currentIndex >= 0 && quotations[currentIndex]?.status ? quotations[currentIndex].status : 'sent',
        };

        try {
            if (currentIndex >= 0 && quotations[currentIndex]) {
                const targetId = quotations[currentIndex].id;
                await updatePriceQuotation({ id: targetId, data: payload }).unwrap();
                setPendingSelectionId(targetId);
            } else {
                const created = await createPriceQuotation(payload).unwrap();
                setPendingSelectionId(created.id);
                setQuotationDetails({
                    id: created.code,
                    date: created.date ? created.date.substring(0, 10) : quotationDetails.date,
                    expiryDate: created.expiryDate ? created.expiryDate.substring(0, 10) : quotationDetails.expiryDate,
                    notes: created.notes || quotationDetails.notes,
                });
                setItems((created.items as InvoiceItem[]) ?? finalItems);
                setTotals((created.totals as typeof totals) ?? totals);
                setSelectedCustomer(created.customer ? { id: created.customer.id, name: created.customer.name } : null);
                setCustomerQuery(created.customer?.name || '');
            }
            showToast('تم حفظ عرض السعر بنجاح!');
            setIsReadOnly(true);
        } catch (error) {
            console.error(error);
            showToast('حدث خطأ أثناء حفظ عرض السعر.');
        }
    };

    const handleDelete = () => {
        if (currentIndex === -1 || !quotations[currentIndex]) return;
        showModal({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف عرض السعر هذا؟',
            onConfirm: async () => {
                try {
                    await deletePriceQuotation(quotations[currentIndex].id).unwrap();
                    showToast('تم الحذف بنجاح.');
                    if (quotations.length <= 1) handleNew();
                    else setCurrentIndex(prev => Math.max(0, prev - 1));
                } catch (error) {
                    console.error(error);
                    showToast('حدث خطأ أثناء حذف عرض السعر.');
                }
            },
            type: 'delete',
            showPassword: true,
        });
    };

    const navigate = (index: number) => {
        if (quotations.length > 0) {
            setCurrentIndex(Math.max(0, Math.min(quotations.length - 1, index)));
        }
    };

    const navigateBy = (direction: 'first' | 'prev' | 'next' | 'last') => {
        const list = quotations;
        if (!Array.isArray(list) || list.length === 0) return;

        let newIndex = currentIndex;
        switch (direction) {
            case 'first':
                newIndex = 0;
                break;
            case 'last':
                newIndex = list.length - 1;
                break;
            case 'next':
                newIndex = currentIndex === -1 ? 0 : Math.min(list.length - 1, currentIndex + 1);
                break;
            case 'prev':
                newIndex = currentIndex === -1 ? list.length - 1 : Math.max(0, currentIndex - 1);
                break;
        }
        navigate(newIndex);
    };

    const handleConvertToInvoice = async () => {
        if (currentIndex < 0 || !quotations[currentIndex]) return;
        try {
            await updatePriceQuotation({
                id: quotations[currentIndex].id,
                data: { status: 'converted' },
            }).unwrap();
            showToast('تم تحويل عرض السعر إلى فاتورة (محاكاة).');
        } catch (error) {
            console.error(error);
            showToast('تعذر تحويل عرض السعر إلى فاتورة.');
        }
    };

    const inputStyle = "block w-full bg-yellow-50 border-2 border-amber-500 rounded-md shadow-sm text-brand-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";
    const tableInputStyle = "text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-500 rounded p-1 disabled:bg-transparent";

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="border-2 border-amber-500 rounded-lg mb-4">
                    <DocumentHeader companyInfo={companyInfo} />
                </div>
                
                <div className="border-2 border-amber-500 rounded-lg">
                    <div className="p-4">
                        <h1 className="text-2xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2 text-brand-dark">{title}</h1>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500 mb-1">رقم العرض</label>
                                <input
                                    type="text"
                                    disabled
                                    className={inputStyle}
                                    value={quotationDetails.id || ''}
                                    readOnly
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500 mb-1">تاريخ العرض</label>
                                <input type="date" className={inputStyle} value={quotationDetails.date} onChange={e => setQuotationDetails({...quotationDetails, date: e.target.value})} disabled={isReadOnly} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</label>
                                <input type="date" className={inputStyle} value={quotationDetails.expiryDate} onChange={e => setQuotationDetails({...quotationDetails, expiryDate: e.target.value})} disabled={isReadOnly} />
                            </div>
                            <div className="relative flex flex-col" ref={customerRef}>
                                <label className="text-xs text-gray-500 mb-1">العميل</label>
                                <input type="text" placeholder="ابحث عن عميل..." className={inputStyle} value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setIsCustomerDropdownOpen(true); setSelectedCustomer(null); }} onFocus={() => setIsCustomerDropdownOpen(true)} disabled={isReadOnly}/>
                                {isCustomerDropdownOpen && !isReadOnly && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCustomers.map(customer => (<div key={customer.id} onClick={() => {setSelectedCustomer({id: customer.id.toString(), name: customer.name}); setCustomerQuery(customer.name); setIsCustomerDropdownOpen(false);}} className="p-2 cursor-pointer hover:bg-yellow-100">{customer.name}</div>))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto my-4 border-2 border-amber-500 rounded-lg">
                    <table className="min-w-full border-collapse table-fixed">
                        <thead className="bg-amber-500 text-white">
                            <tr>
                                <th className="px-2 py-3 w-10 text-center text-sm font-semibold uppercase border border-amber-300">م</th>
                                <th className="px-2 py-3 w-24 text-right text-sm font-semibold uppercase border border-amber-300">رقم الصنف</th>
                                <th className="px-2 py-3 w-2/5 text-right text-sm font-semibold uppercase border border-amber-300">الصنف</th>
                                <th className="px-2 py-3 w-20 text-center text-sm font-semibold uppercase border border-amber-300">الوحدة</th>
                                <th className="px-2 py-3 text-center text-sm font-semibold uppercase border border-amber-300" style={{ minWidth: '100px' }}>الكمية</th>
                                <th className="px-2 py-3 text-center text-sm font-semibold uppercase border border-amber-300" style={{ minWidth: '100px' }}>السعر</th>
                                {isVatEnabled && <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-amber-300">الضريبة ({vatRate}%)</th>}
                                <th className="px-2 py-3 w-36 text-center text-sm font-semibold uppercase border border-amber-300">الاجمالي</th>
                                <th className="px-2 py-3 w-16 text-center border border-amber-300"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-200" ref={itemSearchRef}>
                            {items.map((item, index) => (
                                 <tr key={index} className="hover:bg-yellow-50 transition-colors duration-150">
                                    <td className="p-2 align-middle text-center border-x border-amber-200 w-10">{index + 1}</td>
                                    <td className="p-2 align-middle border-x border-amber-200 w-24">
                                        <input type="text" value={item.id} onChange={(e) => handleItemChange(index, 'id', e.target.value)} className={tableInputStyle + " w-full"} disabled={isReadOnly}/>
                                    </td>
                                    <td className="p-2 align-middle border-x border-amber-200 relative w-2/5">
                                        <div className="flex items-center">
                                            <input type="text" placeholder="ابحث..." value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} onFocus={() => setActiveItemSearch({ index, query: item.name })} className="bg-transparent w-full focus:outline-none p-1" disabled={isReadOnly}/>
                                            <button type="button" onClick={() => { setEditingItemIndex(index); setIsItemModalOpen(true); }} className="p-1 text-gray-400 hover:text-amber-600" disabled={isReadOnly}><ListIcon className="w-5 h-5" /></button>
                                        </div>
                                         {activeItemSearch?.index === index && filteredItems.length > 0 && !isReadOnly && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {filteredItems.map((result, idx) => ( <div key={result.id} onClick={() => {handleSelectItem(index, result); setActiveItemSearch(null);}} className="p-2 cursor-pointer hover:bg-yellow-100">{result.name}</div>))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2 align-middle text-center border-x border-amber-200 w-20">
                                        <input type="text" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} className={tableInputStyle + " w-full"} disabled={isReadOnly}/>
                                    </td>
                                    <td className="p-2 align-middle text-center border-x border-amber-200" style={{ minWidth: '100px' }}>
                                        <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} ref={el => { if (el) qtyInputRefs.current[index] = el; }} className={tableInputStyle} disabled={isReadOnly}/>
                                    </td>
                                    <td className="p-2 align-middle text-center border-x border-amber-200" style={{ minWidth: '100px' }}>
                                        <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} ref={el => { if (el) priceInputRefs.current[index] = el; }} className={tableInputStyle} disabled={isReadOnly}/>
                                    </td>
                                    {isVatEnabled && (
                                        <td className="p-2 align-middle text-center border-x border-amber-200 w-36">
                                            {item.taxAmount.toFixed(2)}
                                        </td>
                                    )}
                                    <td className="p-2 align-middle text-center border-x border-amber-200 w-36">{item.total.toFixed(2)}</td>
                                    <td className="p-2 align-middle text-center border-x border-amber-200 w-16">
                                        <button onClick={() => {const newItems = items.filter((_, i) => i !== index); setItems(newItems);}} className="text-red-500 hover:text-red-700" disabled={isReadOnly}>
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={() => setItems([...items, createEmptyItem()])} className="mb-4 px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300" disabled={isReadOnly || isMutating}>اضافة سطر</button>

                <div className="bg-yellow-50 -mx-6 -mb-6 mt-4 p-6 rounded-b-lg">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="w-full md:w-1/2">
                            <label className="block text-sm font-bold mb-2">شروط وملاحظات:</label>
                            <textarea className="w-full p-3 border-2 border-amber-400 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-inner" rows={4} value={quotationDetails.notes} onChange={e => setQuotationDetails({...quotationDetails, notes: e.target.value})} disabled={isReadOnly}></textarea>
                            <div className="mt-6 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-amber-200">
                                استلمت البضاعة كاملة و بجودة سليمة
                            </div>
                        </div>
                        <div className="w-full md:w-2/5">
                            <div className="border-2 border-amber-500 rounded-lg bg-white shadow-inner">
                                <div className="flex justify-between p-3">
                                    <span className="font-semibold text-gray-600">المجموع قبل الضريبة</span>
                                    <span className="font-bold text-lg text-brand-dark">{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 border-t-2 border-dashed border-amber-100">
                                    <span className="font-semibold text-gray-600">خصم</span>
                                    <input type="number" value={totals.discount} onChange={(e) => {
                                        const discount = parseFloat(e.target.value) || 0;
                                        setTotals(prev => ({ ...prev, discount, net: prev.subtotal + prev.tax - discount }));
                                    }} className="w-28 text-left p-1 rounded border-2 border-amber-400 bg-amber-600 text-white font-bold focus:ring-amber-500 focus:border-amber-500" disabled={isReadOnly}/>
                                </div>
                                {isVatEnabled && (
                                    <div className="flex justify-between p-3 border-t-2 border-dashed border-amber-100">
                                        <span className="font-semibold text-gray-600">إجمالي الضريبة ({vatRate}%)</span>
                                        <span className="font-bold text-lg text-brand-dark">{totals.tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-xl text-brand-dark bg-amber-50 p-4 border-t-4 border-amber-500 rounded-b-md">
                                    <span>الصافي</span>
                                    <span>{totals.net.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-dashed border-amber-200">
                    <div className="bg-amber-50 p-3 rounded-md text-center text-amber-700 font-semibold border border-amber-200">
                        {tafqeet(totals.net, companyInfo.currency || 'SAR')}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
                    <div className="flex justify-center gap-2 flex-wrap">
                        <button onClick={handleNew} disabled={isMutating} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:bg-gray-400">جديد</button>
                        <button onClick={handleSave} disabled={isReadOnly || isMutating} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400">حفظ</button>
                        <button onClick={() => setIsReadOnly(false)} disabled={currentIndex < 0 || !isReadOnly || isMutating} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400">تعديل</button>
                        <button onClick={handleDelete} disabled={currentIndex < 0 || isMutating} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400">حذف</button>
                        <button onClick={() => setIsSearchModalOpen(true)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">بحث</button>
                        <button onClick={() => setIsPreviewOpen(true)} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"><PrintIcon className="mr-2 w-5 h-5"/>معاينة الطباعة</button>
                        {/* Killer Feature: Convert to Invoice */}
                        <button 
                            onClick={handleConvertToInvoice} 
                            disabled={currentIndex < 0 || isReadOnly === false || isMutating} 
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold disabled:bg-gray-400 flex items-center shadow-lg transform transition hover:-translate-y-1"
                        >
                            <ListIcon className="ml-2 w-5 h-5"/> تحويل إلى فاتورة
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => navigateBy('first')}
                            disabled={quotations.length === 0 || currentIndex === 0}
                            className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                            الأول
                        </button>
                        <button
                            onClick={() => navigateBy('prev')}
                            disabled={quotations.length === 0 || currentIndex === 0}
                            className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                            السابق
                        </button>
                        <div className="px-4 py-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md">
                            <span className="font-bold">
                                {currentIndex > -1 ? `${currentIndex + 1} / ${quotations.length}` : 'جديد'}
                            </span>
                        </div>
                        <button
                            onClick={() => navigateBy('next')}
                            disabled={quotations.length === 0 || currentIndex === quotations.length - 1}
                            className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                            التالي
                        </button>
                        <button
                            onClick={() => navigateBy('last')}
                            disabled={quotations.length === 0 || currentIndex === quotations.length - 1}
                            className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                        >
                            الأخير
                        </button>
                    </div>
                </div>
            </div>

            <DataTableModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                title="قائمة الأصناف"
                columns={[ { Header: 'الكود', accessor: 'id' }, { Header: 'الاسم', accessor: 'name' }, { Header: 'الرصيد', accessor: 'stock' }, { Header: 'السعر', accessor: 'price' } ]}
                data={selectableItems}
                onSelectRow={handleSelectItemFromModal}
            />
             <DataTableModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                title="بحث عن عرض سعر"
                columns={[
                    { Header: 'الرقم', accessor: 'code' },
                    { Header: 'التاريخ', accessor: 'date' },
                    { Header: 'العميل', accessor: 'customer' },
                    { Header: 'الصافي', accessor: 'total' },
                ]}
                data={quotations.map(q => ({
                    id: q.id,
                    code: q.code,
                    date: q.date ? q.date.substring(0, 10) : '-',
                    customer: q.customer?.name || '-',
                    total: Number((q.totals?.net ?? 0)).toFixed(2),
                }))}
                onSelectRow={(row) => {
                    const idx = quotations.findIndex(q => q.id === row.id);
                    if (idx > -1) {
                        setCurrentIndex(idx);
                    }
                    setPendingSelectionId(row.id);
                    setIsSearchModalOpen(false);
                }}
            />
            <QuotationPrintPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                quotationData={{
                    companyInfo,
                    items,
                    totals,
                    customer: selectedCustomer,
                    details: {
                        ...quotationDetails,
                        userName: currentUser?.fullName || 'غير محدد',
                    },
                    isVatEnabled,
                    vatRate
                }}
            />
        </>
    );
};

export default PriceQuotation;
