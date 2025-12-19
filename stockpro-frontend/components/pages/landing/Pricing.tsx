
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon } from './icons/IconCollection';

interface PricingCardProps {
  plan: string;
  price: string;
  features: string[];
  popular?: boolean;
  onPriceChange: (newPrice: string) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, features, popular = false, onPriceChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(price);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentPrice(price);
  }, [price]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numericValue = currentPrice.replace(/[^0-9.]/g, '');
    if (numericValue.trim()) {
      onPriceChange(numericValue.trim() + ' ر.س');
    } else {
      setCurrentPrice(price);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentPrice(price);
      setIsEditing(false);
    }
  };

  return (
    <div className={`rounded-3xl p-8 flex flex-col bg-white transition-all duration-300 ${popular ? 'border-2 border-stock-primary shadow-2xl scale-105 z-10 relative' : 'border border-slate-100 shadow-lg hover:shadow-xl'}`}>
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stock-primary text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
            الأكثر طلباً
        </div>
      )}
      <h3 className="text-2xl font-bold text-center text-stock-dark mb-2">{plan}</h3>
      <p className="text-center text-slate-400 text-sm mb-6">مثالية للشركات الناشئة والمتوسطة</p>
      
      <div 
        className="text-center my-6 h-16 flex items-center justify-center relative group" 
        onClick={() => !isEditing && setIsEditing(true)}
      >
        {isEditing ? (
          <div className="flex items-baseline justify-center">
            <input
              ref={inputRef}
              type="text"
              value={currentPrice.replace(/[^0-9.]/g, '')}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                setCurrentPrice(numericValue);
              }}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-5xl font-black text-stock-secondary bg-green-50 border border-stock-secondary rounded-md w-40 text-center p-0"
            />
             <span className="text-slate-400 mr-2 text-sm font-medium">/شهرياً</span>
          </div>
        ) : (
          <div className="cursor-pointer">
            <span className="text-5xl font-black text-stock-secondary">{price}</span>
            <span className="text-slate-400 text-sm font-medium mr-2">/شهرياً</span>
            <div className="absolute -top-4 right-0 left-0 mx-auto w-max opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded">اضغط للتعديل</p>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-slate-100 mb-8"></div>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature: string, index: number) => (
          <li key={index} className="flex items-center text-slate-600">
            <CheckCircleIcon className={`w-5 h-5 ml-3 flex-shrink-0 ${popular ? 'text-stock-secondary' : 'text-slate-400'}`} />
            <span className="text-sm font-medium">{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-xl font-bold transition text-lg ${popular ? 'bg-stock-primary text-white hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-blue-50 text-stock-primary hover:bg-blue-100'}`}>
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


const PricingPage: React.FC<PricingPageProps> = ({ prices, onPriceChange }) => {
  return (
    <section id="pricing" className="py-24 bg-stock-light relative overflow-hidden">
      {/* Decorational Blobs - Blue and Green */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-stock-dark">استثمر في نمو أعمالك</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">اختر الخطة المناسبة لحجم شركتك. يمكنك الترقية أو الإلغاء في أي وقت.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          <PricingCard 
            plan="البداية"
            price={prices.basic}
            onPriceChange={(value) => onPriceChange('basic', value)}
            features={[
              "مستخدم واحد",
              "100 فاتورة شهرياً",
              "إدارة المخزون الأساسية",
              "دعم فني عبر البريد الإلكتروني"
            ]}
          />
          <PricingCard 
            plan="النمو"
            price={prices.pro}
            onPriceChange={(value) => onPriceChange('pro', value)}
            features={[
              "5 مستخدمين",
              "فواتير غير محدودة",
              "إدارة متقدمة للمخزون",
              "تقارير تحليلية متقدمة",
              "دعم فني ذو أولوية",
              "ربط مع المتجر الإلكتروني"
            ]}
            popular={true}
          />
          <PricingCard 
            plan="المؤسسات"
            price={prices.enterprise}
            onPriceChange={(value) => onPriceChange('enterprise', value)}
            features={[
              "مستخدمين بلا حدود",
              "كل مميزات باقة النمو",
              "ربط الفروع المتعددة",
              "API مفتوح للربط",
              "مدير حساب مخصص"
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default PricingPage;
