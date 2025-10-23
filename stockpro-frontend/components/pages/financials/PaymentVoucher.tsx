import React, { useState, useEffect } from 'react';
import { PrintIcon, SearchIcon } from '../../icons';
import { tafqeet } from '../../../utils/tafqeet';
// FIX: Import the 'Expense' type to resolve 'Cannot find name' errors.
import type { CompanyInfo, Voucher, Customer, Supplier, CurrentAccount, VoucherEntity, User, ExpenseCode, Expense, Safe, Bank } from '../../../types';
import PaymentVoucherPrintPreview from './PaymentVoucherPrintPreview';
import { useModal } from '../../common/ModalProvider';
import { useToast } from '../../common/ToastProvider';

interface PaymentVoucherProps {
    title: string;
    companyInfo: CompanyInfo;
    vouchers: Voucher[];
    onSave: (voucher: Voucher) => void;
    onDelete: (id: string) => void;
    customers: Customer[];
    suppliers: Supplier[];
    currentAccounts: CurrentAccount[];
    currentUser: User | null;
    expenseCodes: ExpenseCode[];
    onAddExpense: (expense: Omit<Expense, 'id' | 'code'>) => void;
    safes: Safe[];
    banks: Bank[];
    viewingId: string | number | null;
    onClearViewingId: () => void;
}

