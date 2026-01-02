import React, { useState } from 'react';
import { CheckCircleIcon } from './icons/IconCollection';
import { useCreateSubscriptionRequestMutation } from '../../store/slices/subscriptionRequestApiSlice';

export type PlanType = 'basic' | 'pro' | 'enterprise';

interface SubscriptionFormProps {
  selectedPlan: PlanType;
  onClose: () => void;
  onSubmit: (data: { plan: PlanType; name: string; email: string; phone: string }) => void;
}

const planNames: Record<PlanType, string> = {
  basic: 'البداية',
  pro: 'النمو',
  enterprise: 'الاحترافية',
};

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ selectedPlan, onClose, onSubmit }) => {
  const [plan, setPlan] = useState<PlanType>(selectedPlan);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [createSubscriptionRequest, { isLoading: isSubmitting }] = useCreateSubscriptionRequestMutation();

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9+\-\s()]+$/.test(phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createSubscriptionRequest({
        plan,
        name,
        email,
        phone,
        companyName: undefined, // Optional field
      }).unwrap();
      
      onSubmit({ plan, name, email, phone });
      setIsSuccess(true);

      // Close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      // Handle error - show error message
      const errorMessage = error?.data?.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
      setErrors({ 
        ...errors, 
        email: errorMessage 
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-brand-green/90 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircleIcon className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">تم إرسال طلبك بنجاح!</h3>
        <p className="text-slate-700 mb-6 font-medium">سيتم التواصل معك قريباً من قبل فريقنا</p>
        <div className="bg-gradient-to-br from-brand-blue-bg to-brand-green-bg border-2 border-brand-blue/30 rounded-xl p-5 text-sm text-slate-700 shadow-lg">
          <p className="font-black mb-3 text-base">تفاصيل طلبك:</p>
          <div className="space-y-2 text-right">
            <p>الخطة: <span className="font-bold text-brand-green">{planNames[plan]}</span></p>
            <p>الاسم: <span className="font-bold text-brand-blue">{name}</span></p>
            <p>البريد: <span className="font-bold text-brand-blue">{email}</span></p>
            <p>الهاتف: <span className="font-bold text-brand-blue">{phone}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const planColors: Record<PlanType, { gradient: string; bgGradient: string; border: string }> = {
    basic: { gradient: 'from-brand-blue to-brand-blue/90', bgGradient: 'from-brand-blue-bg to-brand-blue-bg/80', border: 'border-brand-blue/30' },
    pro: { gradient: 'from-brand-green to-brand-green/90', bgGradient: 'from-brand-green-bg to-brand-green-bg/80', border: 'border-brand-green/30' },
    enterprise: { gradient: 'from-brand-blue to-brand-blue/90', bgGradient: 'from-brand-blue-bg to-brand-blue-bg/80', border: 'border-brand-blue/30' },
  };

  return (
    <div className="text-right">
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">ابدأ رحلتك مع Stock.Pro</h2>
        <p className="text-slate-700 font-medium">املأ البيانات التالية وسنتواصل معك قريباً</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">اختر الخطة</label>
          <div className="grid grid-cols-3 gap-3">
            {(['basic', 'pro', 'enterprise'] as PlanType[]).map((p) => {
              const colors = planColors[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    plan === p
                      ? `${colors.border} bg-gradient-to-br ${colors.bgGradient} shadow-lg scale-105`
                      : 'border-slate-200 bg-white hover:border-brand-blue/30 hover:shadow-md'
                  }`}
                >
                  <div className={`text-sm font-black mb-1 ${plan === p ? `bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent` : 'text-slate-600'}`}>
                    {planNames[p]}
                  </div>
                  {p === 'pro' && (
                    <span className={`text-xs font-bold ${plan === p ? 'text-white bg-gradient-to-r from-brand-green to-brand-green/90 px-2 py-0.5 rounded-full' : 'text-brand-green'}`}>الأكثر طلباً</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              errors.name
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-bg'
            } outline-none`}
            placeholder="أدخل اسمك الكامل"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              errors.email
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-bg'
            } outline-none`}
            placeholder="example@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">
            رقم الهاتف <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              errors.phone
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-bg'
            } outline-none`}
            placeholder="05xxxxxxxx"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-brand-blue to-brand-green text-white hover:from-brand-blue/90 hover:to-brand-green/90 transition-all shadow-lg shadow-brand-blue/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriptionForm;

