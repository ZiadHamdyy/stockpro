import React, { useState, useMemo, useEffect } from 'react';
import { 
  SaveIcon as Save, 
  ShieldCheckIcon as ShieldCheck, 
  SettingsIcon as Settings2,
  CheckCircleIcon as CheckCircle2,
  AlertTriangleIcon as AlertOctagon,
  CreditCardIcon as CreditCard,
  BuildingIcon as Building2,
  BoxIcon as Box,
  ScaleIcon as Scale,
  LockIcon as Lock,
  HistoryIcon as History,
  BanIcon as Ban,
  CoinsIcon as Coins,
  FileTextIcon as FileText,
  WalletIcon as Wallet,
  CalculatorIcon as Calculator,
  ArrowRightIcon as ArrowRight,
  RefreshCwIcon as RefreshCw,
  HelpIcon as HelpCircle,
  TagIcon as Tag,
  CheckIcon as Check,
  XIcon as X
} from '../../../icons';
import { PricingConfig, ValuationMethod, TaxPolicy, RoundingMethod, StrictnessLevel } from './types';
import { Switch } from './Switch';

// --- UI Components ---

const SelectField = ({ label, value, options, onChange, icon: Icon, help, className = "" }: any) => (
  <div className={`mb-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0 transition-colors duration-300 ${className}`}>
    <label className="text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-2 group-hover/card:text-blue-800 transition-colors">
      {Icon && (
        <span className="p-1 rounded bg-slate-100 text-slate-500 group-hover/card:bg-blue-100 group-hover/card:text-blue-600 transition-all duration-300">
          <Icon className="w-3 h-3" />
        </span>
      )}
      {label}
    </label>
    <div className="relative group/input">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border-slate-200 bg-slate-50 text-sm py-2.5 px-3 pr-8 text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white focus:shadow-md shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-white"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
    {help && <p className="text-[10px] text-gray-400 mt-1.5 font-medium flex items-start gap-1 group-hover/card:text-gray-500 transition-colors"><HelpCircle className="w-2.5 h-2.5 mt-0.5" /> {help}</p>}
  </div>
);

const InputField = ({ label, value, type = "text", onChange, icon: Icon, suffix, help, className = "" }: any) => (
  <div className={`mb-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0 transition-colors duration-300 ${className}`}>
    <label className="text-xs font-extrabold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-2 group-hover/card:text-blue-800 transition-colors">
      {Icon && (
        <span className="p-1 rounded bg-slate-100 text-slate-500 group-hover/card:bg-blue-100 group-hover/card:text-blue-600 transition-all duration-300">
          <Icon className="w-3 h-3" />
        </span>
      )}
      {label}
    </label>
    <div className="relative rounded-lg shadow-sm group/input">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="block w-full rounded-lg border-slate-200 bg-slate-50 text-sm py-2.5 px-3 font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white focus:shadow-md shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-white"
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-xs font-bold group-focus-within/input:text-blue-600 transition-colors">{suffix}</span>
        </div>
      )}
    </div>
    {help && <p className="text-[10px] text-gray-400 mt-1.5 font-medium flex items-start gap-1 group-hover/card:text-gray-500 transition-colors"><HelpCircle className="w-2.5 h-2.5 mt-0.5" /> {help}</p>}
  </div>
);

