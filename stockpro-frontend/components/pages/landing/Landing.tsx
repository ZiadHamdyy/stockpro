
import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HomePage from './Hero';
import FeaturesPage from './Features';
import PricingPage from './Pricing';
import ContactPage from './Contact';
import { IconName } from './icons/IconCollection';

export type Page = 'home' | 'features' | 'pricing' | 'contact';

// Define a type for all manageable images
interface AppImages {
  logo: string;
  heroBg: string;
  dashboard: string;
  featureInventory: string;
  featureInvoices: string;
  featureReports: string;
  featureCrm: string;
}

export type ImageKey = keyof AppImages;

// Define a type for all manageable prices
interface AppPrices {
  basic: string;
  pro: string;
  enterprise: string;
}
export type PriceKey = keyof AppPrices;

// Define a type for the feature summaries on the homepage
export interface FeatureSummary {
  id: number;
  icon: IconName;
  title: string;
  description: string;
}

export interface StatItem {
  id: number;
  icon: IconName;
  label: string;
  value: string;
  color: 'blue' | 'emerald' | 'indigo' | 'violet';
}

const defaultImages: AppImages = {
  // Blue/Green Professional Icon
  logo: 'https://cdn-icons-png.flaticon.com/512/2920/2920326.png', 
  // Office / Finance background
  heroBg: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop', 
  dashboard: '/Screenshot 2026-01-06 at 9.21.04 AM.jpeg',
  featureInventory: '/Screenshot 2026-01-06 at 8.37.27 AM.jpeg',
  featureInvoices: '/Screenshot 2026-01-06 at 8.38.46 AM.jpeg',
  featureReports: '/Screenshot 2026-01-06 at 8.35.51 AM.jpeg',
  featureCrm: '/Screenshot 2026-01-06 at 8.38.09 AM.jpeg',
};

const defaultPrices: AppPrices = {
  basic: '24.50 ر.س',
  pro: '99 ر.س',
  enterprise: '199 ر.س',
};

const defaultFeatureSummaries: FeatureSummary[] = [
    { 
        id: 1, 
        icon: 'CrmIcon', 
        title: 'إدارة العملاء', 
        description: 'أرشفة إلكترونية ذكية لبيانات ومستندات العملاء.\nتتبع دقيق للمديونيات وكشوفات الحساب التفاعلية لتوثق كافة الحركات لضمان مطابقة مالية دقيقة مع عملائك.\nالحد الائتماني: نظام ذكي لتقييد الائتمان ومنع البيع الآجل عند تجاوز السقف المحدد، مما يحمي سيولتك من المخاطر المالية.\nرقابة الأرصدة اللحظية: متابعة دقيقة ومحدثة لمديونيات وأرصدة العملاء تضمن لك رؤية واضحة لمركزك المالي في كل ثانية.' 
    },
    { 
        id: 2, 
        icon: 'ReportsIcon', 
        title: 'تقارير الأداء', 
        description: 'مؤشر السيولة الفوري: مراقبة دقيقة لتدفقاتك النقدية والقدرة المالية لمنشأتك لضمان الاستقرار والجاهزية للاستثمار.\nتحليل ربحية الأصناف: تحديد المنتجات الأكثر تحقيقاً للأرباح وتوجيه مخزونك نحو الأصناف الأعلى عائداً لتعظيم الدخل.\nرؤية كبار العملاء: رصد وتحليل سلوك عملائك الأكثر أهمية لتقديم رعاية مخصصة تضمن استدامة ولائهم ونمو حصتك السوقية.\nالتقرير السنوي الشامل: قراءة تحليلية للمبيعات السنوية توضح منحنى النمو وتساعدك في التخطيط المستقبلي بناءً على أرقام العام السابق.\nالمقارنات الدورية الذكية: ميزة مقارنة الأداء بين فترات زمنية مختلفة لاكتشاف الفرص السوقية ومعالجة الفجوات التشغيلية بسرعة.' 
    },
    { 
        id: 3, 
        icon: 'InvoiceIcon', 
        title: 'الفواتير الإلكترونية', 
        description: 'امتثال ضريبي كلي: إصدار فواتير معتمدة كلياً وفق معايير هيئة الزكاة والضريبة والجمارك (QR Code).\nهوية بصرية موحدة: قوالب فواتير احترافية قابلة للتخصيص تعكس قوة علامتك التجارية في كل معاملة.\nأتمتة الدورة المالية: تحويل عروض الأسعار الفواتير ومزامنتها لحظياً مع المخازن والحسابات العامة.' 
    },
    { 
        id: 4, 
        icon: 'InventoryIcon', 
        title: 'إدارة المخزون', 
        description: 'حوكمة الحركات المخزنية: إدارة دقيقة لأذون الإضافة والصرف وفق دورة مستندية محكمة تضمن تتبع كل قطعة داخل مستودعاتك.\nنظام صلاحيات متقدم: تحكم كامل في أدوار المستخدمين ومنح أذونات الوصول والاعتماد لضمان أعلى مستويات الأمان والخصوصية.\nتحويلات مخزنية مرنة: لوجستيات ذكية لنقل الأصناف بين الفروع والمستودعات مع تحديث لحظي للكميات في كافة نقاط البيع.\nتسوية واعتماد آلي: معالجة فورية لفروقات الجرد مع إصدار تلقائي لقيود التسوية المخزنية لضمان تطابق الأرصدة الدفترية مع الواقع.' 
    },
];

const defaultStats: StatItem[] = [
    { id: 1, icon: 'UsersIcon', label: 'شركة تعتمد علينا', value: '+5,000', color: 'blue' },
    { id: 2, icon: 'DocumentTextIcon', label: 'فاتورة يومياً', value: '+150K', color: 'emerald' },
    { id: 3, icon: 'ServerIcon', label: 'توافر النظام', value: '99.99%', color: 'indigo' },
    { id: 4, icon: 'GlobeIcon', label: 'دعم فني', value: '24/7', color: 'violet' }
];


const Landing: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');


  const renderPage = () => {
    switch (currentPage) {
      case 'features':
        return <FeaturesPage 
                  featureImages={{
                    featureInventory: defaultImages.featureInventory,
                    featureInvoices: defaultImages.featureInvoices,
                    featureReports: defaultImages.featureReports,
                    featureCrm: defaultImages.featureCrm,
                  }} 
                />;
      case 'pricing':
        return <PricingPage prices={defaultPrices} />;
      case 'contact':
        return <ContactPage />;
      case 'home':
      default:
        return (
          <HomePage 
            setPage={setCurrentPage}
            heroBgUrl=""  // use animatedBackgrounds slideshow instead of manual override
            dashboardUrl={defaultImages.dashboard}
            featureSummaries={defaultFeatureSummaries}
            stats={defaultStats}
          />
        );
    }
  };

  return (
    <div className="font-sans text-brand-text bg-brand-blue-bg min-h-screen">
      <Navbar 
        setPage={setCurrentPage} 
        currentPage={currentPage} 
        logoUrl={defaultImages.logo}
      />
      <main className="pt-14 md:pt-14">
        {renderPage()}
      </main>
      <Footer logoUrl={defaultImages.logo} setPage={setCurrentPage} />
    </div>
  );
};

export default Landing;
