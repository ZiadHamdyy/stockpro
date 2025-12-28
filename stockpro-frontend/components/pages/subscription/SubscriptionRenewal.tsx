import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useRenewSubscriptionMutation, useLazyGetSubscriptionByCodeQuery } from '../../store/slices/subscriptionApiSlice';

interface SubscriptionRenewalProps {
  title: string;
}

const SubscriptionRenewal: React.FC<SubscriptionRenewalProps> = ({ title }) => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [renewSubscription, { isLoading: isRenewing }] = useRenewSubscriptionMutation();
  const [getSubscriptionByCode, { data: currentSubscription, isLoading: isLoadingSubscription, error: subscriptionError }] = useLazyGetSubscriptionByCodeQuery();

  const [codeInput, setCodeInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'GROWTH' | 'BUSINESS'>('BASIC');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [renewedSubscription, setRenewedSubscription] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>('');

  // Check for code in URL params on mount
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCodeInput(codeFromUrl);
      // Fetch subscription if code is in URL
      if (/^\d{6,8}$/.test(codeFromUrl)) {
        getSubscriptionByCode(codeFromUrl);
      }
    }
  }, [searchParams, getSubscriptionByCode]);

  // Fetch subscription when code is entered and valid
  const handleCodeChange = (value: string) => {
    setCodeInput(value);
    setCompanyName('');
    setSelectedPlan('BASIC');
    setStartDate('');
    setEndDate('');
    setRenewedSubscription(null);

    // If code is valid format, fetch subscription
    if (/^\d{6,8}$/.test(value.trim())) {
      getSubscriptionByCode(value.trim());
    }
  };

  // Update form when subscription data is loaded
  useEffect(() => {
    if (currentSubscription) {
      setSelectedPlan(currentSubscription.planType as 'BASIC' | 'GROWTH' | 'BUSINESS');
      setStartDate(new Date(currentSubscription.startDate).toISOString().split('T')[0]);
      if (currentSubscription.endDate) {
        setEndDate(new Date(currentSubscription.endDate).toISOString().split('T')[0]);
      }
      // Check if company info is included in response
      if ((currentSubscription as any).company) {
        setCompanyName((currentSubscription as any).company.name);
      }
    }
  }, [currentSubscription]);

  // Show error if subscription not found
  useEffect(() => {
    if (subscriptionError && codeInput.trim() && /^\d{6,8}$/.test(codeInput.trim())) {
      // Don't show error if it's just "not found" - that's expected for new companies
      if (subscriptionError && 'status' in subscriptionError && subscriptionError.status === 404) {
        // Subscription doesn't exist - that's okay, user can create one
        setCompanyName('');
      }
    }
  }, [subscriptionError, codeInput]);

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
      // Refetch subscription to get updated data
      getSubscriptionByCode(code);
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
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-4 min-h-[80px] relative">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldIcon className="w-9 h-9 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
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
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => handleCodeChange(e.target.value)}
                onBlur={() => {
                  if (codeInput.trim() && /^\d{6,8}$/.test(codeInput.trim())) {
                    getSubscriptionByCode(codeInput.trim());
                  }
                }}
                placeholder="123456"
                pattern="\d{6,8}"
                maxLength={8}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                required
                disabled={isRenewing || isLoadingSubscription}
              />
              {isLoadingSubscription && (
                <div className="flex items-center px-4 text-gray-500">
                  <span className="text-sm">جاري التحميل...</span>
                </div>
              )}
            </div>
            {companyName && (
              <p className="text-sm text-green-600 mt-2 font-semibold">
                ✓ {companyName}
              </p>
            )}
            {subscriptionError && 'status' in subscriptionError && subscriptionError.status === 404 && codeInput.trim() && /^\d{6,8}$/.test(codeInput.trim()) && (
              <p className="text-sm text-orange-600 mt-2">
                لا يوجد اشتراك لهذه الشركة - يمكنك إنشاء اشتراك جديد
              </p>
            )}
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-blue-800">الاشتراك الحالي:</h4>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  يمكنك تحديث البيانات أدناه
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">الخطة:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {planNames[currentSubscription.planType] || currentSubscription.planType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {currentSubscription.status === 'ACTIVE' ? 'نشط' : currentSubscription.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ البداية:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {new Date(currentSubscription.startDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ النهاية:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {currentSubscription.endDate 
                      ? new Date(currentSubscription.endDate).toLocaleDateString('ar-SA')
                      : 'غير محدد'}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              type="button"
              onClick={() => {
                setCodeInput('');
                setCompanyName('');
                setSelectedPlan('BASIC');
                setStartDate('');
                setEndDate('');
                setRenewedSubscription(null);
                setSearchParams({});
              }}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
              disabled={isRenewing}
            >
              إعادة تعيين
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-sm rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedPlan === 'BASIC' ? 'bg-orange-600 hover:bg-orange-700' :
                selectedPlan === 'GROWTH' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-purple-600 hover:bg-purple-700'
              } text-white`}
              disabled={isRenewing || isLoadingSubscription}
            >
              {isRenewing ? 'جاري التجديد...' : currentSubscription ? 'تحديث الاشتراك' : 'إنشاء اشتراك جديد'}
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

