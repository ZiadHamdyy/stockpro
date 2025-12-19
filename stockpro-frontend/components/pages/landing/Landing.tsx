
import React, { useState, useEffect } from 'react';
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
  dashboard: 'https://i.imgur.com/uRk2BwU.png',
  featureInventory: 'https://i.imgur.com/gza81Im.png',
  featureInvoices: 'https://i.imgur.com/GDMg0Et.png',
  featureReports: 'https://i.imgur.com/GmfA1eF.png',
  featureCrm: 'https://i.imgur.com/pZqRxR7.png',
};

const defaultPrices: AppPrices = {
  basic: '99 ر.س',
  pro: '199 ر.س',
  enterprise: '399 ر.س',
};

const defaultFeatureSummaries: FeatureSummary[] = [
    { id: 1, icon: 'CrmIcon', title: 'إدارة العملاء', description: 'سجّل بيانات عملائك وتابع حساباتهم.' },
    { id: 2, icon: 'ReportsIcon', title: 'تقارير الأداء', description: 'احصل على تقارير تفصيلية عن أداء مبيعاتك.' },
    { id: 3, icon: 'InvoiceIcon', title: 'الفواتير الإلكترونية', description: 'أنشئ فواتير متوافقة مع المتطلبات بسهولة.' },
    { id: 4, icon: 'InventoryIcon', title: 'إدارة المخزون', description: 'تابع أصنافك وكمياتك بدقة متناهية.' },
];

const defaultStats: StatItem[] = [
    { id: 1, icon: 'UsersIcon', label: 'شركة تعتمد علينا', value: '+5,000', color: 'blue' },
    { id: 2, icon: 'DocumentTextIcon', label: 'فاتورة يومياً', value: '+150K', color: 'emerald' },
    { id: 3, icon: 'ServerIcon', label: 'توافر النظام', value: '99.99%', color: 'indigo' },
    { id: 4, icon: 'GlobeIcon', label: 'دعم فني', value: '24/7', color: 'violet' }
];


const Landing: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [images, setImages] = useState<AppImages>(defaultImages);
  const [prices, setPrices] = useState<AppPrices>(defaultPrices);
  const [featureSummaries, setFeatureSummaries] = useState<FeatureSummary[]>(defaultFeatureSummaries);
  const [stats, setStats] = useState<StatItem[]>(defaultStats);


  useEffect(() => {
    try {
      const savedImages = localStorage.getItem('stockProImages');
      if (savedImages) {
        setImages(prevImages => ({ ...prevImages, ...JSON.parse(savedImages) }));
      }
      const savedPrices = localStorage.getItem('stockProPrices');
      if (savedPrices) {
        setPrices(prevPrices => ({ ...prevPrices, ...JSON.parse(savedPrices) }));
      }
      const savedFeatures = localStorage.getItem('stockProFeatureSummaries');
      if (savedFeatures) {
        setFeatureSummaries(JSON.parse(savedFeatures));
      }
      const savedStats = localStorage.getItem('stockProStats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  const handleImageUpload = (key: ImageKey, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newImages = { ...images, [key]: base64String };
      setImages(newImages);
      try {
        localStorage.setItem('stockProImages', JSON.stringify(newImages));
      } catch (error) {
        console.error("Failed to save images to localStorage", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlUpdate = (key: ImageKey, url: string) => {
      const newImages = { ...images, [key]: url };
      setImages(newImages);
      try {
        localStorage.setItem('stockProImages', JSON.stringify(newImages));
      } catch (error) {
        console.error("Failed to save images to localStorage", error);
      }
  };

  const handlePriceChange = (key: PriceKey, value: string) => {
    const newPrices = { ...prices, [key]: value };
    setPrices(newPrices);
    try {
      localStorage.setItem('stockProPrices', JSON.stringify(newPrices));
    } catch (error) {
      console.error("Failed to save prices to localStorage", error);
    }
  };

  const handleFeatureSummaryChange = (id: number, updatedValues: Partial<FeatureSummary>) => {
    const newSummaries = featureSummaries.map(summary => 
      summary.id === id ? { ...summary, ...updatedValues } : summary
    );
    setFeatureSummaries(newSummaries);
    try {
        localStorage.setItem('stockProFeatureSummaries', JSON.stringify(newSummaries));
    } catch (error) {
        console.error("Failed to save feature summaries to localStorage", error);
    }
  };

  const handleStatChange = (id: number, updatedValues: Partial<StatItem>) => {
    const newStats = stats.map(stat => 
      stat.id === id ? { ...stat, ...updatedValues } : stat
    );
    setStats(newStats);
    try {
        localStorage.setItem('stockProStats', JSON.stringify(newStats));
    } catch (error) {
        console.error("Failed to save stats to localStorage", error);
    }
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'features':
        return <FeaturesPage 
                  onImageUpload={handleImageUpload} 
                  featureImages={{
                    featureInventory: images.featureInventory,
                    featureInvoices: images.featureInvoices,
                    featureReports: images.featureReports,
                    featureCrm: images.featureCrm,
                  }} 
                />;
      case 'pricing':
        return <PricingPage prices={prices} onPriceChange={handlePriceChange} />;
      case 'contact':
        return <ContactPage />;
      case 'home':
      default:
        return <HomePage 
                  setPage={setCurrentPage}
                  heroBgUrl={images.heroBg}
                  dashboardUrl={images.dashboard}
                  onImageUpload={handleImageUpload}
                  onImageSelect={handleImageUrlUpdate}
                  featureSummaries={featureSummaries}
                  onFeatureSummaryChange={handleFeatureSummaryChange}
                  stats={stats}
                  onStatChange={handleStatChange}
                />;
    }
  };

  return (
    <div className="font-sans text-slate-800 bg-blue-50 min-h-screen">
      <Navbar 
        setPage={setCurrentPage} 
        currentPage={currentPage} 
        logoUrl={images.logo}
        onLogoUpload={(file) => handleImageUpload('logo', file)}
        onLogoSelect={(url) => handleImageUrlUpdate('logo', url)}
      />
      <main className="pt-14 md:pt-14">
        {renderPage()}
      </main>
      <Footer logoUrl={images.logo} setPage={setCurrentPage} />
    </div>
  );
};

export default Landing;
