import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon, BuildingIcon } from '../../icons';
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
      const subscriptionData = currentSubscription as any;
      if (subscriptionData.company) {
        setCompanyName(subscriptionData.company.name);
        // Debug: Log the full subscription data to see what we're getting
        console.log('Full subscription data:', JSON.stringify(subscriptionData, null, 2));
        console.log('Company data:', JSON.stringify(subscriptionData.company, null, 2));
        console.log('Admins:', JSON.stringify(subscriptionData.company?.admins, null, 2));
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

  const planNames: Record<string, string> = {
    BASIC: 'الأساسية',
    GROWTH: 'المتوسطة',
    BUSINESS: 'الاحترافية',
  };

  const company = (currentSubscription as any)?.company;
  const admins = company?.admins || [];

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in font-sans text-slate-800">
      {/* Orange Gradient Hero Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6 min-h-[280px] relative">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="relative z-10 p-8 flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <ShieldIcon className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            <p className="text-orange-100 text-sm">تجديد اشتراك الشركة باستخدام كود الشركة</p>
          </div>
        </div>
      </div>

      {/* Company & Admin Info Card */}
      {currentSubscription && company && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30">
                <BuildingIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">بيانات الشركة</h2>
                <p className="text-orange-100 text-sm">معلومات الشركة والمديرين</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BuildingIcon className="w-5 h-5 text-orange-500" />
                  معلومات الشركة
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <BuildingIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">اسم الشركة</p>
                      <p className="text-lg font-bold text-gray-800">{company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <span className="text-orange-600 font-mono font-bold">#</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1">كود الشركة</p>
                      <p className="text-lg font-bold text-gray-800 font-mono">{company.code}</p>
                    </div>
                  </div>
                  {company.phone && (
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <PhoneIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">الهاتف</p>
                        <p className="text-lg font-bold text-gray-800" dir="ltr">{company.phone}</p>
                      </div>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <BuildingIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">العنوان</p>
                        <p className="text-lg font-bold text-gray-800">{company.address}</p>
                      </div>
                    </div>
                  )}
                  {company.activity && (
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <span className="text-orange-600 font-bold">📋</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">النشاط</p>
                        <p className="text-lg font-bold text-gray-800">{company.activity}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admins Information */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-orange-500" />
                  المديرين ({admins.length})
                </h3>
                {admins.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {admins.map((admin: any, index: number) => (
                      <div key={admin.id || index}>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-orange-100 p-2 rounded-lg">
                                <UserIcon className="w-5 h-5 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">الاسم</p>
                                <p className="text-lg font-bold text-gray-800">{admin.name}</p>
                              </div>
                            </div>
                            {admin.email && (
                              <div className="flex items-start gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <MailIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">البريد الإلكتروني</p>
                                  <p className="text-lg font-bold text-gray-800" dir="ltr">{admin.email}</p>
                                </div>
                              </div>
                            )}
                            {admin.role && (
                              <div className="flex items-start gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <ShieldIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">الدور</p>
                                  <p className="text-lg font-bold text-gray-800">{admin.role.name}</p>
                                </div>
                              </div>
                            )}
                            {admin.createdAt && (
                              <div className="flex items-start gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <CalendarIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">تاريخ الإنشاء</p>
                                  <p className="text-lg font-bold text-gray-800">
                                    {new Date(admin.createdAt).toLocaleDateString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {index < admins.length - 1 && (
                          <div className="my-4 border-t border-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 font-bold">لا يوجد مديرين مسجلين لهذه الشركة</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Form Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30">
              <ShieldIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">تجديد الاشتراك</h2>
              <p className="text-orange-100 text-sm">أدخل كود الشركة وحدد خطة الاشتراك</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRenewSubscription} className="p-6 space-y-6">
          {/* Company Code Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              كود الشركة (6-8 أرقام) *
            </label>
            <div className="flex gap-3">
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
                className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-mono font-bold text-gray-800"
                required
                disabled={isRenewing || isLoadingSubscription}
              />
              {isLoadingSubscription && (
                <div className="flex items-center px-6 text-gray-500">
                  <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {companyName && (
              <p className="text-sm text-green-600 mt-3 font-bold flex items-center gap-2">
                <span className="text-lg">✓</span> {companyName}
              </p>
            )}
            {subscriptionError && 'status' in subscriptionError && subscriptionError.status === 404 && codeInput.trim() && /^\d{6,8}$/.test(codeInput.trim()) && (
              <p className="text-sm text-orange-600 mt-3 font-bold">
                لا يوجد اشتراك لهذه الشركة - يمكنك إنشاء اشتراك جديد
              </p>
            )}
          </div>

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-orange-800 uppercase">الاشتراك الحالي:</h4>
                <span className="text-xs text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full font-bold">
                  يمكنك تحديث البيانات أدناه
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-bold">الخطة:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {planNames[currentSubscription.planType] || currentSubscription.planType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-bold">الحالة:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {currentSubscription.status === 'ACTIVE' ? 'نشط' : currentSubscription.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-bold">تاريخ البداية:</span>
                  <span className="font-bold text-gray-800 mr-2">
                    {new Date(currentSubscription.startDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-bold">تاريخ النهاية:</span>
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                تاريخ البداية *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-bold text-gray-800"
                required
                disabled={isRenewing}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                تاريخ النهاية *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-bold text-gray-800"
                required
                disabled={isRenewing}
              />
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
              اختر خطة الاشتراك *
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BASIC Plan */}
              <div
                onClick={() => !isRenewing && setSelectedPlan('BASIC')}
                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
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
                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                  selectedPlan === 'GROWTH'
                    ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-bold text-gray-800 mb-1">المتوسطة</h4>
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                    GROWTH
                  </div>
                </div>
                {selectedPlan === 'GROWTH' && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                      ✓ محدد
                    </span>
                  </div>
                )}
              </div>

              {/* BUSINESS Plan */}
              <div
                onClick={() => !isRenewing && setSelectedPlan('BUSINESS')}
                className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                  selectedPlan === 'BUSINESS'
                    ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-2">
                  <h4 className="text-base font-bold text-gray-800 mb-1">الاحترافية</h4>
                  <div className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                    BUSINESS
                  </div>
                </div>
                {selectedPlan === 'BUSINESS' && (
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                      ✓ محدد
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
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
              className="px-6 py-3 text-sm border-2 border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all"
              disabled={isRenewing}
            >
              إعادة تعيين
            </button>
            <button
              type="submit"
              className="px-8 py-3 text-sm rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white shadow-lg active:scale-95"
              disabled={isRenewing || isLoadingSubscription}
            >
              {isRenewing ? 'جاري التجديد...' : currentSubscription ? 'تحديث الاشتراك' : 'إنشاء اشتراك جديد'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Card - Show Renewed Subscription Info */}
      {renewedSubscription && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <ShieldIcon className="w-6 h-6 text-green-600" />
            </div>
            تم تجديد الاشتراك بنجاح
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
              <span className="text-gray-600 font-bold">الخطة:</span>
              <span className="font-bold text-gray-800">
                {planNames[renewedSubscription.planType] || renewedSubscription.planType}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
              <span className="text-gray-600 font-bold">تاريخ البداية:</span>
              <span className="font-bold text-gray-800">
                {new Date(renewedSubscription.startDate).toLocaleDateString('ar-SA')}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
              <span className="text-gray-600 font-bold">تاريخ النهاية:</span>
              <span className="font-bold text-gray-800">
                {renewedSubscription.endDate 
                  ? new Date(renewedSubscription.endDate).toLocaleDateString('ar-SA')
                  : 'غير محدد'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/50 rounded-lg">
              <span className="text-gray-600 font-bold">الحالة:</span>
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
