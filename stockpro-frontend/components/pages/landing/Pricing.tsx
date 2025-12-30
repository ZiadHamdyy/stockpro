
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon } from './icons/IconCollection';
import Modal from './Modal';
import SubscriptionForm, { PlanType } from './SubscriptionForm';

interface PricingCardProps {
  plan: string;
  planKey: 'basic' | 'pro' | 'enterprise';
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  popular?: boolean;
  isYearly: boolean;
  onPriceChange: (newPrice: string) => void;
  onSubscribe: (plan: 'basic' | 'pro' | 'enterprise') => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, planKey, monthlyPrice, yearlyPrice, features, popular = false, isYearly, onPriceChange, onSubscribe }) => {
  const [isEditing, setIsEditing] = useState(false);
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
  const [editingPrice, setEditingPrice] = useState(currentPrice);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingPrice(currentPrice);
  }, [currentPrice]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numericValue = editingPrice.replace(/[^0-9.]/g, '');
    if (numericValue.trim()) {
      onPriceChange(numericValue.trim() + ' ر.س');
    } else {
      setEditingPrice(currentPrice);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingPrice(currentPrice);
      setIsEditing(false);
    }
  };

  const planColors: Record<string, { gradient: string; bgGradient: string; border: string; priceGradient: string; badgeGradient: string }> = {
    basic: {
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50',
      border: 'border-blue-300/50',
      priceGradient: 'from-blue-600 to-blue-700',
      badgeGradient: 'from-blue-500 to-blue-600',
    },
    pro: {
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
      border: 'border-emerald-300/50',
      priceGradient: 'from-emerald-600 to-emerald-700',
      badgeGradient: 'from-emerald-500 to-emerald-600',
    },
    enterprise: {
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50',
      border: 'border-purple-300/50',
      priceGradient: 'from-purple-600 to-purple-700',
      badgeGradient: 'from-purple-500 to-purple-600',
    },
  };
  const colors = planColors[planKey];
  
  return (
    <div className={`rounded-3xl p-8 flex flex-col bg-gradient-to-br ${colors.bgGradient} transition-all duration-300 ${popular ? `border-2 ${colors.border} shadow-2xl scale-105 z-10 relative` : `border-2 border-white/80 shadow-lg hover:shadow-xl`} hover:-translate-y-2`}>
      {popular && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r ${colors.badgeGradient} text-white text-sm font-bold px-6 py-2 rounded-full shadow-xl`}>
            الأكثر طلباً
        </div>
      )}
      <h3 className={`text-2xl font-black text-center mb-2 bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>{plan}</h3>
      <div className="text-center mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          planKey === 'basic' ? 'bg-blue-100 text-blue-700' :
          planKey === 'pro' ? 'bg-emerald-100 text-emerald-700' :
          'bg-purple-100 text-purple-700'
        }`}>
          {planKey === 'basic' ? 'BASIC' : planKey === 'pro' ? 'GROWTH' : 'BUSINESS'}
        </span>
      </div>
      <p className="text-center text-slate-600 text-sm mb-6 font-medium">
        {planKey === 'basic' ? 'مثالية للشركات الناشئة' : 
         planKey === 'pro' ? 'مثالية للشركات المتوسطة' : 
         'مثالية للشركات الكبيرة'}
      </p>
      
      <div 
        className="text-center my-6 h-16 flex items-center justify-center relative group" 
        onClick={() => !isEditing && setIsEditing(true)}
      >
        {isEditing ? (
          <div className="flex items-baseline justify-center">
            <input
              ref={inputRef}
              type="text"
              value={editingPrice.replace(/[^0-9.]/g, '')}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                setEditingPrice(numericValue);
              }}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className={`text-5xl font-black bg-gradient-to-r ${colors.priceGradient} bg-clip-text text-transparent bg-white border-2 ${colors.border} rounded-md w-40 text-center p-0`}
            />
             <span className="text-slate-400 mr-2 text-sm font-medium">{isYearly ? '/سنوياً' : '/شهرياً'}</span>
          </div>
        ) : (
          <div className="cursor-pointer">
            <span className={`text-5xl font-black bg-gradient-to-r ${colors.priceGradient} bg-clip-text text-transparent`}>{currentPrice}</span>
            <span className="text-slate-500 text-sm font-medium mr-2">{isYearly ? '/سنوياً' : '/شهرياً'}</span>
            {isYearly && (() => {
              const monthly = parseFloat(monthlyPrice.replace(/[^0-9.]/g, '')) || 0;
              const yearly = parseFloat(yearlyPrice.replace(/[^0-9.]/g, '')) || 0;
              const savings = monthly > 0 && yearly > 0 ? ((monthly * 12 - yearly) / (monthly * 12) * 100).toFixed(0) : '0';
              return savings !== '0' ? (
                <div className="text-xs text-emerald-600 font-bold mt-1">
                  توفير {savings}%
                </div>
              ) : null;
            })()}
            <div className="absolute -top-4 right-0 left-0 mx-auto w-max opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded">اضغط للتعديل</p>
            </div>
          </div>
        )}
      </div>

      <div className={`w-full h-px mb-8 ${planKey === 'basic' ? 'bg-gradient-to-r from-transparent via-blue-200 to-transparent' : planKey === 'pro' ? 'bg-gradient-to-r from-transparent via-emerald-200 to-transparent' : 'bg-gradient-to-r from-transparent via-purple-200 to-transparent'}`}></div>

      {/* Detailed Plan Features */}
      <div className="mb-8 flex-grow space-y-3">
        {/* Plan Limits Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">المستخدمين</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '1' : planKey === 'pro' ? '5' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">الفروع</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '1' : planKey === 'pro' ? '3' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">المخازن</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '1' : planKey === 'pro' ? '3' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">الخزائن</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '1' : planKey === 'pro' ? '3' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">البنوك</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '2' : planKey === 'pro' ? '5' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">الأصناف</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '500' : planKey === 'pro' ? '5,000' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">العملاء</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '50' : planKey === 'pro' ? '500' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/60 rounded-lg">
            <span className="text-slate-600">الموردين</span>
            <span className="font-bold text-slate-800">
              {planKey === 'basic' ? '50' : planKey === 'pro' ? '500' : '∞'}
            </span>
          </div>
        </div>

        {/* Monthly Limits */}
        <div className="space-y-2 pt-2 border-t border-white/40">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">الفواتير/شهر</span>
            <span className={`font-bold ${planKey === 'enterprise' ? 'text-green-600' : 'text-slate-800'}`}>
              {planKey === 'basic' || planKey === 'pro' ? '∞' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">عروض الأسعار/شهر</span>
            <span className={`font-bold ${planKey === 'enterprise' ? 'text-green-600' : 'text-slate-800'}`}>
              {planKey === 'basic' ? '50' : planKey === 'pro' ? '200' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">السندات المالية/شهر</span>
            <span className={`font-bold ${planKey === 'enterprise' ? 'text-green-600' : 'text-slate-800'}`}>
              {planKey === 'basic' ? '100' : planKey === 'pro' ? '500' : '∞'}
            </span>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="space-y-2 pt-2 border-t border-white/40">
          {features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center text-slate-700 group/item">
              <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1 ml-3 flex-shrink-0 group-hover/item:scale-110 transition-transform`}>
                <CheckCircleIcon className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold">{feature}</span>
            </div>
          ))}
        </div>

        {/* Special Features */}
        <div className="pt-2 border-t border-white/40 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">الحسابات الجارية</span>
            <span className={`font-bold ${planKey === 'enterprise' ? 'text-green-600' : 'text-slate-800'}`}>
              {planKey === 'basic' ? '5' : planKey === 'pro' ? '20' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">المدينين والدائنين</span>
            <span className={`font-bold ${
              planKey === 'basic' ? 'text-red-600' : planKey === 'enterprise' ? 'text-green-600' : 'text-slate-800'
            }`}>
              {planKey === 'basic' ? '✗ غير متاح' : planKey === 'pro' ? '10 لكل' : '∞'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600">التحليل المالي</span>
            <span className={`font-bold ${
              planKey === 'basic' || planKey === 'pro' ? 'text-red-600' : 'text-green-600'
            }`}>
              {planKey === 'enterprise' ? '✓ متاح' : '✗ غير متاح'}
            </span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => onSubscribe(planKey)}
        className={`w-full py-4 rounded-xl font-bold transition text-lg transform hover:scale-105 bg-gradient-to-r ${colors.gradient} text-white hover:shadow-xl shadow-lg`}
      >
        اشترك الآن
      </button>
    </div>
  );
};