const InteractiveCard = ({ title, icon: Icon, children, accentColor = "royal" }: { title: string, icon: any, children?: React.ReactNode, accentColor?: "royal" | "regal" | "gold" | "red" }) => {
  // Define styles based on accent color
  const styles = {
    royal: {
      borderTop: "border-t-blue-600",
      headerBg: "bg-gradient-to-r from-blue-50 via-white to-white",
      iconBox: "bg-blue-600 text-white shadow-blue-200",
      titleText: "text-blue-900",
      glow: "group-hover/card:shadow-blue-900/5",
      borderHover: "group-hover/card:border-blue-300",
      underlineBg: "bg-blue-500/20"
    },
    regal: {
      borderTop: "border-t-indigo-600",
      headerBg: "bg-gradient-to-r from-indigo-50 via-white to-white",
      iconBox: "bg-indigo-600 text-white shadow-indigo-200",
      titleText: "text-indigo-900",
      glow: "group-hover/card:shadow-indigo-900/5",
      borderHover: "group-hover/card:border-indigo-300",
      underlineBg: "bg-indigo-500/20"
    },
    gold: {
      borderTop: "border-t-gold-500",
      headerBg: "bg-gradient-to-r from-yellow-50 via-white to-white",
      iconBox: "bg-gold-500 text-white shadow-yellow-200",
      titleText: "text-yellow-900",
      glow: "group-hover/card:shadow-yellow-900/5",
      borderHover: "group-hover/card:border-yellow-300",
      underlineBg: "bg-yellow-500/20"
    },
    red: {
      borderTop: "border-t-red-600",
      headerBg: "bg-gradient-to-r from-red-50 via-white to-white",
      iconBox: "bg-red-600 text-white shadow-red-200",
      titleText: "text-red-900",
      glow: "group-hover/card:shadow-red-900/5",
      borderHover: "group-hover/card:border-red-300",
      underlineBg: "bg-red-500/20"
    },
  };

  const currentStyle = styles[accentColor];

  return (
    <div className={`group/card bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200 border-t-[4px] ${currentStyle.borderTop} transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl ${currentStyle.glow} hover:border-t-[6px] flex flex-col h-full overflow-hidden`}>
      {/* Header Area */}
      <div className={`flex items-center gap-4 px-6 py-5 border-b border-slate-100 ${currentStyle.headerBg} transition-all duration-300`}>
        <div className={`p-2.5 rounded-lg shadow-lg ${currentStyle.iconBox} transform transition-transform duration-300 group-hover/card:scale-110 group-hover/card:rotate-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
           <h3 className={`text-lg font-black tracking-tight ${currentStyle.titleText} transition-colors duration-300`}>{title}</h3>
           <div className={`h-1 w-0 group-hover/card:w-full transition-all duration-700 ${currentStyle.underlineBg} rounded mt-1`}></div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-6 relative">
        {/* Subtle background decoration on hover */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 rounded-bl-full pointer-events-none"></div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Helper Component: Tax Example Box ---
const TaxExampleBox = ({ rate, policy, currency }: { rate: number, policy: TaxPolicy, currency: string }) => {
  const basePrice = 100;
  let finalPrice, taxAmount, revenue;

  if (policy === TaxPolicy.EXCLUSIVE) {
    revenue = basePrice;
    taxAmount = basePrice * (rate / 100);
    finalPrice = basePrice + taxAmount;
  } else {
    finalPrice = basePrice;
    revenue = basePrice / (1 + (rate / 100));
    taxAmount = finalPrice - revenue;
  }

  return (
    <div className="mt-5 bg-blue-50/30 rounded-xl p-0 border border-blue-100 overflow-hidden shadow-sm group/example hover:border-blue-200 transition-colors">
      <div className="bg-white/60 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2 font-bold text-blue-800 text-xs">
        <div className="p-1 bg-blue-100 rounded text-blue-600">
           <Calculator className="w-3 h-3" />
        </div>
        <span>مثال رقمي (لصنف سعره {basePrice} {currency})</span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-[10px] mb-1.5 font-medium uppercase tracking-wider">يدفع العميل</span>
          <span className="font-black text-slate-800 text-base bg-white px-2 py-1 rounded border border-slate-100 w-full">{finalPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex flex-col items-center relative">
           <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300">
             <ArrowRight className="w-3 h-3" />
           </div>
           <span className="text-gray-400 text-[10px] mb-1.5 font-medium uppercase tracking-wider">الضريبة</span>
           <span className="font-bold text-red-500 text-sm bg-red-50 px-2 py-1.5 rounded border border-red-100 w-full">{taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex flex-col items-center relative">
           <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 text-gray-300">
             <ArrowRight className="w-3 h-3" />
           </div>
           <span className="text-gray-400 text-[10px] mb-1.5 font-medium uppercase tracking-wider">صافي لك</span>
           <span className="font-black text-indigo-600 text-base bg-white px-2 py-1 rounded border border-slate-100 w-full">{revenue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component: Rounding Simulation ---
const RoundingSimulation = ({ method }: { method: RoundingMethod }) => {
  const exampleValue = 10.23;
  let roundedValue = exampleValue;
  let label = "";

  switch (method) {
    case RoundingMethod.NEAREST_0_05:
      roundedValue = Math.round(exampleValue * 20) / 20;
      label = "لأقرب 5 هللات";
      break;
    case RoundingMethod.NEAREST_1_00:
      roundedValue = Math.round(exampleValue);
      label = "لأقرب عدد صحيح";
      break;
    default:
      label = "بدون جبر";
  }

  return (
    <div className="mt-2 flex items-center justify-between bg-slate-100 rounded px-2 py-1.5 text-xs">
        <span className="text-gray-500">مثال: {exampleValue}</span>
        <ArrowRight className="w-3 h-3 text-gray-400" />
        <span className="font-bold text-blue-700">{roundedValue.toFixed(2)} ({label})</span>
    </div>
  );
}

// --- Main Application ---

interface FinancialSystemProps {
  title?: string;
}

const FinancialSystem: React.FC<FinancialSystemProps> = ({ title }) => {
  // --- State ---
  // Initialize from localStorage for backward compatibility
  const [config, setConfig] = useState<PricingConfig>(() => {
    // Read from localStorage
    const allowSellingLessThanStock = (() => {
      const stored = localStorage.getItem("allowSellingLessThanStock");
      return stored ? JSON.parse(stored) : false;
    })();
    
    const salePriceIncludesTax = (() => {
      const stored = localStorage.getItem("salePriceIncludesTax");
      return stored ? JSON.parse(stored) : false;
    })();
    
    const allowSellingLessThanCost = (() => {
      const stored = localStorage.getItem("allowSellingLessThanCost");
      return stored ? JSON.parse(stored) : false;
    })();

    const storedCreditLimitControl = (() => {
      const stored = localStorage.getItem("creditLimitControl");
      if (
        stored === StrictnessLevel.BLOCK ||
        stored === StrictnessLevel.APPROVAL
      ) {
        return stored as StrictnessLevel;
      }
      return StrictnessLevel.BLOCK;
    })();

    const storedCogsMethod = (() => {
      const stored = localStorage.getItem("cogsMethod");
      if (
        stored === ValuationMethod.WEIGHTED_AVERAGE ||
        stored === ValuationMethod.LAST_PURCHASE_PRICE ||
        stored === ValuationMethod.FIFO
      ) {
        return stored as ValuationMethod;
      }
      return ValuationMethod.WEIGHTED_AVERAGE;
    })();

    const storedInventoryValuationMethod = (() => {
      const stored = localStorage.getItem("inventoryValuationMethod");
      if (
        stored === ValuationMethod.WEIGHTED_AVERAGE ||
        stored === ValuationMethod.LAST_PURCHASE_PRICE ||
        stored === ValuationMethod.FIFO
      ) {
        return stored as ValuationMethod;
      }
      return ValuationMethod.WEIGHTED_AVERAGE;
    })();

    return {
      taxPolicy: salePriceIncludesTax ? TaxPolicy.INCLUSIVE : TaxPolicy.EXCLUSIVE,
      defaultTaxRate: 15,
      baseCurrency: 'SAR',
      enableMultiCurrency: false,
      roundingMethod: RoundingMethod.NEAREST_0_05,
      inventoryValuationMethod: storedInventoryValuationMethod,
      cogsMethod: storedCogsMethod,
      autoUpdateSalePriceOnPurchase: false,
      defaultMarginPercentage: 25,
      lockPostedPeriods: true,
      closingDate: new Date().toISOString().split('T')[0],
      preventDuplicateSupplierRef: true,
      creditLimitControl: storedCreditLimitControl,
      minMarginControl: StrictnessLevel.BLOCK,
      allowSellingBelowCost: allowSellingLessThanCost,
      maxCashTransactionLimit: 5000,
      requireCostCenterForExpenses: true,
      allowNegativeStock: allowSellingLessThanStock,
      reserveStockOnOrder: true,
      maxDiscountPercentage: 15,
      requireManagerApprovalForDiscount: true,
      activePriceLists: { 'أساسي': true, 'جملة': false, 'كبار العملاء (VIP)': true },
    };
  });

  const [showToast, setShowToast] = useState(false);

  // --- Sync to localStorage for backward compatibility ---
  useEffect(() => {
    localStorage.setItem(
      "allowSellingLessThanStock",
      JSON.stringify(config.allowNegativeStock)
    );
  }, [config.allowNegativeStock]);

  useEffect(() => {
    localStorage.setItem(
      "allowSellingLessThanCost",
      JSON.stringify(config.allowSellingBelowCost)
    );
  }, [config.allowSellingBelowCost]);

  useEffect(() => {
    localStorage.setItem(
      "creditLimitControl",
      config.creditLimitControl
    );
  }, [config.creditLimitControl]);

  useEffect(() => {
    const salePriceIncludesTax = config.taxPolicy === TaxPolicy.INCLUSIVE;
    localStorage.setItem(
      "salePriceIncludesTax",
      JSON.stringify(salePriceIncludesTax)
    );
  }, [config.taxPolicy]);

  useEffect(() => {
    localStorage.setItem(
      "cogsMethod",
      config.cogsMethod
    );
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('cogsMethodChanged', { detail: config.cogsMethod }));
  }, [config.cogsMethod]);

  useEffect(() => {
    localStorage.setItem(
      "inventoryValuationMethod",
      config.inventoryValuationMethod
    );
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('inventoryValuationMethodChanged', { detail: config.inventoryValuationMethod }));
  }, [config.inventoryValuationMethod]);

  // --- Calculations for Policy Strength ---
  const policyStrength = useMemo(() => {
    let score = 100;
    
    // High risk: Allow negative stock (major inventory risk)
    if (config.allowNegativeStock) score -= 30;
    
    // High risk: Allow selling below cost (financial loss risk)
    if (config.allowSellingBelowCost) score -= 20;
    
    // Medium risk: Credit limit control (weak enforcement)
    if (config.creditLimitControl === StrictnessLevel.APPROVAL) score -= 5;
    
    // Medium risk: Discount controls (no manager approval required)
    if (!config.requireManagerApprovalForDiscount) score -= 10;
    
    // Low risk: High discount percentage (above 20%)
    if (config.maxDiscountPercentage > 20) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }, [config]);

  // --- Handlers ---
  const handleToggle = (key: keyof PricingConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] as boolean }));
  };

  const handleChange = (key: keyof PricingConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const togglePriceList = (listName: string) => {
    setConfig(prev => ({
        ...prev,
        activePriceLists: {
            ...prev.activePriceLists,
            [listName]: !prev.activePriceLists[listName]
        }
    }));
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#eceff4] pb-24 font-sans text-slate-900">
      
      {/* 1. Dashboard Header & Policy Strength Hero */}
      <header className="bg-blue-900 text-white pb-20 pt-6 shadow-xl relative overflow-hidden">
         {/* Background pattern */}
         <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
         
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
               <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm shadow-2xl shadow-blue-900/50">
                    <Settings2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">{title || 'إعدادات النظام المالي'}</h1>
                    <p className="text-blue-200 text-sm mt-1 font-medium">لوحة التحكم المركزية للسياسات المحاسبية</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <button onClick={handleSave} className="px-6 py-2.5 text-xs font-bold text-blue-950 bg-white hover:bg-gray-50 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95">
                    <Save className="w-4 h-4" />
                    حفظ وتطبيق
                  </button>
               </div>
            </div>

            {/* Policy Strength Meter (Hero Widget) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-center gap-8 shadow-2xl">
               <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-sm font-bold text-white flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-indigo-300" />
                       مستوى الأمان المالي والرقابي
                     </span>
                     <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                        policyStrength >= 80 ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30' : 'bg-red-500/20 text-red-200 border-red-500/30'
                     }`}>
                        {policyStrength}% {policyStrength >= 80 ? '(آمن)' : '(مخاطرة مرتفعة)'}
                     </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)] ${
                         policyStrength >= 80 ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' : 
                         policyStrength >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                         'bg-gradient-to-r from-red-500 to-red-700'
                       }`} 
                       style={{ width: `${policyStrength}%` }}
                     />
                  </div>
               </div>
               <div className="text-xs font-medium text-blue-200 md:w-1/3 leading-relaxed border-r border-white/10 pr-6 mr-6 hidden md:block opacity-80">
                  يعتمد هذا المؤشر على تحليل فوري للمخاطر المحتملة من الإعدادات الحالية، مثل السماح بالبيع المكشوف أو تعديل الفترات المغلقة.
               </div>
            </div>
         </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
           {/* Section 1: Financial Basics */}
           <InteractiveCard title="المالية والضرائب" icon={Building2} accentColor="royal">
              <div className="grid grid-cols-2 gap-4 mb-2">
                 <SelectField 
                    label="العملة"
                    value={config.baseCurrency}
                    onChange={(v: string) => handleChange('baseCurrency', v)}
                    options={[
                      { value: 'SAR', label: 'ريال (SAR)' },
                      { value: 'USD', label: 'دولار (USD)' },
                      { value: 'AED', label: 'درهم (AED)' }
                    ]}
                    className="border-b-0 pb-0 mb-0" 
                 />
                 <InputField 
                    label="الضريبة %"
                    value={config.defaultTaxRate}
                    onChange={(v: number) => handleChange('defaultTaxRate', v)}
                    type="number"
                    className="border-b-0 pb-0 mb-0" 
                 />
              </div>
              <div className="h-px bg-slate-100 mb-5 w-full"></div>

              <SelectField 
                 label="سياسة احتساب الضريبة"
                 value={config.taxPolicy}
                 onChange={(v: string) => handleChange('taxPolicy', v)}
                 icon={Scale}
                 options={[
                   { value: TaxPolicy.EXCLUSIVE, label: 'غير شامل (يضاف للمجموع)' },
                   { value: TaxPolicy.INCLUSIVE, label: 'شامل (يخصم من المجموع)' }
                 ]}
              />
              
              {/* Dynamic Tax Example */}
              <TaxExampleBox rate={config.defaultTaxRate} policy={config.taxPolicy} currency={config.baseCurrency} />
           </InteractiveCard>

           {/* Section 2: Valuation */}
           <InteractiveCard title="تقييم المخزون والتكلفة" icon={Box} accentColor="royal">
              <SelectField 
                  label="تقييم الأصول (الميزانية)"
                  value={config.inventoryValuationMethod}
                  onChange={(v: string) => handleChange('inventoryValuationMethod', v)}
                  help="تؤثر على قيمة المخزون في نهاية الفترة."
                  options={[
                    { value: ValuationMethod.WEIGHTED_AVERAGE, label: 'متوسط التكلفة' },
                    { value: ValuationMethod.FIFO, label: 'آخر سعر شراء' },
                  ]}
              />
              
              <SelectField 
                  label="حساب التكلفة (قائمة الدخل)"
                  value={config.cogsMethod}
                  onChange={(v: string) => handleChange('cogsMethod', v)}
                  help="تؤثر على حساب تكلفة البضاعة المباعة في قائمة الدخل."
                  options={[
                    { value: ValuationMethod.WEIGHTED_AVERAGE, label: 'متوسط التكلفة' },
                    { value: ValuationMethod.LAST_PURCHASE_PRICE, label: 'سعر السوق الحالي' },
                  ]}
              />

           </InteractiveCard>

           {/* Section 4: Sales Controls */}
           <InteractiveCard title="ضوابط المبيعات والائتمان" icon={CreditCard} accentColor="regal">
              <SelectField 
                  label="إجراء تجاوز حد الائتمان"
                  value={config.creditLimitControl}
                  onChange={(v: string) => handleChange('creditLimitControl', v)}
                  icon={Ban}
                  options={[
                    { value: StrictnessLevel.BLOCK, label: 'منع إصدار الفاتورة' },
                    { value: StrictnessLevel.APPROVAL, label: 'طلب موافقة إدارية' }
                  ]}
              />
              
              <div className="flex items-start gap-4 mb-5 pb-5 border-b border-slate-100">
                   <div className="flex-1">
                      <InputField 
                        label="سقف الخصم"
                        value={config.maxDiscountPercentage}
                        onChange={(v: number) => handleChange('maxDiscountPercentage', v)}
                        type="number"
                        className="border-b-0 pb-0 mb-0"
                      />
                   </div>
                   <div className="flex-1 pt-7">
                     <Switch 
                        checked={config.requireManagerApprovalForDiscount}
                        onChange={() => handleToggle('requireManagerApprovalForDiscount')}
                        label="طلب موافقة"
                     />
                   </div>
              </div>
              
              {/* Highlighted Selling Below Cost Option */}
              <div className={`rounded-xl p-4 transition-all duration-300 border ${config.allowSellingBelowCost ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-transparent border-slate-100'}`}>
                 <Switch 
                    checked={config.allowSellingBelowCost}
                    onChange={() => handleToggle('allowSellingBelowCost')}
                    label="السماح بالبيع بأقل من التكلفة"
                    description="تفعيل هذا الخيار قد يسبب خسائر."
                    variant="danger"
                 />
              </div>
              <br />
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-5 shadow-sm group/warn">
                 <div className="flex items-start gap-3 mb-3 pb-3 border-b border-yellow-200/50">
                    <div className="bg-yellow-100 p-1.5 rounded-full text-yellow-700">
                        <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-yellow-900 group-hover/warn:text-yellow-700 transition-colors">خطر المخزون السالب</h4>
                       <p className="text-[10px] text-yellow-800 mt-1 leading-tight font-medium">يؤدي لتشوه متوسط التكلفة وتقارير غير دقيقة.</p>
                    </div>
                 </div>
                 <div>
                   <Switch 
                      checked={config.allowNegativeStock}
                      onChange={() => handleToggle('allowNegativeStock')}
                      label="السماح بالمخزون السالب"
                      variant="danger"
                   />
                 </div>
              </div>
           </InteractiveCard>

        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-blue-950 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-blue-800 ring-4 ring-black/5">
             <div className="bg-indigo-500 rounded-full p-1">
               <CheckCircle2 className="w-4.5 h-4.5" />
             </div>
             <div>
                <span className="text-sm font-bold block">تم حفظ السياسات بنجاح</span>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinancialSystem;