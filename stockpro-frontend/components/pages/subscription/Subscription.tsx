import React, { useState } from 'react';
import { ShieldIcon, XIcon, PlusIcon, EditIcon, WhatsappIcon, PhoneIcon, BarChartIcon, BellIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import {
  useGetAllCompaniesQuery,
  useUpsertCompanyMutation,
  useCreateCompanyWithSeedMutation,
} from '../../store/slices/companyApiSlice';
import { useSubscription } from '../../hook/useSubscription';

interface SubscriptionProps {
  title: string;
  license: any; // Keep for compatibility but not used
}

interface CompanyFormData {
  id?: string;
  name: string;
  activity: string;
  address: string;
  phone: string;
  taxNumber: string;
  commercialReg: string;
  currency: string;
  capital: number;
  vatRate: number;
  isVatEnabled: boolean;
  code?: string;
  logo?: string;
}

interface SubscriptionRequest {
  id: string;
  phone: string;
  plan: string;
  name?: string;
  email?: string;
  companyName?: string;
  createdAt?: string;
  status?: string;
}

const Subscription: React.FC<SubscriptionProps> = ({ title }) => {
  const { showToast } = useToast();
  const { data: companiesData, isLoading, refetch } = useGetAllCompaniesQuery();
  const [createCompanyWithSeed] = useCreateCompanyWithSeedMutation();
  const [updateCompany] = useUpsertCompanyMutation();
  
  // Subscription data
  const { subscription, limits, usage, isLoading: subscriptionLoading } = useSubscription();

  // Ensure companies is always an array
  const companies = Array.isArray(companiesData) ? companiesData : [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [codeInput, setCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'GROWTH' | 'BUSINESS'>('BASIC');
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    activity: '',
    address: '',
    phone: '',
    taxNumber: '',
    commercialReg: '',
    currency: 'SAR',
    capital: 0,
    vatRate: 15,
    isVatEnabled: true,
      code: '',
  });

  const handleOpenCreateModal = () => {
    setCodeInput('');
    setSelectedPlan('BASIC');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      activity: company.activity,
      address: company.address,
      phone: company.phone,
      taxNumber: company.taxNumber,
      commercialReg: company.commercialReg,
      currency: company.currency,
      capital: company.capital,
      vatRate: company.vatRate,
      isVatEnabled: company.isVatEnabled,
      code: company.code,
      logo: company.logo,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
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

    setIsCreating(true);
    try {
      await createCompanyWithSeed({ code, planType: selectedPlan }).unwrap();
      showToast('تم إنشاء الشركة بنجاح');
      setIsCreateModalOpen(false);
      setCodeInput('');
      setSelectedPlan('BASIC');
      refetch();
    } catch (error: any) {
      showToast(
        error?.data?.message || 'حدث خطأ أثناء إنشاء الشركة',
        'error'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCompany({
        ...formData,
        companyId: selectedCompany.id,
      }).unwrap();
      showToast('تم تحديث بيانات الشركة بنجاح');
      setIsEditModalOpen(false);
      setSelectedCompany(null);
      refetch();
    } catch (error: any) {
      showToast(
        error?.data?.message || 'حدث خطأ أثناء حفظ البيانات',
        'error'
      );
    }
  };

  const handleFieldChange = (field: keyof CompanyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Mock subscription requests data
  const mockSubscriptionRequests: SubscriptionRequest[] = [
    {
      id: '1',
      phone: '966501234567',
      plan: 'الخطة الأساسية',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      companyName: 'شركة التقنية المتقدمة',
      createdAt: '2024-01-15',
      status: 'pending',
    },
    {
      id: '2',
      phone: '966507654321',
      plan: 'الخطة المتقدمة',
      name: 'فاطمة علي',
      email: 'fatima@example.com',
      companyName: 'مؤسسة التجارة الإلكترونية',
      createdAt: '2024-01-16',
      status: 'pending',
    },
    {
      id: '3',
      phone: '966509876543',
      plan: 'الخطة المميزة',
      name: 'خالد سعيد',
      email: 'khalid@example.com',
      companyName: 'شركة الخدمات اللوجستية',
      createdAt: '2024-01-17',
      status: 'pending',
    },
    {
      id: '4',
      phone: '966505555555',
      plan: 'الخطة الأساسية',
      name: 'سارة أحمد',
      email: 'sara@example.com',
      companyName: 'مؤسسة التطوير العقاري',
      createdAt: '2024-01-18',
      status: 'pending',
    },
  ];

  const handleOpenWhatsApp = (request: SubscriptionRequest) => {
    // Format phone number (remove spaces, ensure proper format)
    const phoneNumber = request.phone.replace(/\s+/g, '').replace(/^0/, '966');
    
    // Create pre-filled message
    const messageParts = [
      'السلام عليكم ورحمة الله وبركاته',
      '',
      `أنا مهتم بالخطة: ${request.plan}`,
    ];
    
    if (request.name) {
      messageParts.push(`الاسم: ${request.name}`);
    }
    if (request.companyName) {
      messageParts.push(`اسم الشركة: ${request.companyName}`);
    }
    if (request.email) {
      messageParts.push(`البريد الإلكتروني: ${request.email}`);
    }
    
    messageParts.push('');
    messageParts.push('أرغب في الحصول على مزيد من المعلومات حول الخطة.');
    
    const message = messageParts.join('\n');
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in font-sans text-slate-800">
      {/* Orange Gradient Hero Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6 min-h-[280px] relative">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8">
          {/* Left Side: Status & Company Count */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center gap-4 mb-4">
                <ShieldIcon className="w-12 h-12 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                  <p className="text-orange-100 text-sm">إدارة جميع الشركات والمستأجرين</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-sm mb-1">إجمالي الشركات</p>
                  <p className="text-3xl font-bold text-white">{companies.length}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-sm mb-1">الحالة</p>
                  <p className="text-xl font-bold text-white">نشط</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Companies List */}
          <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/30 max-h-[240px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">قائمة الشركات</h3>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                إضافة شركة
              </button>
            </div>
            {isLoading ? (
              <div className="text-center text-gray-500 py-4">جاري التحميل...</div>
            ) : companies.length === 0 ? (
              <div className="text-center text-gray-500 py-4">لا توجد شركات مسجلة</div>
            ) : (
              <div className="space-y-2">
                {companies.slice(0, 5).map((company: any) => (
                  <div
                    key={company.id}
                    onClick={() => handleOpenEditModal(company)}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-bold text-gray-800">{company.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{company.code}</p>
                    </div>
                    <EditIcon className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                {companies.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    و {companies.length - 5} شركة أخرى
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Plan & Usage Statistics */}
      {subscription && limits && usage && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-orange-500" />
              الخطة الحالية وحدود الاستخدام
            </h3>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg font-bold ${
                subscription.planType === 'BASIC' ? 'bg-orange-100 text-orange-700' :
                subscription.planType === 'GROWTH' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {subscription.planType === 'BASIC' ? 'الخطة الأساسية' :
                 subscription.planType === 'GROWTH' ? 'الخطة المتوسطة' :
                 'الخطة الاحترافية'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">المستخدمين</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.users} / {limits.users === -1 ? '∞' : limits.users}
              </p>
              {limits.users !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.users / limits.users) * 100 >= 100 ? 'bg-red-500' :
                      (usage.users / limits.users) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.users / limits.users) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Branches */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">الفروع</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.branches} / {limits.branches === -1 ? '∞' : limits.branches}
              </p>
              {limits.branches !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.branches / limits.branches) * 100 >= 100 ? 'bg-red-500' :
                      (usage.branches / limits.branches) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.branches / limits.branches) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">الأصناف</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.items} / {limits.items === -1 ? '∞' : limits.items}
              </p>
              {limits.items !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.items / limits.items) * 100 >= 100 ? 'bg-red-500' :
                      (usage.items / limits.items) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.items / limits.items) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Invoices this month */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">الفواتير (آخر 30 يوم)</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.invoicesThisMonth} / {limits.invoicesPerMonth === -1 ? '∞' : limits.invoicesPerMonth}
              </p>
              {limits.invoicesPerMonth !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.invoicesThisMonth / limits.invoicesPerMonth) * 100 >= 100 ? 'bg-red-500' :
                      (usage.invoicesThisMonth / limits.invoicesPerMonth) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.invoicesThisMonth / limits.invoicesPerMonth) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Customers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">العملاء</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.customers} / {limits.customers === -1 ? '∞' : limits.customers}
              </p>
              {limits.customers !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.customers / limits.customers) * 100 >= 100 ? 'bg-red-500' :
                      (usage.customers / limits.customers) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.customers / limits.customers) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Suppliers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">الموردين</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.suppliers} / {limits.suppliers === -1 ? '∞' : limits.suppliers}
              </p>
              {limits.suppliers !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.suppliers / limits.suppliers) * 100 >= 100 ? 'bg-red-500' :
                      (usage.suppliers / limits.suppliers) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.suppliers / limits.suppliers) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Financial Vouchers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">السندات المالية (آخر 30 يوم)</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {usage.financialVouchersThisMonth} / {limits.financialVouchersPerMonth === -1 ? '∞' : limits.financialVouchersPerMonth}
              </p>
              {limits.financialVouchersPerMonth !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (usage.financialVouchersThisMonth / limits.financialVouchersPerMonth) * 100 >= 100 ? 'bg-red-500' :
                      (usage.financialVouchersThisMonth / limits.financialVouchersPerMonth) * 100 >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((usage.financialVouchersThisMonth / limits.financialVouchersPerMonth) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Financial Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">التحليل المالي</p>
              <p className="text-xl font-bold text-gray-800 mb-2">
                {limits.financialAnalysisEnabled ? '✅ متاح' : '❌ غير متاح'}
              </p>
            </div>
          </div>
        </div>
      )}

            {/* Subscription Requests Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-orange-500" />
            طلبات الاشتراك
          </h3>
          <div className="flex gap-6 overflow-x-auto pb-2 items-stretch">
            {mockSubscriptionRequests.length === 0 ? (
              <div className="text-center text-gray-500 py-8 w-full">
                <p className="text-sm">لا توجد طلبات اشتراك</p>
              </div>
            ) : (
              mockSubscriptionRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleOpenWhatsApp(request)}
                  className="p-4 w-[300px] bg-gray-50 hover:bg-orange-50 rounded-lg cursor-pointer transition-all border border-gray-200 hover:border-orange-300 hover:shadow-md group flex-shrink-0 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 flex-1">
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <PhoneIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {request.phone}
                        </p>
                      </div>
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                          {request.plan}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-start">
                        {request.name && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold">الاسم:</span> {request.name}
                          </p>
                        )}
                        {request.companyName && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-semibold">الشركة:</span> {request.companyName}
                          </p>
                        )}
                        {request.email && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">البريد:</span> {request.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-green-100 group-hover:bg-green-200 p-2 rounded-full transition-colors">
                        <WhatsappIcon className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      {/* Bottom Grid: 3 Equal Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Limits Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-orange-500" />
            الحدود
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">عدد الشركات</span>
              <span className="font-bold text-gray-800">{companies.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">الحد الأقصى</span>
              <span className="font-bold text-gray-800">غير محدود</span>
            </div>
          </div>
        </div>

        {/* Owner Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-orange-500" />
            المالك
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">النظام</p>
              <p className="font-bold text-gray-800">StockPro System</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">النطاق الرئيسي</p>
              <p className="font-mono text-sm text-gray-800">stockplus.cloud</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-orange-500" />
            الإحصائيات
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">طلبات معلقة</span>
              <span className="font-bold text-orange-600">{mockSubscriptionRequests.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">آخر شركة</span>
              <span className="font-bold text-gray-800 text-sm">
                {companies.length > 0 && companies[companies.length - 1]?.createdAt
                  ? new Date(companies[companies.length - 1].createdAt).toLocaleDateString('ar-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : companies.length > 0
                  ? 'قريباً'
                  : 'لا يوجد'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Company Modal - With Plan Selection */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldIcon className="w-4 h-4" />
                إضافة شركة جديدة
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-4">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  كود الشركة (6-8 أرقام) *
                </label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="123456"
                  pattern="\d{6,8}"
                  maxLength={8}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  required
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  سيتم إنشاء الشركة تلقائياً مع جميع البيانات الافتراضية
                </p>
              </div>

              {/* Plan Selection */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  اختر خطة الاشتراك *
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* BASIC Plan */}
                  <div
                    onClick={() => !isCreating && setSelectedPlan('BASIC')}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedPlan === 'BASIC'
                        ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <h4 className="text-base font-bold text-gray-800 mb-0.5">الأساسية</h4>
                      <div className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        BASIC
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المستخدمين</span>
                          <span className="font-bold text-gray-800">3</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الفروع</span>
                          <span className="font-bold text-gray-800">2</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المخازن</span>
                          <span className="font-bold text-gray-800">2</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الخزائن</span>
                          <span className="font-bold text-gray-800">2</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">البنوك</span>
                          <span className="font-bold text-gray-800">2</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الأصناف</span>
                          <span className="font-bold text-gray-800">500</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">العملاء</span>
                          <span className="font-bold text-gray-800">10</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الموردين</span>
                          <span className="font-bold text-gray-800">10</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الفواتير/شهر</span>
                        <span className="font-bold text-gray-800">500</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">عروض/شهر</span>
                          <span className="font-bold text-gray-800">50</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">سندات/شهر</span>
                          <span className="font-bold text-gray-800">100</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">ح.جارية</span>
                          <span className="font-bold text-gray-800">5</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">مصروفات/شهر</span>
                          <span className="font-bold text-gray-800">10</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المدينين</span>
                          <span className="font-bold text-red-600">✗</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الدائنين</span>
                          <span className="font-bold text-red-600">✗</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">التحليل المالي</span>
                        <span className="font-bold text-red-600">✗</span>
                      </div>
                    </div>
                    
                    {selectedPlan === 'BASIC' && (
                      <div className="mt-1.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-bold">
                          ✓ محدد
                        </span>
                      </div>
                    )}
                  </div>

                  {/* GROWTH Plan */}
                  <div
                    onClick={() => !isCreating && setSelectedPlan('GROWTH')}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedPlan === 'GROWTH'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <h4 className="text-base font-bold text-gray-800 mb-0.5">المتوسطة</h4>
                      <div className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        GROWTH
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المستخدمين</span>
                          <span className="font-bold text-gray-800">10</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الفروع</span>
                          <span className="font-bold text-gray-800">5</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المخازن</span>
                          <span className="font-bold text-gray-800">10</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الخزائن</span>
                          <span className="font-bold text-gray-800">5</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">البنوك</span>
                          <span className="font-bold text-gray-800">5</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الأصناف</span>
                          <span className="font-bold text-gray-800">5000</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">العملاء</span>
                          <span className="font-bold text-gray-800">100</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الموردين</span>
                          <span className="font-bold text-gray-800">100</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الفواتير/شهر</span>
                        <span className="font-bold text-gray-800">5000</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">عروض/شهر</span>
                          <span className="font-bold text-gray-800">500</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">سندات/شهر</span>
                          <span className="font-bold text-gray-800">1000</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">ح.جارية</span>
                          <span className="font-bold text-gray-800">50</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">مصروفات/شهر</span>
                          <span className="font-bold text-gray-800">100</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المدينين</span>
                          <span className="font-bold text-gray-800">20</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الدائنين</span>
                          <span className="font-bold text-gray-800">20</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">التحليل المالي</span>
                        <span className="font-bold text-green-600">✓</span>
                      </div>
                    </div>
                    
                    {selectedPlan === 'GROWTH' && (
                      <div className="mt-1.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
                          ✓ محدد
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BUSINESS Plan */}
                  <div
                    onClick={() => !isCreating && setSelectedPlan('BUSINESS')}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedPlan === 'BUSINESS'
                        ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center mb-2">
                      <h4 className="text-base font-bold text-gray-800 mb-0.5">الاحترافية</h4>
                      <div className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        BUSINESS
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المستخدمين</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الفروع</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المخازن</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الخزائن</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">البنوك</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الأصناف</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">العملاء</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الموردين</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الفواتير/شهر</span>
                        <span className="font-bold text-green-600">∞</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">عروض/شهر</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">سندات/شهر</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">ح.جارية</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">مصروفات/شهر</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">المدينين</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-gray-600">الدائنين</span>
                          <span className="font-bold text-green-600">∞</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">التحليل المالي</span>
                        <span className="font-bold text-green-600">✓</span>
                      </div>
                    </div>
                    
                    {selectedPlan === 'BUSINESS' && (
                      <div className="mt-1.5 text-center">
                        <span className="inline-block px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs font-bold">
                          ✓ محدد
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  * الحدود الشهرية محسوبة على أساس آخر 30 يوماً متحركة
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  disabled={isCreating}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-sm rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedPlan === 'BASIC' ? 'bg-orange-600 hover:bg-orange-700' :
                    selectedPlan === 'GROWTH' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  } text-white`}
                  disabled={isCreating}
                >
                  {isCreating ? 'جاري الإنشاء...' : `إنشاء - ${
                    selectedPlan === 'BASIC' ? 'أساسية' :
                    selectedPlan === 'GROWTH' ? 'متوسطة' :
                    'احترافية'
                  }`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldIcon className="w-5 h-5" />
                تعديل بيانات الشركة
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم الشركة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كود الشركة
                  </label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 font-mono text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    النشاط التجاري *
                  </label>
                  <input
                    type="text"
                    value={formData.activity}
                    onChange={(e) => handleFieldChange('activity', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    العنوان *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الهاتف *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الرقم الضريبي *
                  </label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => handleFieldChange('taxNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السجل التجاري *
                  </label>
                  <input
                    type="text"
                    value={formData.commercialReg}
                    onChange={(e) => handleFieldChange('commercialReg', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    العملة *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="USD">USD - دولار أمريكي</option>
                    <option value="EUR">EUR - يورو</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    رأس المال
                  </label>
                  <input
                    type="number"
                    value={formData.capital}
                    onChange={(e) => handleFieldChange('capital', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    نسبة الضريبة
                  </label>
                  <input
                    type="number"
                    value={formData.vatRate}
                    onChange={(e) => handleFieldChange('vatRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isVatEnabled}
                      onChange={(e) => handleFieldChange('isVatEnabled', e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-gray-700">تفعيل الضريبة</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
