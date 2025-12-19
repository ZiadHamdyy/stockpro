
import React from 'react';
import { InventoryIcon, InvoiceIcon, ReportsIcon, CrmIcon } from './icons/IconCollection';
import { ImageKey } from './Landing';

const featuresStaticData = [
  {
    key: 'featureInventory' as const,
    icon: InventoryIcon,
    title: 'إدارة متكاملة للمخزون',
    description: 'تحكم بشكل كامل في مخزونك من خلال نظام متقدم يتيح لك تتبع الأصناف والكميات والتنبيه عند الوصول إلى حد الطلب. يمكنك بسهولة جرد المخزون، وإدارة التحويلات بين المستودعات، ومعرفة تكلفة البضاعة المباعة بدقة فائقة.',
    points: ['تعريف عدد لا نهائي من الأصناف.', 'دعم نظام الباركود بشكل كامل.', 'تقارير حركة الصنف وتحليل الرواكد.'],
  },
  {
    key: 'featureInvoices' as const,
    icon: InvoiceIcon,
    title: 'فواتير المبيعات والمشتريات',
    description: 'أنشئ وأدر فواتيرك الإلكترونية المتوافقة مع هيئة الزكاة والضريبة والجمارك. يدعم النظام ضريبة القيمة المضافة، وإدارة عروض الأسعار، وأوامر الشراء، مع دورة مستندية كاملة تضمن لك الدقة والسهولة في التعاملات.',
    points: ['إصدار فواتير إلكترونية QR.', 'متابعة حالة الفواتير (مدفوعة، جزئية، آجلة).', 'إدارة مرتجعات المبيعات والمشتريات.'],
  },
  {
    key: 'featureReports' as const,
    icon: ReportsIcon,
    title: 'تقارير مالية وتحليلية',
    description: 'احصل على رؤية شاملة لأداء عملك من خلال مجموعة واسعة من التقارير المالية والإدارية. يمكنك استعراض تقارير الأرباح والخسائر، الميزانية العمومية، وتحليل المبيعات حسب الصنف أو العميل لاتخاذ قرارات استراتيجية مدروسة.',
    points: ['تقارير يومية، شهرية، وسنوية.', 'رسوم بيانية لتوضيح الأداء.', 'تصدير التقارير بصيغ متعددة (Excel, PDF).'],
  },
   {
    key: 'featureCrm' as const,
    icon: CrmIcon,
    title: 'إدارة العملاء والموردين',
    description: 'نظّم علاقاتك مع عملائك ومورديك من خلال ملف متكامل لكل منهم. يمكنك تسجيل كافة البيانات، ومتابعة الأرصدة والديون، واستعراض كشوف الحسابات التفصيلية، مما يساعدك على تحسين التحصيل وإدارة التدفقات النقدية بكفاءة.',
    points: ['ملف شامل لكل عميل ومورد.', 'كشوف حسابات تفصيلية.', 'تحديد حدود ائتمانية للعملاء.'],
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
    return (
        <div className="container mx-auto px-6 py-24">
            <div className={`flex flex-col lg:flex-row items-center gap-20 ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2">
                    <div className="inline-flex items-center bg-blue-50 text-stock-primary rounded-2xl p-4 mb-8">
                        <feature.icon className="w-8 h-8 ml-2" />
                        <h3 className="text-2xl font-bold">{feature.title}</h3>
                    </div>
                    <p className="text-slate-600 leading-loose mb-8 text-lg">{feature.description}</p>
                    <ul className="space-y-4">
                        {feature.points.map((point, i) => (
                            <li key={i} className="flex items-start">
                                <div className="bg-green-100 rounded-full p-1 ml-3 mt-1">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                </div>
                                <span className="text-slate-700 font-medium">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="lg:w-1/2 relative group perspective-1000">
                    <div className={`absolute -inset-4 bg-gradient-to-r ${isReversed ? 'from-green-200 to-blue-200' : 'from-blue-200 to-green-200'} rounded-3xl blur-2xl opacity-50`}></div>
                    <img 
                        src={imgSrc}
                        alt={feature.title} 
                        className="relative rounded-2xl shadow-2xl w-full h-auto object-cover border-4 border-white transform transition duration-500 hover:scale-[1.01]"
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
      <div className="bg-stock-light py-24 border-b border-slate-100">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-black text-stock-dark mb-6">مميزات Stock.Pro بالتفصيل</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">اكتشف كيف يمكن لأدواتنا المتقدمة أن تساهم في نمو أعمالك وتبسيط عملياتك المحاسبية.</p>
        </div>
      </div>
      
      {featuresStaticData.map((feature, index) => (
        <div key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
            <FeatureSection 
              feature={feature} 
              index={index} 
              imgSrc={featureImages[feature.key]}
              onImageUpload={onImageUpload}
            />
        </div>
      ))}

    </section>
  );
};

export default FeaturesPage;
