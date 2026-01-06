
import React, { useState } from 'react';
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
  onSubscribe: (plan: 'basic' | 'pro' | 'enterprise') => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, planKey, monthlyPrice, yearlyPrice, features, popular = false, onSubscribe }) => {

  const planColors: Record<string, { gradient: string; bgGradient: string; border: string; priceGradient: string; badgeGradient: string }> = {
    basic: {
      gradient: 'from-brand-blue to-brand-blue/90',
      bgGradient: 'from-brand-blue-bg to-brand-blue-bg/80',
      border: 'border-brand-blue/30',
      priceGradient: 'from-brand-blue to-brand-blue/80',
      badgeGradient: 'from-brand-blue to-brand-blue/90',
    },
    pro: {
      gradient: 'from-brand-green to-brand-green/90',
      bgGradient: 'from-brand-green-bg to-brand-green-bg/80',
      border: 'border-brand-green/30',
      priceGradient: 'from-brand-green to-brand-green/80',
      badgeGradient: 'from-brand-green to-brand-green/90',
    },
    enterprise: {
      gradient: 'from-brand-blue to-brand-blue/90',
      bgGradient: 'from-brand-blue-bg to-brand-blue-bg/80',
      border: 'border-brand-blue/30',
      priceGradient: 'from-brand-blue to-brand-blue/80',
      badgeGradient: 'from-brand-blue to-brand-blue/90',
    },
  };
  const colors = planColors[planKey];
  
  return (
    <div className={`rounded-3xl p-8 flex flex-col bg-gradient-to-br ${colors.bgGradient} transition-all duration-300 ${popular ? `border-2 ${colors.border} shadow-2xl scale-105 z-10 relative` : `border-2 border-white/80 shadow-lg hover:shadow-xl`} hover:-translate-y-2`}>
      {popular && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r ${colors.badgeGradient} text-white text-sm font-bold px-6 py-2 rounded-full shadow-xl flex items-center gap-2`}>
          <span>⭐</span>
          <span>الأكثر اختياراً</span>
        </div>
      )}
      {/* Discount Banner */}
      <div className={`text-center mb-3 ${planKey === 'basic' ? 'bg-blue-500' : planKey === 'pro' ? 'bg-orange-500' : 'bg-blue-800'} text-white py-2 px-4 rounded-lg text-xs font-bold`}>
        {planKey === 'basic' || planKey === 'pro' || planKey === 'enterprise' ? 'عرض ال 50% خصم' : 'عرض ال 550 خصم'}
      </div>
      
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
      
      <div className="text-center my-6 flex flex-col items-center justify-center">
        <div className="flex items-baseline justify-center mb-2">
          <span className={`text-5xl font-black bg-gradient-to-r ${colors.priceGradient} bg-clip-text text-transparent`}>{monthlyPrice}</span>
          <span className="text-slate-500 text-sm font-medium mr-2">/شهرياً</span>
        </div>
        <div className="flex items-baseline justify-center">
          <span className={`text-2xl font-bold bg-gradient-to-r ${colors.priceGradient} bg-clip-text text-transparent`}>سنوياً {yearlyPrice}</span>
        </div>
      </div>

      <div className={`w-full h-px mb-8 ${planKey === 'basic' ? 'bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent' : planKey === 'pro' ? 'bg-gradient-to-r from-transparent via-brand-green/30 to-transparent' : 'bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent'}`}></div>

      {/* Detailed Plan Features */}
      <div className="mb-8 flex-grow space-y-3">
        {/* Features List with Icons */}
        <div className="space-y-2.5">
          {/* Users */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              عدد المستخدمين: {planKey === 'basic' ? '1' : planKey === 'pro' ? '1-5' : '1-15'}
            </span>
          </div>

          {/* Invoices */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              الفواتير: غير محدود {planKey === 'basic' ? '(مرحلة 1)' : '(مرحلة 2)'}
            </span>
          </div>

          {/* Branches */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              الفروع: {planKey === 'basic' ? '1' : planKey === 'pro' ? '1-5' : '1-15'}
            </span>
          </div>

          {/* Inventory */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              المخزون: {planKey === 'basic' ? 'إضافة - صرف' : planKey === 'pro' ? 'إدارة كاملة مع تحويلات' : 'إدارة مخزون احترافية + جرد ذكي'}
            </span>
          </div>

          {/* Customers/Suppliers */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              العملاء: {planKey === 'basic' ? '50 عميل / مورد' : planKey === 'pro' ? '500 عميل / مورد' : 'غير محدود'}
            </span>
          </div>

          {/* Accounts */}
          {(planKey === 'basic' || planKey === 'pro' || planKey === 'enterprise') && (
            <div className="flex items-center text-slate-700">
              <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">
                الحسابات: {planKey === 'basic' ? 'أساسية' : planKey === 'pro' ? 'متقدمة' : 'احترافية'}
              </span>
            </div>
          )}

          {/* Reports */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              التقارير: {planKey === 'basic' ? 'مبيعات ومشتريات' : planKey === 'pro' ? 'متقدمة وتفصيلية' : 'تحليل مالي ومؤشرات أداء'}
            </span>
          </div>

          {/* Permissions */}
          {(planKey === 'pro' || planKey === 'enterprise') && (
            <div className="flex items-center text-slate-700">
              <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">
                الصلاحيات: {planKey === 'pro' ? 'صلاحيات متقدمة' : 'رقابة وصلاحيات'}
              </span>
            </div>
          )}

          {/* Support */}
          <div className="flex items-center text-slate-700">
            <div className={`bg-gradient-to-br ${colors.gradient} rounded-full p-1.5 ml-3 flex-shrink-0`}>
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              الدعم: {planKey === 'basic' ? 'بريد إلكتروني / تذكرة' : planKey === 'pro' ? 'محادثة مباشرة' : 'أولوية قصوى - مدير حساب'}
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
}

// Yearly prices
const yearlyPrices = {
  basic: '294 ر.س',
  pro: '594 ر.س',
  enterprise: '1194 ر.س',
};

const PricingPage: React.FC<PricingPageProps> = ({ prices }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <section id="pricing" className="py-24 bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg relative overflow-hidden">
      {/* Enhanced Decorational Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-brand-blue/40 to-brand-blue rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-brand-green/40 to-brand-green rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-brand-blue/40 to-brand-blue rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-brand-green font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-5 py-2 rounded-full border-2 border-brand-green/30 shadow-md mb-4">
            خطط مرنة
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">
              استثمر في نمو أعمالك
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium">
            اختر الخطة المناسبة لحجم شركتك. يمكنك الترقية أو الإلغاء في أي وقت. جميع الخطط تشمل دعم فني وضمان الجودة.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          <PricingCard 
            plan="باقة البداية"
            planKey="basic"
            monthlyPrice={prices.basic}
            yearlyPrice={yearlyPrices.basic}
            onSubscribe={handleSubscribe}
            features={[]}
          />
          <PricingCard 
            plan="باقة النمو"
            planKey="pro"
            monthlyPrice={prices.pro}
            yearlyPrice={yearlyPrices.pro}
            onSubscribe={handleSubscribe}
            features={[]}
            popular={true}
          />
          <PricingCard 
            plan="الباقة الاحترافية"
            planKey="enterprise"
            monthlyPrice={prices.enterprise}
            yearlyPrice={yearlyPrices.enterprise}
            onSubscribe={handleSubscribe}
            features={[]}
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-4 py-2 rounded-full border border-brand-green/30">
            <div className="bg-gradient-to-br from-brand-green to-brand-green/90 rounded-full p-1">
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span>ضمان استرداد الأموال خلال 30 يوم</span>
          </div>
          <span className="mx-4 text-slate-400">•</span>
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-brand-blue-bg to-brand-blue-bg px-4 py-2 rounded-full border border-brand-blue/30">
            <div className="bg-gradient-to-br from-brand-blue to-brand-blue/90 rounded-full p-1">
              <CheckCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span>لا توجد رسوم إخفاء</span>
          </div>
          <span className="mx-4 text-slate-400">•</span>
          <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-semibold bg-gradient-to-r from-brand-blue-bg to-brand-blue-bg px-4 py-2 rounded-full border border-brand-blue/30">
            <div className="bg-gradient-to-br from-brand-blue to-brand-blue/90 rounded-full p-1">
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
