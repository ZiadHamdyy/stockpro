import React, { useState } from 'react';
import { useToast } from '../../common/ToastProvider';
import { useModal } from '../../common/ModalProvider';
import { LockIcon, EyeIcon, CheckIcon, XIcon } from '../../icons';
import {
  useGetFiscalYearsQuery,
  useCreateFiscalYearMutation,
  useCloseFiscalYearMutation,
  useReopenFiscalYearMutation,
  type FiscalYear,
} from '../../store/slices/fiscalYear/fiscalYearApiSlice';
import { formatNumber } from '../../../utils/formatting';

interface FiscalYearsProps {
    title?: string;
}

const FiscalYears: React.FC<FiscalYearsProps> = ({ title }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYear, setNewYear] = useState<Partial<FiscalYear>>({
        name: new Date().getFullYear().toString(),
        startDate: `${new Date().getFullYear()}-01-01`,
        endDate: `${new Date().getFullYear()}-12-31`,
    });
    const { showToast } = useToast();
    const { showModal } = useModal();

    const { data: fiscalYears = [], isLoading } = useGetFiscalYearsQuery();
    const [createFiscalYear, { isLoading: isCreating }] = useCreateFiscalYearMutation();
    const [closeFiscalYear, { isLoading: isClosing }] = useCloseFiscalYearMutation();
    const [reopenFiscalYear, { isLoading: isReopening }] = useReopenFiscalYearMutation();

    const handleAddYear = async () => {
        if (!newYear.name || !newYear.startDate || !newYear.endDate) {
            showToast("الرجاء تعبئة جميع البيانات", "error");
            return;
        }
        
        // Validate date range
        const startDate = new Date(newYear.startDate!);
        const endDate = new Date(newYear.endDate!);
        
        if (startDate >= endDate) {
            showToast("يجب أن يكون تاريخ البداية قبل تاريخ النهاية", "error");
            return;
        }
        
        // Validate that dates are not in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate > today) {
            showToast("لا يمكن فتح فترة محاسبية لتاريخ مستقبلي", "error");
            return;
        }
        
        // Validate that the fiscal year is not for a future year
        const startDateYear = startDate.getFullYear();
        const currentYear = new Date().getFullYear();
        if (startDateYear > currentYear) {
            showToast("لا يمكن فتح فترة محاسبية لسنة مستقبلية", "error");
            return;
        }
        
        try {
            await createFiscalYear({
                name: newYear.name,
                startDate: newYear.startDate!,
                endDate: newYear.endDate!,
            }).unwrap();
            setIsModalOpen(false);
            setNewYear({
                name: new Date().getFullYear().toString(),
                startDate: `${new Date().getFullYear()}-01-01`,
                endDate: `${new Date().getFullYear()}-12-31`,
            });
            showToast("تم إضافة السنة المالية بنجاح", "success");
        } catch (error: any) {
            showToast(
                error?.data?.message || "حدث خطأ أثناء إضافة السنة المالية",
                "error"
            );
        }
    };

    const confirmToggleStatus = (year: FiscalYear) => {
        if (year.status === 'CLOSED') {
            // Validate that the fiscal year is not for a future year
            const startDateYear = new Date(year.startDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (startDateYear > currentYear) {
                showToast("لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية", "error");
                return;
            }
            
            showModal({
                title: 'إعادة فتح السنة المالية',
                message: `هل أنت متأكد من إعادة فتح السنة المالية ${year.name}؟ هذا سيسمح بإنشاء وتعديل المستندات المالية في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await reopenFiscalYear(year.id).unwrap();
                        showToast(`تم فتح السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إعادة فتح السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'edit',
            });
        } else {
            showModal({
                title: 'إغلاق السنة المالية',
                message: `هل أنت متأكد من إغلاق السنة المالية ${year.name}؟ سيمنع هذا إنشاء أي مستندات مالية (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) في هذه الفترة.`,
                onConfirm: async () => {
                    try {
                        await closeFiscalYear(year.id).unwrap();
                        showToast(`تم إغلاق السنة المالية ${year.name}`, "success");
                    } catch (error: any) {
                        showToast(
                            error?.data?.message || "حدث خطأ أثناء إغلاق السنة المالية",
                            "error"
                        );
                    }
                },
                type: 'delete',
            });
        }
    };

    const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    const sortedFiscalYears = [...fiscalYears].sort((a, b) =>
        b.name.localeCompare(a.name)
    );

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
                        <p className="text-gray-600">جاري تحميل البيانات...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-brand-dark">{title ?? "الفترات المحاسبية"}</h1>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
                    disabled={isCreating}
                >
                    {isCreating ? "جاري الإضافة..." : "سنة مالية جديدة"}
                </button>
            </div>

            {/* Information Banner */}
            <div className="mb-6 p-4 bg-blue-50 border-r-4 border-brand-blue rounded-md">
                <p className="text-sm text-gray-700">
                    <strong className="text-brand-dark">ملاحظة مهمة:</strong> يجب فتح فترة محاسبية أولاً قبل إنشاء أي مستند مالي. 
                    لا يمكن إنشاء المستندات (فواتير مبيعات، فواتير مشتريات، إرجاعات، سندات صرف، سندات قبض، سندات تحويل) 
                    إلا في الفترات المفتوحة. عند إغلاق الفترة، لن يتم السماح بإنشاء أي مستندات في هذه الفترة.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedFiscalYears.map(year => (
                    <div key={year.id} className={`border-2 rounded-lg p-4 flex justify-between items-center ${year.status === 'OPEN' ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-brand-dark">{year.name}</h3>
                                {year.status === 'OPEN' ? (
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-800 font-bold flex items-center gap-1">
                                        <EyeIcon className="w-3 h-3"/> مفتوحة
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-800 font-bold flex items-center gap-1">
                                        <LockIcon className="w-3 h-3"/> مغلقة
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                من: <span className="font-mono font-bold">{year.startDate.split('T')[0]}</span> إلى: <span className="font-mono font-bold">{year.endDate.split('T')[0]}</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="text-center px-4 border-l border-gray-300 hidden md:block">
                                <p className="text-xs text-gray-500">الأرباح (الخسائر) المبقاة</p>
                                <p className={`font-bold text-lg ${year.retainedEarnings !== null ? (year.retainedEarnings >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                                    {year.retainedEarnings !== null ? formatNumber(year.retainedEarnings) : '---'}
                                </p>
                            </div>
                            <button 
                                onClick={() => confirmToggleStatus(year)}
                                disabled={
                                    isClosing || 
                                    isReopening || 
                                    (year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear())
                                }
                                title={
                                    year.status === 'CLOSED' && new Date(year.startDate).getFullYear() > new Date().getFullYear()
                                        ? "لا يمكن إعادة فتح فترة محاسبية لسنة مستقبلية"
                                        : undefined
                                }
                                className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    year.status === 'OPEN' 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                            >
                                {year.status === 'OPEN' ? (
                                    <> <LockIcon className="w-4 h-4"/> إغلاق السنة </>
                                ) : (
                                    <> <CheckIcon className="w-4 h-4"/> إعادة فتح </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Year Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-brand-dark">إضافة سنة مالية</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">السنة</label>
                                <input type="text" value={newYear.name} onChange={(e) => setNewYear({...newYear, name: e.target.value})} className={inputStyle} placeholder="2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">من تاريخ</label>
                                    <input type="date" value={newYear.startDate} onChange={(e) => setNewYear({...newYear, startDate: e.target.value})} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                                    <input type="date" value={newYear.endDate} onChange={(e) => setNewYear({...newYear, endDate: e.target.value})} className={inputStyle} />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
                            <button onClick={handleAddYear} disabled={isCreating} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isCreating ? "جاري الحفظ..." : "حفظ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalYears;
