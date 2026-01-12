
import React, { useEffect } from 'react';
import type { PrintSettings as PrintSettingsType, EpsonSettings } from '../../../types';
import { PrintIcon, CheckCircleIcon, RefreshCwIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useGetPrintSettingsQuery, useUpdatePrintSettingsMutation } from '../../store/slices/printSettings/printSettingsApi';

interface PrintSettingsProps {
    title: string;
}

const TemplatePreview: React.FC<{ 
    id: PrintSettingsType['template']; 
    name: string; 
    selected: boolean; 
    onSelect: () => void;
    description: string;
}> = ({ id, name, selected, onSelect, description }) => {
    
    // Abstract visualizations using CSS
    const renderPreview = () => {
        switch(id) {
            case 'default':
                return (
                    <div className="w-full h-full bg-white p-2 flex flex-col gap-1 border border-gray-100">
                        <div className="h-2 w-1/3 bg-blue-100 rounded"></div>
                        <div className="flex gap-2 mb-1">
                            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                            <div className="h-4 w-3/4 bg-gray-50 rounded border border-gray-100"></div>
                        </div>
                        <div className="h-8 w-full border-2 border-blue-500 rounded bg-blue-50 opacity-50"></div>
                        <div className="flex-1 border border-gray-200 rounded"></div>
                    </div>
                );
            case 'classic':
                return (
                    <div className="w-full h-full bg-white p-2 flex flex-col gap-1 border border-gray-300">
                        <div className="flex justify-between border-b border-black pb-1 mb-1">
                            <div className="h-3 w-1/3 bg-gray-800"></div>
                            <div className="h-3 w-10 bg-gray-300"></div>
                        </div>
                        <div className="flex-1 border border-black p-1">
                            <div className="w-full h-2 bg-gray-200 mb-1"></div>
                            <div className="w-full h-2 bg-white border-b border-gray-200"></div>
                            <div className="w-full h-2 bg-white border-b border-gray-200"></div>
                        </div>
                    </div>
                );
            case 'modern':
                return (
                    <div className="w-full h-full bg-white flex flex-col shadow-sm">
                        <div className="h-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-sm flex items-center px-2">
                            <div className="h-2 w-1/2 bg-white/30 rounded"></div>
                        </div>
                        <div className="p-2 flex-1 flex flex-col gap-1">
                            <div className="flex justify-between">
                                <div className="h-6 w-16 bg-gray-100 rounded"></div>
                                <div className="h-6 w-16 bg-blue-50 rounded border border-blue-100"></div>
                            </div>
                            <div className="flex-1 mt-1 bg-gray-50 rounded border border-gray-100"></div>
                        </div>
                    </div>
                );
            case 'minimal':
                return (
          <div className="w-full h-full bg-white p-3 flex flex-col gap-2 border border-gray-300">
            <div className="h-6 w-full border border-gray-800 flex items-center justify-center text-[10px] font-bold bg-gray-50">
              Title
            </div>
            <div className="flex-1 grid grid-rows-2 gap-1">
              <div className="grid grid-cols-4 gap-px text-[8px]">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 border border-gray-200"></div>
                ))}
              </div>
              <div className="h-full bg-white border border-gray-200 grid grid-rows-2">
                <div className="grid grid-cols-9 gap-px border-b border-gray-200">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-3 bg-gray-100"></div>
                  ))}
                </div>
                <div className="flex-1 bg-gray-50"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[8px]">
              <div className="h-8 border border-dashed border-gray-300 bg-gray-50"></div>
              <div className="h-8 border border-gray-300 bg-gray-50"></div>
            </div>
          </div>
        );
            case 'thermal':
                return (
                    <div className="w-2/3 h-full bg-white mx-auto shadow-md p-2 flex flex-col gap-1 items-center border border-gray-200">
                        <div className="h-3 w-8 bg-black rounded-sm mb-1"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="w-full border-t border-dashed border-gray-400 my-1"></div>
                        <div className="flex justify-between w-full"><div className="h-1 w-4 bg-gray-300"></div><div className="h-1 w-4 bg-gray-300"></div></div>
                        <div className="flex justify-between w-full"><div className="h-1 w-4 bg-gray-300"></div><div className="h-1 w-4 bg-gray-300"></div></div>
                        <div className="w-full border-t border-dashed border-gray-400 my-1"></div>
                        <div className="h-4 w-12 bg-black rounded mt-auto"></div>
                    </div>
                );
            case 'epson':
                return (
                    <div className="w-2/3 h-full bg-white mx-auto shadow-md p-2 flex flex-col gap-1 items-center border-2 border-blue-300">
                        <div className="h-3 w-10 bg-blue-600 rounded-sm mb-1"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="flex justify-between w-full text-[6px] px-1">
                            <div className="h-1 w-6 bg-gray-300"></div>
                            <div className="h-1 w-8 bg-gray-300"></div>
                        </div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="w-full border-t border-dashed border-gray-400 my-1"></div>
                        <div className="flex justify-between w-full text-[6px] px-1">
                            <div className="h-1 w-5 bg-gray-300"></div>
                            <div className="h-1 w-4 bg-gray-300"></div>
                            <div className="h-1 w-5 bg-gray-300"></div>
                            <div className="h-1 w-4 bg-gray-300"></div>
                        </div>
                        <div className="w-full border-t border-dashed border-gray-400 my-1"></div>
                        <div className="flex justify-between w-full text-[6px] px-1">
                            <div className="h-1 w-4 bg-gray-300"></div>
                            <div className="h-1 w-4 bg-gray-300"></div>
                        </div>
                        <div className="h-3 w-10 bg-blue-600 rounded mt-auto"></div>
                    </div>
                );
        }
    };

    return (
        <div 
            onClick={onSelect}
            className={`
                cursor-pointer rounded-xl border-2 relative overflow-hidden transition-all duration-300 group
                ${selected ? 'border-brand-blue ring-4 ring-blue-50 bg-white shadow-xl scale-[1.02]' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'}
            `}
        >
            {selected && (
                <div className="absolute top-3 right-3 bg-brand-blue text-white rounded-full p-1 z-20 shadow-sm">
                    <CheckCircleIcon className="w-5 h-5" />
                </div>
            )}
            
            <div className={`h-40 ${selected ? 'bg-gray-50' : 'bg-gray-100'} flex items-center justify-center p-4 transition-colors`}>
                <div className="w-28 h-36 shadow-lg transform group-hover:-translate-y-1 transition-transform duration-300">
                    {renderPreview()}
                </div>
            </div>

            <div className="p-5">
                <h3 className={`font-bold text-lg mb-1 ${selected ? 'text-brand-blue' : 'text-gray-800'}`}>{name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
    );
};

