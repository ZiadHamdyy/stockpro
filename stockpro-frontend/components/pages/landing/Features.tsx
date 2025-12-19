
import React from 'react';
import { InventoryIcon, InvoiceIcon, ReportsIcon, CrmIcon } from './icons/IconCollection';
import { ImageKey } from './Landing';

const featuresStaticData = [
  {
    key: 'featureInventory' as const,
    icon: InventoryIcon,
    title: 'إدارة متكاملة للمخزون',
    description: 'تحكم بشكل كامل في مخزونك من خلال نظام متقدم يتيح لك تتبع الأصناف والكميات والتنبيه عند الوصول إلى حد الطلب. يمكنك بسهولة جرد المخزون، وإدارة التحويلات بين المستودعات، ومعرفة تكلفة البضاعة المباعة بدقة فائقة.',
    points: [
      'تعريف عدد لا نهائي من الأصناف مع مجموعات ووحدات قياس متعددة',
      'دعم نظام الباركود بشكل كامل',
      'إدارة متعددة المخازن مع تحويلات تلقائية',
      'جرد المخزون والتسوية مع تقارير الفروقات',
      'تقارير حركة الصنف وتحليل الرواكد والمنتهية الصلاحية',
      'إذن إضافة وصرف مخزن مع تتبع كامل للحركات'
    ],
  },
  {
    key: 'featureInvoices' as const,
    icon: InvoiceIcon,
    title: 'فواتير المبيعات والمشتريات',
    description: 'أنشئ وأدر فواتيرك الإلكترونية المتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA). يدعم النظام ضريبة القيمة المضافة، وإدارة عروض الأسعار، وأوامر الشراء، مع دورة مستندية كاملة تضمن لك الدقة والسهولة في التعاملات.',
    points: [
      'إصدار فواتير إلكترونية متوافقة مع ZATCA مع QR Code',
      'نقطة بيع (POS) متكاملة وسريعة',
      'عروض أسعار قابلة للتحويل إلى فواتير',
      'متابعة حالة الفواتير (مدفوعة، جزئية، آجلة)',
      'إدارة مرتجعات المبيعات والمشتريات',
      'يوميات المبيعات والمشتريات مع تقارير تفصيلية',
      'طباعة فواتير احترافية قابلة للتخصيص'
    ],
  },
  {
    key: 'featureReports' as const,
    icon: ReportsIcon,
    title: 'تقارير مالية وتحليلية متقدمة',
    description: 'احصل على رؤية شاملة لأداء عملك من خلال مجموعة واسعة من التقارير المالية والإدارية. يمكنك استعراض تقارير الأرباح والخسائر، الميزانية العمومية، وتحليل المبيعات حسب الصنف أو العميل لاتخاذ قرارات استراتيجية مدروسة.',
    points: [
      'قائمة الدخل (الأرباح والخسائر)',
      'الميزانية العمومية',
      'تقارير يومية، شهرية، وسنوية',
      'تحليل المبيعات حسب الصنف، العميل، أو الفترة',
      'تقارير الحسابات المدينة والدائنة',
      'رسوم بيانية تفاعلية لتوضيح الأداء',
      'تصدير التقارير بصيغ متعددة (Excel, PDF)',
      'تقارير المصروفات والإيرادات مع تصنيفات متعددة'
    ],
  },
   {
    key: 'featureCrm' as const,
    icon: CrmIcon,
    title: 'إدارة العملاء والموردين والحسابات',
    description: 'نظّم علاقاتك مع عملائك ومورديك من خلال ملف متكامل لكل منهم. يمكنك تسجيل كافة البيانات، ومتابعة الأرصدة والديون، واستعراض كشوف الحسابات التفصيلية، مما يساعدك على تحسين التحصيل وإدارة التدفقات النقدية بكفاءة.',
    points: [
      'ملف شامل لكل عميل ومورد مع بيانات كاملة',
      'كشوف حسابات تفصيلية مع حركات الديون والائتمان',
      'تحديد حدود ائتمانية للعملاء',
      'إدارة الحسابات المدينة والدائنة',
      'سندات القبض والدفع مع ربط تلقائي',
      'تقارير أعمار الديون والتحصيل',
      'ربط تلقائي مع الفواتير والحركات المالية'
    ],
  }
];

interface FeatureSectionProps {
  feature: typeof featuresStaticData[0];
  index: number;
  imgSrc: string;
  onImageUpload: (key: ImageKey, file: File) => void;
}


