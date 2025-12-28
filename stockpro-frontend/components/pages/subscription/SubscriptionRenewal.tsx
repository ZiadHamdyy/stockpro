import React, { useState } from 'react';
import { ShieldIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useRenewSubscriptionMutation } from '../../store/slices/subscriptionApiSlice';

interface SubscriptionRenewalProps {
  title: string;
}

const SubscriptionRenewal: React.FC<SubscriptionRenewalProps> = ({ title }) => {
  const { showToast } = useToast();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();

  const [codeInput, setCodeInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'GROWTH' | 'BUSINESS'>('BASIC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [renewedSubscription, setRenewedSubscription] = useState<any>(null);

  const handleRenewSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate code (6-8 digits)
    const code = codeInput.trim();

    if (!code) {
      showToast('يرجى إدخال كود الشركة (6-8 أرقام)', 'error');
      return;
    }

    // Validate code format (6-8 digits)
    if (!/^\d{6,8}$/.test(code)) {
      showToast('كود الشركة يجب أن يكون من 6 إلى 8 أرقام', 'error');
      return;
    }

    // Validate dates
    if (!startDate) {
      showToast('يرجى إدخال تاريخ البداية', 'error');
      return;
    }

    if (!endDate) {
      showToast('يرجى إدخال تاريخ النهاية', 'error');
      return;
    }

    // Validate end date is after start date
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      showToast('تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 'error');
      return;
    }

    try {
      const result = await renewSubscription({
        code,
        planType: selectedPlan,
        startDate: startDate,
        endDate: endDate,
      }).unwrap();

      showToast('تم تجديد الاشتراك بنجاح');
      setRenewedSubscription(result);
      // Reset form
      setCodeInput('');
      setSelectedPlan('BASIC');
      setStartDate('');
      setEndDate('');
    } catch (error: any) {
      showToast(
        error?.data?.message || 'حدث خطأ أثناء تجديد الاشتراك',
        'error'
      );
    }
  };

  // Plan colors matching Subscription component
  const planColors: Record<string, { badge: string; bg: string; border: string; hoverBg: string }> = {
    BASIC: {
      badge: 'bg-orange-100 text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      hoverBg: 'hover:bg-orange-50',
    },
    GROWTH: {
      badge: 'bg-blue-100 text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      hoverBg: 'hover:bg-blue-50',
    },
    BUSINESS: {
      badge: 'bg-purple-100 text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      hoverBg: 'hover:bg-purple-50',
    },
  };

  const planNames: Record<string, string> = {
    BASIC: 'الأساسية',
    GROWTH: 'المتوسطة',
    BUSINESS: 'الاحترافية',
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in font-sans text-slate-800">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6 min-h-[200px] relative">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="relative z-10 p-8">
          <div className="flex items-center gap-4 mb-4">
            <ShieldIcon className="w-12 h-12 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-orange-100 text-sm">تجديد اشتراك الشركة باستخدام كود الشركة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Form Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShieldIcon className="w-5 h-5 text-orange-500" />
          تجديد الاشتراك
        </h3>

        <form onSubmit={handleRenewSubscription} className="space-y-4">
          {/* Company Code Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              كود الشركة (6-8 أرقام) *
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="123456"
              pattern="\d{6,8}"
              maxLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              required
              disabled={isRenewing}
            />
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                تاريخ البداية *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                disabled={isRenewing}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                تاريخ النهاية *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                disabled={isRenewing}
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              اختر خطة الاشتراك *
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* BASIC Plan */}
              <div
                onClick={() => !isRenewing && setSelectedPlan('BASIC')}
                className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                  selectedPlan === 'BASIC'
                    ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-bold text-gray-800 mb-1">الأساسية</h4>
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                    BASIC
                  </div>
                </div>
                {selectedPlan === 'BASIC' && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                      ✓ محدد
                    </span>
                  </div>
                )}
              </div>

              {/* GROWTH Plan */}
              <div
                onClick={() => !isRenewing && setSelectedPlan('GROWTH')}
                className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                  selectedPlan === 'GROWTH'
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-bold text-gray-800 mb-1">المتوسطة</h4>
                  <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    GROWTH
                  </div>
                </div>
                {selectedPlan === 'GROWTH' && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-bold">
                      ✓ محدد
                    </span>
                  </div>
                )}
              </div>

              {/* BUSINESS Plan */}
              <div
                onClick={() => !isRenewing && setSelectedPlan('BUSINESS')}
                className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                  selectedPlan === 'BUSINESS'
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-bold text-gray-800 mb-1">الاحترافية</h4>
                  <div className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    BUSINESS
                  </div>
                </div>
                {selectedPlan === 'BUSINESS' && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-1 bg-purple-500 text-white rounded-full text-xs font-bold">
                      ✓ محدد
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className={`px-6 py-2 text-sm rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPlan === 'BASIC' ? 'bg-orange-600 hover:bg-orange-700' :
                selectedPlan === 'GROWTH' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-purple-600 hover:bg-purple-700'
              } text-white`}
              disabled={isRenewing}
            >
              {isRenewing ? 'جاري التجديد...' : 'تجديد الاشتراك'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Card - Show Renewed Subscription Info */}
      {renewedSubscription && (
        <div className="bg-green-50 border border-green-200 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-green-600" />
            تم تجديد الاشتراك بنجاح
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">الخطة:</span>
              <span className="font-bold text-gray-800">
                {planNames[renewedSubscription.planType] || renewedSubscription.planType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاريخ البداية:</span>
              <span className="font-bold text-gray-800">
                {new Date(renewedSubscription.startDate).toLocaleDateString('ar-SA')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تاريخ النهاية:</span>
              <span className="font-bold text-gray-800">
                {renewedSubscription.endDate 
                  ? new Date(renewedSubscription.endDate).toLocaleDateString('ar-SA')
                  : 'غير محدد'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الحالة:</span>
              <span className="font-bold text-gray-800">
                {renewedSubscription.status === 'ACTIVE' ? 'نشط' : renewedSubscription.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionRenewal;

