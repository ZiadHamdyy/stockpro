import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldIcon,
  SearchIcon, 
  PlusIcon, 
  FileTextIcon, 
  ExcelIcon,
  UsersIcon,
  ClockIcon,
  AlertTriangleIcon,
  CreditCardIcon,
  PhoneIcon,
  MailIcon,
  TrashIcon,
  EditIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  XIcon,
  SparklesIcon,
  BarChartIcon
} from '../../icons';
import { useToast } from '../../common/ToastProvider';
import { useGetAllCompaniesQuery } from '../../store/slices/companyApiSlice';
import { useLazyGetSubscriptionByCodeQuery, useRenewSubscriptionMutation } from '../../store/slices/subscriptionApiSlice';
import type { SubscriptionManagement, SubscriptionManagementStats, SubscriptionManagementPackageType, SubscriptionManagementStatus } from '../../../types';

interface SubscriptionManagementProps {
  title: string;
}

// Constants
const PACKAGE_LABELS: Record<SubscriptionManagementPackageType, string> = {
  Starter: 'الباقة الأساسية',
  Growth: 'باقة النمو',
  Enterprise: 'الباقة الاحترافية',
  Trial: 'نسخة تجريبية'
};

const STATUS_COLORS: Record<SubscriptionManagementStatus, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  trial: 'bg-blue-100 text-blue-700 border-blue-200'
};

const STATUS_LABELS: Record<SubscriptionManagementStatus, string> = {
  active: 'نشط',
  expired: 'منتهي',
  pending: 'قيد المراجعة',
  trial: 'تجريبي'
};

