import React, { useState } from 'react';
import { useCreateTrialRequestMutation } from '../../store/slices/subscriptionRequestApiSlice';
import { CheckCircleIcon } from './icons/IconCollection';

const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [createTrialRequest, { isLoading: isSubmitting }] = useCreateTrialRequestMutation();

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
      await createTrialRequest({
        name,
        email,
        phone,
        companyName: companyName.trim() || undefined,
      }).unwrap();
      
      setIsSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setErrors({});
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
      setErrors({ 
        ...errors, 
        email: errorMessage 
      });
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-20 bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-white to-brand-blue-bg/30 p-8 md:p-12 rounded-3xl shadow-2xl border-2 border-white/80 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-brand-green/90 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">تم إرسال طلبك بنجاح!</h3>
            <p className="text-slate-700 mb-6 font-medium">سيتم التواصل معك قريباً من قبل فريقنا لتفعيل النسخة التجريبية المجانية لمدة 14 يوم</p>
            <button
              onClick={() => setIsSuccess(false)}
              className="bg-gradient-to-r from-brand-blue to-brand-green text-white font-bold py-3 px-8 rounded-xl hover:from-brand-blue/90 hover:to-brand-green/90 transition text-base transform hover:scale-105 shadow-lg shadow-brand-blue/50"
            >
              إرسال طلب آخر
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-brand-green font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-5 py-2 rounded-full border-2 border-brand-green/30 shadow-md mb-4">
            نسخة تجريبية مجانية
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">
              جرب Stock.Pro مجاناً لمدة 14 يوم
            </span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 font-medium">املأ البيانات التالية وسنقوم بتفعيل النسخة التجريبية المجانية لك فوراً.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-white to-brand-blue-bg/30 p-8 md:p-12 rounded-3xl shadow-2xl border-2 border-white/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl transition bg-white ${
                  errors.name
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue'
                }`}
                placeholder="اسمك الكامل"
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl transition bg-white ${
                  errors.email
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-brand-green focus:border-brand-green'
                }`}
                placeholder="you@example.com"
                required
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                className={`w-full px-4 py-3 border-2 rounded-xl transition bg-white ${
                  errors.phone
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue'
                }`}
                placeholder="05xxxxxxxx"
                required
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-bold text-slate-700 mb-2">اسم الشركة (اختياري)</label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition bg-white"
                placeholder="اسم شركتك"
              />
            </div>
            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-brand-blue to-brand-green text-white font-bold py-4 px-16 rounded-xl hover:from-brand-blue/90 hover:to-brand-green/90 transition text-lg transform hover:scale-105 shadow-lg shadow-brand-blue/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'طلب نسخة تجريبية مجانية'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;