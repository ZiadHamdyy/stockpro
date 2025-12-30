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
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
          <CheckCircleIcon className="w-12 h-12 text-white" />
        </div>
        <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">تم إرسال طلبك بنجاح!</h3>
        <p className="text-slate-700 mb-6 font-medium">سيتم التواصل معك قريباً من قبل فريقنا</p>
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200/50 rounded-xl p-5 text-sm text-slate-700 shadow-lg">
          <p className="font-black mb-3 text-base">تفاصيل طلبك:</p>
          <div className="space-y-2 text-right">
            <p>الخطة: <span className="font-bold text-emerald-600">{planNames[plan]}</span></p>
            <p>الاسم: <span className="font-bold text-blue-600">{name}</span></p>
            <p>البريد: <span className="font-bold text-purple-600">{email}</span></p>
            <p>الهاتف: <span className="font-bold text-indigo-600">{phone}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const planColors: Record<PlanType, { gradient: string; border: string }> = {
    basic: { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-300' },
    pro: { gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-300' },
    enterprise: { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-300' },
  };

  return (
    <div className="text-right">
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">ابدأ رحلتك مع Stock.Pro</h2>
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
                      ? `${colors.border} bg-gradient-to-br ${colors.gradient.replace('500', '50').replace('600', '100')} shadow-lg scale-105`
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className={`text-sm font-black mb-1 ${plan === p ? `bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent` : 'text-slate-600'}`}>
                    {planNames[p]}
                  </div>
                  {p === 'pro' && (
                    <span className={`text-xs font-bold ${plan === p ? 'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-0.5 rounded-full' : 'text-emerald-600'}`}>الأكثر طلباً</span>
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
                : 'border-slate-200 focus:border-stock-primary focus:ring-2 focus:ring-blue-100'
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
                : 'border-slate-200 focus:border-stock-primary focus:ring-2 focus:ring-blue-100'
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
                : 'border-slate-200 focus:border-stock-primary focus:ring-2 focus:ring-blue-100'
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
            className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl"
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriptionForm;