const getDefaultEpsonSettings = (): EpsonSettings => ({
    pageWidth: 150,
    fonts: {
        header: 14,
        body: 12,
        items: 11,
        totals: 13,
        footer: 10,
    },
    spacing: {
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 5,
        marginRight: 5,
        sectionGap: 5,
    },
    horizontalPositioning: {
        branchName: 0,
        date: 0,
        customerType: 0,
        customerName: 0,
        employeeName: 0,
        itemName: 0,
        itemQty: 0,
        itemPrice: 0,
        itemTaxable: 0,
        itemDiscount: 0,
        itemTaxRate: 0,
        itemTax: 0,
        itemTotal: 0,
        totalsSubtotal: 0,
        totalsDiscount: 0,
        totalsTax: 0,
        totalsNet: 0,
        qrCode: 0,
        footerText: 0,
        tafqeet: 0,
    },
    positioning: {
        branchName: 0,
        date: 0,
        customerType: 0,
        customerName: 0,
        employeeName: 0,
        itemName: 0,
        itemQty: 0,
        itemPrice: 0,
        itemTaxable: 0,
        itemDiscount: 0,
        itemTaxRate: 0,
        itemTax: 0,
        itemTotal: 0,
        totalsSubtotal: 0,
        totalsDiscount: 0,
        totalsTax: 0,
        totalsNet: 0,
        qrCode: 0,
        footerText: 0,
        tafqeet: 0,
    },
    visibility: {
        branchName: true,
        date: true,
        customerType: true,
        customerName: true,
        employeeName: true,
        itemName: true,
        itemQty: true,
        itemPrice: true,
        itemTaxable: true,
        itemDiscount: true,
        itemTaxRate: true,
        itemTax: true,
        itemTotal: true,
        totalsSubtotal: true,
        totalsDiscount: true,
        totalsTax: true,
        totalsNet: true,
        qrCode: true,
        footerText: true,
        tafqeet: true,
    },
    columnOrder: ['itemCode', 'itemName', 'itemQty', 'itemPrice', 'itemTaxable', 'itemDiscount', 'itemTaxRate', 'itemTax', 'itemTotal'],
});