const FeatureSection: React.FC<FeatureSectionProps> = ({ feature, index, imgSrc, onImageUpload }) => {
    const isReversed = index % 2 !== 0;
    const colorConfigs = [
        { gradient: 'from-blue-500 to-blue-600', bgGradient: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/50', iconBg: 'from-blue-500 to-blue-600' },
        { gradient: 'from-emerald-500 to-emerald-600', bgGradient: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/50', iconBg: 'from-emerald-500 to-emerald-600' },
        { gradient: 'from-purple-500 to-purple-600', bgGradient: 'from-purple-50 to-purple-100/50', border: 'border-purple-200/50', iconBg: 'from-purple-500 to-purple-600' },
        { gradient: 'from-indigo-500 to-indigo-600', bgGradient: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/50', iconBg: 'from-indigo-500 to-indigo-600' },
    ];
    const colors = colorConfigs[index % colorConfigs.length];
    
    return (
        <div className="container mx-auto px-6 py-24">
            <div className={`flex flex-col lg:flex-row items-center gap-20 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2">
                    <div className={`inline-flex items-center bg-gradient-to-r ${colors.bgGradient} text-white rounded-2xl p-5 mb-8 border-2 ${colors.border} shadow-xl`}>
                        <div className={`bg-gradient-to-br ${colors.iconBg} p-2 rounded-xl ml-3`}>
                            <feature.icon className="w-8 h-8" />
                        </div>
                        <h3 className={`text-2xl font-black bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>{feature.title}</h3>
                    </div>
                    <p className="text-slate-600 leading-loose mb-8 text-lg font-medium">{feature.description}</p>
                    <ul className="space-y-3">
                        {feature.points.map((point, i) => (
                            <li key={i} className="flex items-start group">
                                <div className={`bg-gradient-to-br ${colors.iconBg} rounded-full p-1.5 ml-3 mt-0.5 group-hover:scale-110 transition-all flex-shrink-0 shadow-md`}>
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                </div>
                                <span className="text-slate-800 font-semibold text-base leading-relaxed">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:w-1/2 relative group perspective-1000">
                    {index === 0 && <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 to-blue-300 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>}
                    {index === 1 && <div className="absolute -inset-4 bg-gradient-to-r from-emerald-200 to-emerald-300 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>}
                    {index === 2 && <div className="absolute -inset-4 bg-gradient-to-r from-purple-200 to-purple-300 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>}
                    {index === 3 && <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200 to-indigo-300 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>}
                    <div className={`absolute -inset-2 bg-gradient-to-br ${colors.gradient} rounded-3xl blur-xl opacity-30`}></div>
                    <img 
                        src={imgSrc}
                        alt={feature.title} 
                        className="relative rounded-2xl shadow-2xl w-full h-auto object-cover border-4 border-white transform transition duration-500 hover:scale-[1.02] z-10"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl z-10">
                        <input 
                            type="file" 
                            id={`featureUpload-${feature.key}`}
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && onImageUpload(feature.key, e.target.files[0])}
                        />
                        <label 
                            htmlFor={`featureUpload-${feature.key}`}
                            className="cursor-pointer bg-white text-stock-dark font-bold py-2 px-6 rounded-full hover:bg-gray-50 transition shadow-lg"
                        >
                            تغيير الصورة
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FeaturesPageProps {
  onImageUpload: (key: ImageKey, file: File) => void;
  featureImages: {
    featureInventory: string;
    featureInvoices: string;
    featureReports: string;
    featureCrm: string;
  };
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onImageUpload, featureImages }) => {
  return (
    <section id="features" className="bg-white">
      <div className="bg-gradient-to-b from-blue-50 to-white py-24 border-b border-slate-100">
        <div className="container mx-auto px-6 text-center">
            <span className="inline-block text-emerald-600 font-bold text-sm uppercase tracking-wider bg-emerald-100/50 px-4 py-1.5 rounded-full border border-emerald-100 mb-4">
              نظام متكامل
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-stock-dark mb-6">مميزات Stock.Pro بالتفصيل</h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
              اكتشف كيف يمكن لأدواتنا المتقدمة أن تساهم في نمو أعمالك وتبسيط عملياتك المحاسبية. نظام واحد شامل يغطي جميع احتياجاتك المحاسبية والإدارية.
            </p>
        </div>
      </div>
      
      {featuresStaticData.map((feature, index) => {
        const bgGradients = [
          'bg-gradient-to-br from-white to-blue-50/30',
          'bg-gradient-to-br from-emerald-50/30 via-white to-purple-50/30',
          'bg-gradient-to-br from-white to-indigo-50/30',
          'bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30',
        ];
        return (
          <div key={index} className={bgGradients[index % bgGradients.length]}>
              <FeatureSection 
                feature={feature} 
                index={index} 
                imgSrc={featureImages[feature.key]}
                onImageUpload={onImageUpload}
              />
          </div>
        );
      })}

      {/* Additional Features Grid */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black text-stock-dark mb-4">مميزات إضافية</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">نظام متكامل يغطي جميع احتياجاتك</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: 'الفوترة الإلكترونية ZATCA',
                description: 'رفع الفواتير تلقائياً إلى هيئة الزكاة والضريبة والجمارك مع دعم كامل للمتطلبات',
                icon: '📄'
              },
              {
                title: 'إدارة متعددة الفروع',
                description: 'إدارة فروع متعددة مع تقارير موحدة وإمكانية التحويل بين الفروع',
                icon: '🏢'
              },
              {
                title: 'نظام الصلاحيات المتقدم',
                description: 'تحكم كامل في صلاحيات المستخدمين مع أدوار مخصصة وسجل عمليات شامل',
                icon: '🔐'
              },
              {
                title: 'الفترات المحاسبية',
                description: 'إدارة فترات محاسبية متعددة مع إغلاق وفتح الفترات بشكل منظم',
                icon: '📅'
              },
              {
                title: 'النسخ الاحتياطي',
                description: 'نسخ احتياطية تلقائية لحماية بياناتك مع إمكانية الاستعادة في أي وقت',
                icon: '💾'
              },
              {
                title: 'سجل العمليات',
                description: 'تتبع كامل لجميع العمليات مع تفاصيل المستخدم والوقت لكل عملية',
                icon: '📊'
              }
            ].map((feature, i) => {
              const gradients = [
                'from-blue-50 to-blue-100/50',
                'from-emerald-50 to-emerald-100/50',
                'from-purple-50 to-purple-100/50',
                'from-indigo-50 to-indigo-100/50',
                'from-teal-50 to-teal-100/50',
                'from-amber-50 to-amber-100/50',
              ];
              return (
                <div key={i} className={`bg-gradient-to-br ${gradients[i % gradients.length]} p-6 rounded-2xl border-2 border-white/80 hover:border-blue-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-black text-stock-dark mb-2">{feature.title}</h4>
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
};

export default FeaturesPage;