const InvoiceHeader: React.FC<{ companyInfo: CompanyInfo }> = ({ companyInfo }) => (
    <div className="flex justify-between items-start p-4 bg-white">
        <div className="flex items-center gap-4">
            {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-20 w-auto object-contain" />}
            <div>
                <h2 className="text-2xl font-bold text-brand-dark">{companyInfo.name}</h2>
                <p className="text-sm text-gray-600">{companyInfo.address}</p>
                <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
            </div>
        </div>
        <div className="text-left text-sm">
            <p><span className="font-semibold">الرقم الضريبي:</span> {companyInfo.taxNumber}</p>
            <p><span className="font-semibold">السجل التجاري:</span> {companyInfo.commercialReg}</p>
        </div>
    </div>
);

const PaymentVoucher: React.FC<PaymentVoucherProps> = ({ title, companyInfo, vouchers, onSave, onDelete, customers, suppliers, currentAccounts, currentUser, expenseCodes, onAddExpense, safes, banks, viewingId, onClearViewingId }) => {
    const initialEntity: VoucherEntity = { type: 'supplier', id: null, name: '' };
    const [voucherData, setVoucherData] = useState({
        number: '',
        date: new Date().toISOString().substring(0, 10),
        entity: initialEntity,
        amount: 0,
        paymentMethod: 'safe' as 'safe' | 'bank',
        safeOrBankId: null as number | null,
        description: '',
    });
    const [isReadOnly, setIsReadOnly] = useState(true);
    const { showModal } = useModal();
    const { showToast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const handleNew = () => {
        setCurrentIndex(-1);
        setVoucherData({
            number: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().substring(0, 10),
            entity: initialEntity,
            amount: 0,
            paymentMethod: 'safe',
            safeOrBankId: safes.length > 0 ? safes[0].id : null,
            description: '',
        });
        setIsReadOnly(false);
    };

    useEffect(() => {
        if (viewingId) {
            const index = vouchers.findIndex(inv => inv.id === viewingId);
            if (index !== -1) {
                setCurrentIndex(index);
            } else {
                showToast(`السند رقم ${viewingId} غير موجود.`);
            }
            onClearViewingId(); 
        }
    }, [viewingId, vouchers, onClearViewingId, showToast]);

    useEffect(() => {
        if (currentIndex >= 0 && vouchers[currentIndex]) {
            const v = vouchers[currentIndex];
            setVoucherData({
                number: v.id,
                date: v.date,
                entity: v.entity,
                amount: v.amount,
                paymentMethod: v.paymentMethod,
                safeOrBankId: v.safeOrBankId,
                description: v.description,
            });
            setIsReadOnly(true);
        } else {
            handleNew();
        }
    }, [currentIndex, vouchers, safes]);


    const handleEntityChange = (field: keyof VoucherEntity, value: any) => {
        setVoucherData(prev => {
            const newEntity = { ...prev.entity, [field]: value };
            if (field === 'type') {
                newEntity.id = null;
                newEntity.name = '';
            }
            if (field === 'id') {
                let foundName = '';
                if (newEntity.type === 'customer') foundName = customers.find(c => c.id === Number(value))?.name || '';
                if (newEntity.type === 'supplier') foundName = suppliers.find(s => s.id === Number(value))?.name || '';
                if (newEntity.type === 'current_account') foundName = currentAccounts.find(a => a.id === Number(value))?.name || '';
                if (newEntity.type === 'expense') foundName = expenseCodes.find(c => c.id === Number(value))?.name || '';
                newEntity.name = foundName;
            }
            return { ...prev, entity: newEntity };
        });
    };

     const handleSave = () => {
        if (!voucherData.entity.name || voucherData.amount <= 0) {
            showToast('الرجاء تعبئة جميع الحقول المطلوبة.');
            return;
        }

        if (voucherData.entity.type === 'expense') {
            const selectedCode = expenseCodes.find(c => c.id === voucherData.entity.id);
            if (selectedCode) {
                const newExpense: Omit<Expense, 'id' | 'code'> = {
                    date: voucherData.date,
                    expenseCodeId: selectedCode.id,
                    expenseCode: selectedCode.code,
                    expenseCodeName: selectedCode.name,
                    expenseCodeType: selectedCode.type,
                    amount: voucherData.amount,
                    description: voucherData.description,
                };
                onAddExpense(newExpense);
            }
        }

        const voucherToSave: Voucher = {
            id: voucherData.number,
            type: 'payment',
            date: voucherData.date,
            entity: voucherData.entity,
            amount: voucherData.amount,
            description: voucherData.description,
            paymentMethod: voucherData.paymentMethod,
            safeOrBankId: voucherData.safeOrBankId,
            userName: currentUser?.fullName || 'غير محدد',
            branchName: currentUser?.branch || 'غير محدد',
        };
        onSave(voucherToSave);
        showToast('تم حفظ السند بنجاح!');
        handleNew();
    };
    
    const handleEdit = () => {
        if (currentIndex < 0) return;
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا السند؟',
            onConfirm: () => setIsReadOnly(false),
            type: 'edit',
            showPassword: true,
        });
    };

    const handleDelete = () => {
        if (currentIndex < 0) return;
        showModal({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من حذف هذا السند؟',
            onConfirm: () => {
                onDelete(vouchers[currentIndex].id);
                showToast('تم الحذف بنجاح.');
                if (vouchers.length <= 1) handleNew();
                else setCurrentIndex(prev => Math.max(0, prev - 1));
            },
            type: 'delete',
            showPassword: true,
        });
    };
    
    const navigate = (index: number) => {
        if (vouchers.length > 0) {
           setCurrentIndex(Math.max(0, Math.min(vouchers.length - 1, index)));
        }
    };

    const renderEntitySelector = () => {
        const entityType = voucherData.entity.type;
        if (entityType === 'customer') {
            return <select value={voucherData.entity.id || ''} onChange={e => handleEntityChange('id', e.target.value)} className={inputStyle} disabled={isReadOnly}><option value="">اختر عميل...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>;
        }
        if (entityType === 'supplier') {
            return <select value={voucherData.entity.id || ''} onChange={e => handleEntityChange('id', e.target.value)} className={inputStyle} disabled={isReadOnly}><option value="">اختر مورد...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>;
        }
        if (entityType === 'current_account') {
            return <select value={voucherData.entity.id || ''} onChange={e => handleEntityChange('id', e.target.value)} className={inputStyle} disabled={isReadOnly}><option value="">اختر حساب...</option>{currentAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>;
        }
        if (entityType === 'expense') {
            return <select value={voucherData.entity.id || ''} onChange={e => handleEntityChange('id', e.target.value)} className={inputStyle} disabled={isReadOnly}><option value="">اختر بند مصروف...</option>{expenseCodes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>;
        }
        return null;
    }

    const inputStyle = "mt-1 block w-full bg-brand-green-bg border-2 border-brand-green rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green py-3 px-4 disabled:bg-gray-200 disabled:cursor-not-allowed";

    const voucher = currentIndex > -1 ? vouchers[currentIndex] : null;

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="border-2 border-brand-green rounded-lg mb-4">
                    <InvoiceHeader companyInfo={companyInfo} />
                </div>

                <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">رقم السند</label>
                        <input type="text" value={voucherData.number} className={inputStyle + " bg-gray-200"} readOnly />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">التاريخ</label>
                        <input type="date" value={voucherData.date} onChange={e => setVoucherData(prev => ({...prev, date: e.target.value}))} className={inputStyle} disabled={isReadOnly} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">المبلغ</label>
                        <input type="number" value={voucherData.amount} onChange={e => setVoucherData(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))} className={inputStyle} placeholder="0.00" disabled={isReadOnly}/>
                    </div>
                    
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">اصرفوا لـ</label>
                             <select value={voucherData.entity.type} onChange={e => handleEntityChange('type', e.target.value)} className={inputStyle} disabled={isReadOnly}>
                                <option value="supplier">مورد</option>
                                <option value="expense">مصروف</option>
                                <option value="customer">عميل</option>
                                <option value="current_account">حساب جاري</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">الاسم</label>
                            {renderEntitySelector()}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">وذلك عن</label>
                        <textarea value={voucherData.description} onChange={e => setVoucherData(prev => ({...prev, description: e.target.value}))} className={inputStyle + " h-24"} placeholder="تفاصيل الصرف" disabled={isReadOnly}/>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">طريقة الدفع</label>
                            <div className="relative mt-1 bg-brand-green-bg border-2 border-brand-green rounded-md p-1 flex items-center">
                                <button onClick={() => setVoucherData(prev => ({...prev, paymentMethod: 'safe'}))} className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === 'safe' ? 'bg-brand-green text-white shadow' : 'text-gray-600'} transition-all duration-200`} disabled={isReadOnly}>نقداً (خزنة)</button>
                                <button onClick={() => setVoucherData(prev => ({...prev, paymentMethod: 'bank'}))} className={`w-1/2 py-2 rounded ${voucherData.paymentMethod === 'bank' ? 'bg-brand-green text-white shadow' : 'text-gray-600'} transition-all duration-200`} disabled={isReadOnly}>شيك (بنك)</button>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {voucherData.paymentMethod === 'safe' ? 'الخزينة' : 'البنك'}
                            </label>
                             <select
                                value={voucherData.safeOrBankId || ''}
                                onChange={e => setVoucherData(prev => ({...prev, safeOrBankId: parseInt(e.target.value)}))}
                                className={inputStyle}
                                disabled={isReadOnly}
                            >
                                {voucherData.paymentMethod === 'safe' ? (
                                    safes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                ) : (
                                    banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                 <div className="mt-6">
                    <div className="bg-brand-green-bg p-3 rounded-md text-center text-brand-dark font-semibold">
                        {tafqeet(voucherData.amount, companyInfo.currency)}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t-2 border-gray-200 flex flex-col items-center space-y-4">
                    <div className="flex justify-center gap-2 flex-wrap">
                        <button onClick={handleNew} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">جديد</button>
                        <button onClick={handleSave} disabled={isReadOnly} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400">حفظ</button>
                        <button onClick={handleEdit} disabled={currentIndex < 0 || !isReadOnly} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 font-semibold disabled:bg-gray-400">تعديل</button>
                        <button onClick={handleDelete} disabled={currentIndex < 0} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold disabled:bg-gray-400">حذف</button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">بحث</button>
                        <button onClick={() => setIsPreviewOpen(true)} className="px-4 py-2 bg-gray-200 text-brand-dark rounded-md hover:bg-gray-300 font-semibold flex items-center"><PrintIcon className="mr-2 w-5 h-5"/> معاينة وطباعة</button>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                         <button onClick={() => navigate(vouchers.length - 1)} disabled={currentIndex >= vouchers.length - 1 || vouchers.length === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأخير</button>
                        <button onClick={() => navigate(currentIndex + 1)} disabled={currentIndex >= vouchers.length - 1 || vouchers.length === 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">التالي</button>
                         <div className="px-4 py-2 bg-brand-green-bg border-2 border-brand-green rounded-md">
                            <span className="font-bold">{currentIndex > -1 ? `${currentIndex + 1} / ${vouchers.length}` : `جديد`}</span>
                        </div>
                        <button onClick={() => navigate(currentIndex - 1)} disabled={currentIndex <= 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">السابق</button>
                        <button onClick={() => navigate(0)} disabled={currentIndex <= 0} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">الأول</button>
                    </div>
                </div>
            </div>
            <PaymentVoucherPrintPreview 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                voucherData={{
                    companyInfo,
                    number: voucherData.number,
                    date: voucherData.date,
                    amount: voucherData.amount,
                    paidTo: voucherData.entity.name,
                    description: voucherData.description,
                    userName: voucher?.userName || currentUser?.fullName || 'غير محدد',
                    branchName: voucher?.branchName || currentUser?.branch || 'غير محدد',
                }}
            />
        </>
    );
};

export default PaymentVoucher;