interface PricingPageProps {
  prices: {
    basic: string;
    pro: string;
    enterprise: string;
  };
  onPriceChange: (key: 'basic' | 'pro' | 'enterprise', value: string) => void;
}

// Yearly prices
const yearlyPrices = {
  basic: '294 ر.س',
  pro: '594 ر.س',
  enterprise: '1194 ر.س',
};

const PricingPage: React.FC<PricingPageProps> = ({ prices, onPriceChange }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const handleSubscribe = (plan: 'basic' | 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: { plan: PlanType; name: string; email: string; phone: string }) => {
    // The form component will handle success state and close
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form after a delay to allow animation
    setTimeout(() => {
      setSelectedPlan(null);
    }, 300);
  };

  return (
    <>
    <section id="pricing" className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 relative overflow-hidden">
      {/* Enhanced Decorational Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-emerald-600 font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-100 to-blue-100 px-5 py-2 rounded-full border-2 border-emerald-200/50 shadow-md mb-4">
            خطط مرنة
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">
              استثمر في نمو أعمالك
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium">
            اختر الخطة المناسبة لحجم شركتك. يمكنك الترقية أو الإلغاء في أي وقت. جميع الخطط تشمل دعم فني وضمان الجودة.
          </p>
          
          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-slate-800' : 'text-slate-400'}`}>
              شهرياً
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isYearly ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-bold transition-colors ${isYearly ? 'text-slate-800' : 'text-slate-400'}`}>
              سنوياً
            </span>
            {isYearly && (
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                توفير حتى 17%
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          <PricingCard 
            plan="البداية"
            planKey="basic"
            monthlyPrice={prices.basic}
            yearlyPrice={yearlyPrices.basic}
            isYearly={isYearly}
            onPriceChange={(value) => onPriceChange('basic', value)}
            onSubscribe={handleSubscribe}
            features={[
              "فواتير المبيعات والمشتريات",
              "إدارة المخزون الأساسية",
              "إدارة العملاء والموردين",
              "تقارير أساسية",
              "نقطة بيع (POS)",
              "دعم فني عبر البريد الإلكتروني"
            ]}
          />
          <PricingCard 
            plan="النمو"
            planKey="pro"
            monthlyPrice={prices.pro}
            yearlyPrice={yearlyPrices.pro}
            isYearly={isYearly}
            onPriceChange={(value) => onPriceChange('pro', value)}
            onSubscribe={handleSubscribe}
            features={[
              "كل مميزات البداية",
              "إدارة متقدمة للمخزون",
              "تقارير تحليلية متقدمة",
              "ربط مع المتجر الإلكتروني",
              "نسخ احتياطية تلقائية",
              "دعم فني ذو أولوية"
            ]}
            popular={true}
          />
          <PricingCard 
            plan="الاحترافية"
            planKey="enterprise"
            monthlyPrice={prices.enterprise}
            yearlyPrice={yearlyPrices.enterprise}
            isYearly={isYearly}
            onPriceChange={(value) => onPriceChange('enterprise', value)}
            onSubscribe={handleSubscribe}
            features={[
              "كل مميزات باقة النمو",
              "التحليل المالي المتقدم",
              "ربط الفروع المتعددة",
              "API مفتوح للربط",
              "مدير حساب مخصص",
              "دعم فني 24/7"
            ]}
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 rounded-full border border-emerald-200/50">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-1">
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span>ضمان استرداد الأموال خلال 30 يوم</span>
          </div>
          <span className="mx-4 text-slate-400">•</span>
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200/50">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-1">
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span>لا توجد رسوم إخفاء</span>
          </div>
          <span className="mx-4 text-slate-400">•</span>
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-2 rounded-full border border-purple-200/50">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-1">
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span>إلغاء في أي وقت</span>
          </div>
        </div>
      </div>
    </section>

    {/* Subscription Form Modal */}
    <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
      {selectedPlan && (
        <SubscriptionForm
          selectedPlan={selectedPlan}
          onClose={handleCloseModal}
          onSubmit={handleFormSubmit}
        />
      )}
    </Modal>
    </>
  );
};

export default PricingPage;