const PrintSettings: React.FC<PrintSettingsProps> = ({ title }) => {
    const { showToast } = useToast();
    const { data: fetchedSettings, isLoading, error } = useGetPrintSettingsQuery();
    const [updatePrintSettings, { isLoading: isSaving }] = useUpdatePrintSettingsMutation();

    // Default settings
    const defaultSettings: PrintSettingsType = {
        template: "default",
        showLogo: true,
        showTaxNumber: true,
        showAddress: true,
        headerText: "",
        footerText: "",
        termsText: "",
    };

    const [localSettings, setLocalSettings] = React.useState<PrintSettingsType>(defaultSettings);

    // Update local state when data is fetched
    useEffect(() => {
        if (fetchedSettings) {
            const base = { ...fetchedSettings };
            if (base.template === 'epson' && !base.epsonSettings) {
                base.epsonSettings = getDefaultEpsonSettings();
            } else if (base.template === 'epson' && base.epsonSettings) {
                // Ensure horizontalPositioning exists for backward compatibility
                if (!base.epsonSettings.horizontalPositioning) {
                    base.epsonSettings.horizontalPositioning = getDefaultEpsonSettings().horizontalPositioning;
                }
            }
            setLocalSettings(base);
        } else if (!isLoading && !fetchedSettings) {
            // No settings in database, use defaults
            setLocalSettings(defaultSettings);
        }
    }, [fetchedSettings, isLoading]);

    const handleChange = (field: keyof PrintSettingsType, value: any) => {
        setLocalSettings(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'template' && value === 'epson' && !updated.epsonSettings) {
                updated.epsonSettings = getDefaultEpsonSettings();
            }
            return updated;
        });
    };

    const handleEpsonSettingsChange = (path: string[], value: any) => {
        setLocalSettings(prev => {
            const epsonSettings = prev.epsonSettings || getDefaultEpsonSettings();
            const updated = { ...epsonSettings };
            let current: any = updated;
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return { ...prev, epsonSettings: updated };
        });
    };

    const handleSave = async () => {
        try {
            await updatePrintSettings(localSettings).unwrap();
            showToast('تم حفظ إعدادات الطباعة وتطبيق النموذج الجديد.');
        } catch (error) {
            console.error('Failed to save print settings:', error);
            showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#eceff4] pb-24 font-sans text-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600 font-medium">جاري تحميل الإعدادات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#eceff4] pb-24 font-sans text-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 font-medium">حدث خطأ أثناء تحميل الإعدادات</p>
                </div>
            </div>
        );
    }

    const inputStyle = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all bg-gray-50 focus:bg-white text-gray-800";
    const labelStyle = "block text-sm font-bold text-gray-700 mb-2";

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <PrintIcon className="w-10 h-10" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{title}</h1>
                    <p className="text-gray-500 font-medium">تحكم في هوية مطبوعاتك واختر التصميم الذي يناسب علامتك التجارية.</p>
                </div>
            </div>

            {/* Template Selection Grid */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                    اختر نموذج الفاتورة
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <TemplatePreview 
                        id="default" 
                        name="الافتراضي (Default)" 
                        description="التصميم القياسي مع أعمدة الوحدة والضريبة (نسبة/قيمة)، متوازن ويحتوي على ألوان الهوية الأساسية."
                        selected={localSettings.template === 'default'}
                        onSelect={() => handleChange('template', 'default')}
                    />
                    <TemplatePreview 
                        id="classic" 
                        name="كلاسيك (Classic)" 
                        description="تصميم رسمي جداً بالأبيض والأسود. يعتمد على الجداول والحدود الواضحة. مناسب للشركات الرسمية."
                        selected={localSettings.template === 'classic'}
                        onSelect={() => handleChange('template', 'classic')}
                    />
                    <TemplatePreview 
                        id="modern" 
                        name="مودرن (Modern)" 
                        description="تصميم عصري وجذاب. يستخدم تدرجات لونية، خطوط حديثة، وتخطيط مفتوح."
                        selected={localSettings.template === 'modern'}
                        onSelect={() => handleChange('template', 'modern')}
                    />
                    <TemplatePreview 
                        id="minimal" 
                        name="الضريبي (Minimal)" 
                        description="تصميم رسمي أبيض وأسود بجدول تفصيلي (ثنائي اللغة) وتذييل إجمالي مشابه للنموذج المرفق."
                        selected={localSettings.template === 'minimal'}
                        onSelect={() => handleChange('template', 'minimal')}
                    />
                    <TemplatePreview 
                        id="thermal" 
                        name="إيصال (Thermal)" 
                        description="مخصص لطابعات الكاشير الحرارية (80mm). مثالي لنقاط البيع، المطاعم، والبقالات."
                        selected={localSettings.template === 'thermal'}
                        onSelect={() => handleChange('template', 'thermal')}
                    />
                    <TemplatePreview 
                        id="epson" 
                        name="إبسون (Epson)" 
                        description="نموذج قابل للتخصيص بالكامل مع تحكم في الحجم، الخطوط، المحاذاة، والمواضع. مثالي لطابعات Epson الحرارية."
                        selected={localSettings.template === 'epson'}
                        onSelect={() => handleChange('template', 'epson')}
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Options */}
                <section className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                        تخصيص المحتوى
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyle}>نص ترويسة الفاتورة (Header)</label>
                                <input 
                                    type="text" 
                                    className={inputStyle} 
                                    placeholder="مثال: فاتورة ضريبية مبسطة" 
                                    value={localSettings.headerText}
                                    onChange={(e) => handleChange('headerText', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelStyle}>نص تذييل الفاتورة (Footer)</label>
                                <input 
                                    type="text" 
                                    className={inputStyle} 
                                    placeholder="مثال: شكراً لزيارتكم" 
                                    value={localSettings.footerText}
                                    onChange={(e) => handleChange('footerText', e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className={labelStyle}>الشروط والأحكام</label>
                            <textarea 
                                className={inputStyle} 
                                rows={4} 
                                placeholder="مثال: البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام من تاريخ الشراء." 
                                value={localSettings.termsText}
                                onChange={(e) => handleChange('termsText', e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-2">ستظهر هذه النصوص في أسفل الفاتورة.</p>
                        </div>
                    </div>
                </section>

                {/* Epson Customization */}
                {localSettings.template === 'epson' && (
                    <section className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">⚙️</span>
                            تخصيص نموذج إبسون
                        </h2>
                        
                        {(() => {
                            const epson = localSettings.epsonSettings || getDefaultEpsonSettings();
                            return (
                                <div className="space-y-8">
                                    {/* Page Size */}
                                    <div className="border-b border-gray-200 pb-6">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">حجم الصفحة</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelStyle}>العرض (مم)</label>
                                                <input 
                                                    type="number" 
                                                    className={inputStyle}
                                                    value={epson.pageWidth}
                                                    onChange={(e) => handleEpsonSettingsChange(['pageWidth'], parseFloat(e.target.value) || 80)}
                                                    min="50"
                                                    max="200"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelStyle}>الارتفاع (مم) - اتركه فارغاً للتلقائي</label>
                                                <input 
                                                    type="number" 
                                                    className={inputStyle}
                                                    value={epson.pageHeight || ''}
                                                    onChange={(e) => handleEpsonSettingsChange(['pageHeight'], e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    min="100"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Font Sizes */}
                                    <div className="border-b border-gray-200 pb-6">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">أحجام الخطوط (بكسل)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {Object.entries(epson.fonts).map(([key, value]) => (
                                                <div key={key}>
                                                    <label className={labelStyle}>
                                                        {key === 'header' ? 'الترويسة' : 
                                                         key === 'body' ? 'النص' :
                                                         key === 'items' ? 'الأصناف' :
                                                         key === 'totals' ? 'الإجماليات' : 'التذييل'}
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className={inputStyle}
                                                        value={value}
                                                        onChange={(e) => handleEpsonSettingsChange(['fonts', key], parseInt(e.target.value) || 10)}
                                                        min="8"
                                                        max="24"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Spacing */}
                                    <div className="border-b border-gray-200 pb-6">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">المسافات والهوامش (مم)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                            {Object.entries(epson.spacing).map(([key, value]) => (
                                                <div key={key}>
                                                    <label className={labelStyle}>
                                                        {key === 'marginTop' ? 'هامش علوي' :
                                                         key === 'marginBottom' ? 'هامش سفلي' :
                                                         key === 'marginLeft' ? 'هامش أيسر' :
                                                         key === 'marginRight' ? 'هامش أيمن' : 'فجوة بين الأقسام'}
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className={inputStyle}
                                                        value={value}
                                                        onChange={(e) => handleEpsonSettingsChange(['spacing', key], parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        max="50"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Horizontal Positioning */}
                                    <div className="border-b border-gray-200 pb-6">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">المواضع الأفقية (بكسل - موجب لليمين، سالب لليسار)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(epson.horizontalPositioning || getDefaultEpsonSettings().horizontalPositioning || {}).map(([key, value]) => (
                                                <div key={key}>
                                                    <label className={labelStyle}>
                                                        {key === 'branchName' ? 'اسم الفرع' :
                                                         key === 'date' ? 'التاريخ' :
                                                         key === 'customerType' ? 'نوع العميل' :
                                                         key === 'customerName' ? 'اسم العميل' :
                                                         key === 'employeeName' ? 'اسم الموظف' :
                                                         key === 'itemName' ? 'اسم الصنف' :
                                                         key === 'itemQty' ? 'الكمية' :
                                                         key === 'itemPrice' ? 'السعر' :
                                                         key === 'itemTaxable' ? 'المبلغ الخاضع للضريبة' :
                                                         key === 'itemDiscount' ? 'خصومات' :
                                                         key === 'itemTaxRate' ? 'نسبة الضريبة' :
                                                         key === 'itemTax' ? 'مبلغ الضريبة' :
                                                         key === 'itemTotal' ? 'الإجمالي' :
                                                         key === 'totalsSubtotal' ? 'المجموع' :
                                                         key === 'totalsDiscount' ? 'الخصم' :
                                                         key === 'totalsTax' ? 'ضريبة الإجمالي' :
                                                         key === 'totalsNet' ? 'الصافي' :
                                                         key === 'qrCode' ? 'رمز QR' :
                                                         key === 'footerText' ? 'نص التذييل' :
                                                         key === 'tafqeet' ? 'المبلغ كتابة' : key}
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className={inputStyle}
                                                        value={value}
                                                        onChange={(e) => handleEpsonSettingsChange(['horizontalPositioning', key], parseFloat(e.target.value) || 0)}
                                                        min="-50"
                                                        max="50"
                                                        step="1"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Positioning */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">مواضع العناصر (بكسل - موجب للأعلى، سالب للأسفل)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {Object.entries(epson.positioning).map(([key, value]) => (
                                                <div key={key}>
                                                    <label className={labelStyle}>
                                                        {key === 'branchName' ? 'اسم الفرع' :
                                                         key === 'date' ? 'التاريخ' :
                                                         key === 'customerType' ? 'نوع العميل' :
                                                         key === 'itemName' ? 'اسم الصنف' :
                                                         key === 'itemQty' ? 'الكمية' :
                                                         key === 'itemPrice' ? 'السعر' :
                                                         key === 'itemTaxable' ? 'المبلغ الخاضع للضريبة' :
                                                         key === 'itemDiscount' ? 'خصومات' :
                                                         key === 'itemTaxRate' ? 'نسبة الضريبة' :
                                                         key === 'itemTax' ? 'مبلغ الضريبة' :
                                                         key === 'itemTotal' ? 'الإجمالي' :
                                                         key === 'totalsSubtotal' ? 'المجموع' :
                                                         key === 'totalsTax' ? 'ضريبة الإجمالي' :
                                                         key === 'totalsNet' ? 'الصافي' :
                                                         key === 'qrCode' ? 'رمز QR' : 'نص التذييل'}
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        className={inputStyle}
                                                        value={value}
                                                        onChange={(e) => handleEpsonSettingsChange(['positioning', key], parseFloat(e.target.value) || 0)}
                                                        min="-50"
                                                        max="50"
                                                        step="1"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Column Order Controls */}
                                    <div className="mt-8 border-b border-gray-200 pb-6">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">ترتيب أعمدة الأصناف</h3>
                                        <div className="space-y-2">
                                            {(epson.columnOrder || getDefaultEpsonSettings().columnOrder || []).map((col, index) => {
                                                const columnLabels: Record<string, string> = {
                                                    itemCode: 'كود الصنف',
                                                    itemName: 'اسم الصنف',
                                                    itemQty: 'الكمية',
                                                    itemPrice: 'السعر',
                                                    itemTaxable: 'قبل الضريبة',
                                                    itemDiscount: 'الخصم',
                                                    itemTaxRate: 'نسبة الضريبة',
                                                    itemTax: 'الضريبة',
                                                    itemTotal: 'الإجمالي',
                                                };
                                                return (
                                                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                        <button
                                                            onClick={() => {
                                                                if (index > 0) {
                                                                    const newOrder = [...(epson.columnOrder || getDefaultEpsonSettings().columnOrder || [])];
                                                                    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                                                    handleEpsonSettingsChange(['columnOrder'], newOrder);
                                                                }
                                                            }}
                                                            disabled={index === 0}
                                                            className={`px-3 py-1 rounded ${index === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors`}
                                                        >
                                                            ← يسار
                                                        </button>
                                                        <span className="flex-1 text-sm font-semibold text-gray-700">{columnLabels[col] || col}</span>
                                                        <button
                                                            onClick={() => {
                                                                const currentOrder = epson.columnOrder || getDefaultEpsonSettings().columnOrder || [];
                                                                if (index < currentOrder.length - 1) {
                                                                    const newOrder = [...currentOrder];
                                                                    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                                                    handleEpsonSettingsChange(['columnOrder'], newOrder);
                                                                }
                                                            }}
                                                            disabled={index === (epson.columnOrder || getDefaultEpsonSettings().columnOrder || []).length - 1}
                                                            className={`px-3 py-1 rounded ${index === (epson.columnOrder || getDefaultEpsonSettings().columnOrder || []).length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors`}
                                                        >
                                                            يمين →
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Visibility Controls */}
                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold text-gray-700 mb-4">إظهار/إخفاء العناصر</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {Object.entries(epson.visibility || getDefaultEpsonSettings().visibility || {}).map(([key, value]) => (
                                                <label key={key} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                                    <div className="relative flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="peer sr-only"
                                                            checked={value !== false}
                                                            onChange={(e) => handleEpsonSettingsChange(['visibility', key], e.target.checked)}
                                                        />
                                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </div>
                                                    <span className="mr-3 text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                                                        {key === 'branchName' ? 'اسم الفرع' :
                                                         key === 'date' ? 'التاريخ' :
                                                         key === 'customerType' ? 'نوع العميل' :
                                                         key === 'customerName' ? 'اسم العميل' :
                                                         key === 'employeeName' ? 'اسم الموظف' :
                                                         key === 'itemName' ? 'اسم الصنف' :
                                                         key === 'itemQty' ? 'الكمية' :
                                                         key === 'itemPrice' ? 'السعر' :
                                                         key === 'itemTaxable' ? 'المبلغ الخاضع للضريبة' :
                                                         key === 'itemDiscount' ? 'خصومات' :
                                                         key === 'itemTaxRate' ? 'نسبة الضريبة' :
                                                         key === 'itemTax' ? 'مبلغ الضريبة' :
                                                         key === 'itemTotal' ? 'الإجمالي' :
                                                         key === 'totalsSubtotal' ? 'المجموع' :
                                                         key === 'totalsDiscount' ? 'الخصم' :
                                                         key === 'totalsTax' ? 'ضريبة الإجمالي' :
                                                         key === 'totalsNet' ? 'الصافي' :
                                                         key === 'qrCode' ? 'رمز QR' :
                                                         key === 'footerText' ? 'نص التذييل' :
                                                         key === 'tafqeet' ? 'المبلغ كتابة' : key}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </section>
                )}

                {/* Toggles */}
                <section className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                        خيارات العرض
                    </h2>
                    
                    <div className="space-y-4">
                        {[
                            { key: 'showLogo', label: 'إظهار الشعار (Logo)' },
                            { key: 'showTaxNumber', label: 'إظهار الرقم الضريبي' },
                            { key: 'showAddress', label: 'إظهار العنوان وبيانات الاتصال' }
                        ].map((opt) => (
                            <label key={opt.key} className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        className="peer sr-only"
                                        checked={(localSettings as any)[opt.key]}
                                        onChange={(e) => handleChange(opt.key as keyof PrintSettingsType, e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="mr-4 font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{opt.label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-800 hover:shadow-xl transform transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCwIcon className="w-5 h-5 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                'حفظ وتطبيق الإعدادات'
                            )}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PrintSettings;