const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const getAIInsights = async (subscriptions: SubscriptionManagement[]): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return 'خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى إعداد مفتاح API.';
  }

  try {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const trialSubscriptions = subscriptions.filter(s => s.status === 'trial');
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired');
    
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.status === 'active' ? s.price : 0), 0);
    const expiringSoon = subscriptions.filter(s => {
      const days = calculateDaysRemaining(s.endDate);
      return days >= 0 && days <= 7 && s.status === 'active';
    }).length;

    const prompt = `قم بتحليل بيانات الاشتراكات التالية وقدم تقريراً تحليلياً باللغة العربية:
- إجمالي الاشتراكات النشطة: ${activeSubscriptions.length}
- الاشتراكات التجريبية: ${trialSubscriptions.length}
- الاشتراكات المنتهية: ${expiredSubscriptions.length}
- الإيرادات الإجمالية: ${totalRevenue} ريال
- الاشتراكات التي أوشكت على الانتهاء (خلال 7 أيام): ${expiringSoon}

قدم تحليلاً شاملاً يتضمن:
1. تقييم الأداء العام
2. التوصيات للتحسين
3. فرص النمو
4. المخاطر المحتملة`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('فشل في الاتصال بخدمة الذكاء الاصطناعي');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم الحصول على تحليل';
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return 'حدث خطأ أثناء جلب التحليل. يرجى المحاولة لاحقاً.';
  }
};

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ title }) => {
  const { showToast } = useToast();
  const { data: companiesData, isLoading, refetch } = useGetAllCompaniesQuery();
  const [getSubscriptionByCode] = useLazyGetSubscriptionByCodeQuery();
  const [renewSubscription] = useRenewSubscriptionMutation();

  const [subscriptions, setSubscriptions] = useState<SubscriptionManagement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'trial'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionManagement | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [marketingOffer, setMarketingOffer] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyCode: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    package: 'Starter' as SubscriptionManagementPackageType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active' as SubscriptionManagementStatus,
    price: 0
  });

  const companies = Array.isArray(companiesData) ? companiesData : [];

  // Fetch subscription data for all companies
  useEffect(() => {
    const fetchSubscriptions = async () => {
      const subscriptionPromises = companies.map(async (company) => {
        try {
          const subscriptionData = await getSubscriptionByCode(company.code).unwrap();
          
          const subscription: SubscriptionManagement = {
            id: subscriptionData.id || company.id,
            companyCode: company.code,
            companyName: company.name,
            contactName: subscriptionData.company?.admins?.[0]?.name || company.name,
            phone: company.phone || '',
            email: subscriptionData.company?.admins?.[0]?.email || '',
            package: subscriptionData.planType === 'BASIC' ? 'Starter' : 
                     subscriptionData.planType === 'GROWTH' ? 'Growth' : 
                     subscriptionData.planType === 'BUSINESS' ? 'Enterprise' : 'Trial',
            startDate: subscriptionData.startDate ? new Date(subscriptionData.startDate).toISOString().split('T')[0] : '',
            endDate: subscriptionData.endDate ? new Date(subscriptionData.endDate).toISOString().split('T')[0] : '',
            status: subscriptionData.status === 'ACTIVE' ? 'active' : 
                   subscriptionData.status === 'EXPIRED' ? 'expired' : 
                   subscriptionData.status === 'TRIAL' ? 'trial' : 'pending',
            price: 0,
          };

          if (subscription.endDate) {
            const daysLeft = calculateDaysRemaining(subscription.endDate);
            if (daysLeft < 0 && subscription.status === 'active') {
              subscription.status = 'expired';
            }
          }

          return subscription;
        } catch (error) {
          const subscription: SubscriptionManagement = {
            id: company.id,
            companyCode: company.code,
            companyName: company.name,
            contactName: company.name,
            phone: company.phone || '',
            email: '',
            package: 'Trial',
            startDate: company.createdAt ? new Date(company.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: '',
            status: 'pending',
            price: 0,
          };
          return subscription;
        }
      });

      const results = await Promise.all(subscriptionPromises);
      setSubscriptions(results);
    };

    if (companies.length > 0) {
      fetchSubscriptions();
    }
  }, [companies, getSubscriptionByCode]);

  // Statistics Calculation
  const stats = useMemo<SubscriptionManagementStats>(() => {
    return {
      totalActive: subscriptions.filter(s => s.status === 'active').length,
      totalTrials: subscriptions.filter(s => s.status === 'trial').length,
      expiringSoon: subscriptions.filter(s => {
        const days = calculateDaysRemaining(s.endDate);
        return days >= 0 && days <= 7 && s.status === 'active';
      }).length,
      totalRevenue: subscriptions.reduce((sum, s) => sum + (s.status === 'active' ? s.price : 0), 0)
    };
  }, [subscriptions]);

  // Filtering Logic
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      const matchesSearch = 
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [subscriptions, searchTerm, filterStatus]);

  const handleAddSubscription = async (newSub: Omit<SubscriptionManagement, 'id'>) => {
    const sub: SubscriptionManagement = {
      ...newSub,
      id: Math.random().toString(36).substr(2, 9)
    };
    setSubscriptions([sub, ...subscriptions]);
    setShowAddModal(false);
    setFormData({
      companyCode: '',
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      package: 'Starter',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      price: 0
    });
    showToast('تم إضافة الاشتراك بنجاح');
  };

  const handleEditSubscription = (sub: SubscriptionManagement) => {
    setEditingSubscription(sub);
    setFormData({
      companyCode: sub.companyCode,
      companyName: sub.companyName,
      contactName: sub.contactName,
      phone: sub.phone,
      email: sub.email,
      package: sub.package,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      price: sub.price
    });
    setShowAddModal(true);
  };

  const handleUpdateSubscription = async (updatedSub: Omit<SubscriptionManagement, 'id'>) => {
    if (!editingSubscription) return;
    
    const sub: SubscriptionManagement = {
      ...updatedSub,
      id: editingSubscription.id
    };
    setSubscriptions(subscriptions.map(s => s.id === editingSubscription.id ? sub : s));
    setShowAddModal(false);
    setEditingSubscription(null);
    setFormData({
      companyCode: '',
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      package: 'Starter',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      price: 0
    });
    showToast('تم تحديث الاشتراك بنجاح');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاشتراك نهائياً؟')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
      showToast('تم حذف الاشتراك بنجاح');
    }
  };

  const handleRenew = async (id: string) => {
    const subscription = subscriptions.find(s => s.id === id);
    if (!subscription) return;

    try {
      const newEndDate = new Date();
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      
      await renewSubscription({
        code: subscription.companyCode,
        planType: subscription.package === 'Starter' ? 'BASIC' : 
                 subscription.package === 'Growth' ? 'GROWTH' : 
                 subscription.package === 'Enterprise' ? 'BUSINESS' : 'BASIC',
        startDate: new Date().toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
      }).unwrap();

      setSubscriptions(prev => prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            endDate: newEndDate.toISOString().split('T')[0]
          };
        }
        return s;
      }));

      showToast('تم تجديد الاشتراك بنجاح لمدة سنة إضافية!');
      refetch();
    } catch (error: any) {
      showToast(error?.data?.message || 'حدث خطأ أثناء تجديد الاشتراك', 'error');
    }
  };

  const handleFetchInsights = async () => {
    setIsLoadingInsight(true);
    try {
      const result = await getAIInsights(subscriptions);
      setAiInsight(result);
    } catch (error) {
      showToast('فشل في جلب التحليل', 'error');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleSendTrialOffer = async () => {
    const trialCompanies = subscriptions.filter(s => s.status === 'trial');
    if (trialCompanies.length === 0) {
      showToast('لا يوجد شركات تجريبية حالياً لإرسال عروض لها.', 'error');
      return;
    }

    setIsLoadingInsight(true);
    try {
      const offer = `عرض خاص للشركات التجريبية: خصم 30% عند الاشتراك السنوي خلال 48 ساعة.\n\nالشركات المستهدفة:\n${trialCompanies.map(c => `- ${c.companyName}`).join('\n')}`;
      setMarketingOffer(offer);
      showToast('تم إنشاء العرض التسويقي');
    } catch (error) {
      showToast('فشل في توليد العرض.', 'error');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubscription) {
      handleUpdateSubscription(formData);
    } else {
      handleAddSubscription(formData);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubscription(null);
    setFormData({
      companyCode: '',
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      package: 'Starter',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      price: 0
    });
    setShowAddModal(true);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in font-sans text-slate-800">
      {/* Orange Gradient Hero Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl shadow-xl overflow-hidden mb-6 min-h-[280px] relative">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8">
          {/* Left Side: Stats */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center gap-4 mb-4">
                <ShieldIcon className="w-12 h-12 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                  <p className="text-orange-100 text-sm">تحليل ذكي ومراقبة دقيقة لبرنامج StockPro Cloud</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-sm mb-1">الاشتراكات النشطة</p>
                  <p className="text-3xl font-bold text-white">{stats.totalActive}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <p className="text-orange-100 text-sm mb-1">النسخ التجريبية</p>
                  <p className="text-3xl font-bold text-white">{stats.totalTrials}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Search and Actions */}
          <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">البحث والفلترة</h3>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                إضافة ترخيص
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث بالكود، الاسم، أو الهاتف..."
                  className="w-full pr-10 pl-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'trial', 'expired'].map((st) => (
                  <button 
                    key={st}
                    onClick={() => setFilterStatus(st as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      filterStatus === st 
                        ? 'bg-orange-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'all' ? 'الكل' : st === 'active' ? 'النشطة' : st === 'trial' ? 'التجريبية' : 'المنتهية'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleFetchInsights}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <SparklesIcon className="w-4 h-4" />
                  تحليل ذكي
                </button>
                <button
                  onClick={handleSendTrialOffer}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <BarChartIcon className="w-4 h-4" />
                  عروض ترويجية
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">الاشتراكات النشطة</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalActive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">النسخ التجريبية</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTrials}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangleIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">أوشكت على الانتهاء</p>
              <p className="text-2xl font-bold text-gray-800">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold">الإيرادات النشطة</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight Section */}
      {(aiInsight || marketingOffer || isLoadingInsight) && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <SparklesIcon className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-800">التحليل التنبئي والذكاء التسويقي</h3>
            {isLoadingInsight && <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiInsight && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-blue-600 font-bold mb-2">📊 تقرير الحالة الراهنة</h4>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{aiInsight}</div>
              </div>
            )}
            {marketingOffer && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-amber-700 font-bold">🚀 مسودة العرض التسويقي</h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(marketingOffer);
                      showToast('تم النسخ!');
                    }}
                    className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg font-bold hover:bg-amber-600 transition-all"
                  >نسخ النص</button>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap italic">{marketingOffer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-orange-500" />
            قاعدة بيانات العملاء ({filteredSubscriptions.length} سجل)
          </h3>
          <div className="flex items-center gap-2">
            <button title="تصدير PDF" className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all">
              <FileTextIcon className="w-5 h-5" />
            </button>
            <button title="تصدير Excel" className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all">
              <ExcelIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">جاري التحميل...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-orange-500 text-white">
                  <th className="px-4 py-4 text-center text-xs font-black uppercase w-12">#</th>
                  <th className="px-6 py-4 text-sm font-black">كود الشركة</th>
                  <th className="px-6 py-4 text-sm font-black">الاسم التجاري</th>
                  <th className="px-6 py-4 text-sm font-black">بيانات التواصل</th>
                  <th className="px-6 py-4 text-sm font-black">الباقة</th>
                  <th className="px-6 py-4 text-sm font-black">الاستهلاك والوقت</th>
                  <th className="px-6 py-4 text-sm font-black">الحالة</th>
                  <th className="px-6 py-4 text-sm font-black">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscriptions.map((sub, index) => {
                  const daysLeft = calculateDaysRemaining(sub.endDate);
                  const isUrgent = daysLeft >= 0 && daysLeft <= 7;
                  const totalDays = 365;
                  const consumedDays = totalDays - Math.max(0, daysLeft);
                  const progressPercentage = Math.min(100, (consumedDays / totalDays) * 100);

                  return (
                    <tr 
                      key={sub.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-all`}
                    >
                      <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">{sub.companyCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-black">
                            {sub.companyName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{sub.companyName}</span>
                            <span className="text-xs text-gray-500">{sub.contactName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-xs text-gray-700 font-bold" dir="ltr">
                            <PhoneIcon className="w-3.5 h-3.5 text-orange-500" />
                            <span>{sub.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MailIcon className="w-3.5 h-3.5 text-blue-400" />
                            <span>{sub.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{PACKAGE_LABELS[sub.package]}</span>
                          <span className="text-xs text-green-600 font-bold mt-1">{formatCurrency(sub.price)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 w-48">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={daysLeft < 0 ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'}>
                              {daysLeft < 0 ? 'منتهي' : `${daysLeft} يوم متبقي`}
                            </span>
                            <span className="text-gray-400">{sub.endDate}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${daysLeft < 0 ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-orange-500'}`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 uppercase ${STATUS_COLORS[sub.status]}`}>
                          {STATUS_LABELS[sub.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRenew(sub.id)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                            title="تجديد"
                          >
                            <RefreshCwIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditSubscription(sub)}
                            className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition-all"
                            title="تعديل"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(sub.id)}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            title="حذف"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSubscriptions.length === 0 && (
              <div className="py-24 text-center">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheckIcon className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">لا يوجد سجلات مطابقة</h3>
                <p className="text-gray-500">جرب البحث بكلمات مختلفة أو تغيير الفلاتر</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-orange-500 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <ShieldCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{editingSubscription ? 'تعديل ترخيص' : 'إصدار ترخيص جديد'}</h2>
                  <p className="text-orange-100 text-xs">يرجى تعبئة كافة البيانات المطلوبة بدقة</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSubscription(null);
                }} 
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">كود الشركة الفريد</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-mono font-bold"
                  placeholder="ACC-XXXX"
                  value={formData.companyCode}
                  onChange={e => setFormData({...formData, companyCode: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">اسم الكيان التجاري</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  placeholder="الشركة، المؤسسة، أو الفرد"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">اسم جهة الاتصال</label>
                <input 
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  placeholder="اسم المسؤول"
                  value={formData.contactName}
                  onChange={e => setFormData({...formData, contactName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">رقم الهاتف</label>
                <input 
                  required
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  placeholder="05xxxxxxxx"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">البريد الإلكتروني</label>
                <input 
                  required
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">نوع الباقة</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold bg-white"
                  value={formData.package}
                  onChange={e => setFormData({...formData, package: e.target.value as SubscriptionManagementPackageType})}
                >
                  <option value="Starter">الباقة الأساسية</option>
                  <option value="Growth">باقة النمو</option>
                  <option value="Enterprise">الباقة الاحترافية</option>
                  <option value="Trial">نسخة تجريبية</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">قيمة الاشتراك (SAR)</label>
                <input 
                  required
                  type="number"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold text-green-600"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">تاريخ البدء</label>
                <input 
                  required
                  type="date"
                  value={formData.startDate}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">تاريخ الانتهاء</label>
                <input 
                  required
                  type="date"
                  value={formData.endDate}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold"
                  min={formData.startDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">الحالة</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 outline-none transition-all font-bold bg-white"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as SubscriptionManagementStatus})}
                >
                  <option value="active">نشط</option>
                  <option value="trial">تجريبي</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="expired">منتهي</option>
                </select>
              </div>

              <div className="col-span-full pt-4 flex gap-4">
                <button 
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg active:scale-95"
                >
                  {editingSubscription ? 'حفظ التعديلات' : 'اعتماد وإصدار الترخيص'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSubscription(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-all"
                >
                  تراجع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
