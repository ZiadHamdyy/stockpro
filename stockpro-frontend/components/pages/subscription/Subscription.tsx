import React, { useState } from 'react';
import { ShieldIcon, XIcon, PlusIcon, EditIcon, WhatsappIcon, PhoneIcon } from '../../icons';
import { useToast } from '../../common/ToastProvider';
import {
  useGetAllCompaniesQuery,
  useUpsertCompanyMutation,
  useCreateCompanyWithSeedMutation,
} from '../../store/slices/companyApiSlice';

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
  host: string;
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

  // Ensure companies is always an array
  const companies = Array.isArray(companiesData) ? companiesData : [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [hostInput, setHostInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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
    host: '',
  });

  const handleOpenCreateModal = () => {
    setHostInput('');
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
      host: company.host,
      logo: company.logo,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate host
    const normalizedHost = hostInput.toLowerCase().trim();
    
    if (!normalizedHost) {
      showToast('يرجى إدخال اسم النطاق (Host)', 'error');
      return;
    }

    // Validate host format
    if (!/^[a-z0-9.-]+$/.test(normalizedHost)) {
      showToast('اسم النطاق يجب أن يحتوي فقط على أحرف صغيرة وأرقام ونقاط وشرطات', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await createCompanyWithSeed({ host: normalizedHost }).unwrap();
      showToast('تم إنشاء الشركة بنجاح');
      setIsCreateModalOpen(false);
      setHostInput('');
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
                      <p className="text-xs text-gray-500 font-mono">{company.host}</p>
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

        
      </div>

      {/* Create Company Modal - Simplified (Only Host) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldIcon className="w-5 h-5" />
                إضافة شركة جديدة
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم النطاق (Host) *
                </label>
                <input
                  type="text"
                  value={hostInput}
                  onChange={(e) => setHostInput(e.target.value)}
                  placeholder="companyname.stockplus.cloud"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  required
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  سيتم إنشاء الشركة تلقائياً مع جميع البيانات الافتراضية (أدوار، صلاحيات، مستخدم، فرع، مخزن، إلخ)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  disabled={isCreating}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isCreating}
                >
                  {isCreating ? 'جاري الإنشاء...' : 'إنشاء الشركة'}
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
                    النطاق (Host)
                  </label>
                  <input
                    type="text"
                    value={formData.host}
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
