
import React, { useState, useEffect } from 'react';
import { iconMap, IconName, ArrowLeftIcon, QuoteIcon, UsersIcon, ServerIcon, GlobeIcon, ChartBarIcon, CurrencyDollarIcon, CalculatorIcon, PieChartIcon, TrendingUpIcon, DocumentTextIcon } from './icons/IconCollection';
import { Page, FeatureSummary, StatItem } from './Landing';
import Modal from './Modal';

// --- Floating Icons Component with DISTINCTIVE COLORS ---
const FloatingIconsBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {/* Icon 1: Chart - Top Left - Golden (Profit) */}
            <div className="absolute top-[12%] left-[8%] text-amber-400 opacity-80 animate-float-slow">
                <div className="bg-white p-3 rounded-2xl shadow-lg shadow-amber-100 border border-amber-50">
                    <ChartBarIcon className="w-10 h-10" />
                </div>
            </div>
             {/* Icon 2: Currency - Top Right - Green (Money) */}
            <div className="absolute top-[15%] right-[8%] text-brand-green opacity-90 animate-float-medium">
                <div className="bg-white p-4 rounded-full shadow-lg shadow-brand-green-bg border border-brand-green-bg">
                    <CurrencyDollarIcon className="w-12 h-12" />
                </div>
            </div>
             {/* Icon 3: Calculator - Bottom Left - Blue (Tech) */}
            <div className="absolute bottom-[25%] left-[15%] text-brand-blue opacity-80 animate-float-fast">
                <div className="bg-white p-3 rounded-2xl shadow-lg shadow-brand-blue-bg border border-brand-blue-bg">
                    <CalculatorIcon className="w-10 h-10 transform -rotate-6" />
                </div>
            </div>
             {/* Icon 4: Pie Chart - Bottom Right - Blue (Analytics) */}
             <div className="absolute top-[40%] right-[15%] text-brand-blue opacity-80 animate-float-slow">
                <div className="bg-white p-2 rounded-xl shadow-lg shadow-brand-blue-bg border border-brand-blue-bg">
                    <PieChartIcon className="w-8 h-8 transform rotate-6" />
                </div>
            </div>
             {/* Icon 5: Trending Up - Center Left - Green (Growth) */}
             <div className="absolute top-[35%] left-[2%] text-brand-green opacity-60 animate-float-medium">
                <TrendingUpIcon className="w-8 h-8 transform -rotate-12" />
            </div>
        </div>
    );
};


// --- Feature Summary Card ---
const FeatureSummaryCard: React.FC<{
  feature: FeatureSummary;
  onOpenDetails: (feature: FeatureSummary) => void;
  gradientClass?: string;
}> = ({ feature, onOpenDetails, gradientClass = 'from-brand-blue-bg to-brand-blue-bg/80' }) => {
  const Icon = iconMap[feature.icon];

  return (
    <div 
        className={`bg-gradient-to-br ${gradientClass} p-8 rounded-3xl shadow-lg border-2 border-white/80 hover:shadow-2xl hover:border-blue-300/50 transition-all duration-300 relative group cursor-pointer`}
        onClick={() => onOpenDetails(feature)}
    >
      <div className="relative inline-block mb-6">
        <div className="p-4 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white rounded-2xl transition-all duration-300 group-hover:from-brand-blue/90 group-hover:to-brand-blue/80 group-hover:scale-110 shadow-xl">
          <Icon className="w-8 h-8" />
        </div>
      </div>

      <div>
          <div className="text-xl font-bold mb-3 text-brand-dark">
              {feature.title}
          </div>
          <div className="text-slate-500 leading-relaxed text-sm">
              {feature.description}
          </div>
      </div>
    </div>
  );
};

// --- Testimonials Section ---
const TestimonialsSection = () => {
    const testimonials = [
        { name: "أحمد العلي", role: "المدير التنفيذي - شركة النور", text: "دقة في الحسابات وسهولة في الاستخدام. هذا بالضبط ما كنا نبحث عنه.", gradient: 'from-brand-blue-bg to-brand-blue-bg/80', iconBg: 'from-brand-blue to-brand-blue/90' },
        { name: "سارة محمد", role: "متجر أزياء", text: "نظام نقاط البيع والمخزون مترابط بشكل لا يصدق. وفر علينا ساعات من العمل اليدوي.", gradient: 'from-brand-green-bg to-brand-green-bg/80', iconBg: 'from-brand-green to-brand-green/90' },
        { name: "خالد عبدالله", role: "مدير مالي", text: "التقارير المالية تصدر بضغطة زر، مما يجعل اتخاذ القرارات أسرع وأدق.", gradient: 'from-brand-blue-bg to-brand-blue-bg/80', iconBg: 'from-brand-blue to-brand-blue/90' }
    ];
    
    return (
        <section className="py-24 bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg border-t border-brand-blue/20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block text-brand-green font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-5 py-2 rounded-full border-2 border-brand-green/30 shadow-md">قصص نجاح</span>
                    <h2 className="text-3xl md:text-4xl font-black mt-4">
                        <span className="bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">
                            شركاء النجاح
                        </span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className={`bg-gradient-to-br ${t.gradient} p-8 rounded-3xl border-2 border-white/80 relative hover:shadow-2xl hover:-translate-y-2 transition-all duration-300`}>
                             <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.iconBg} text-white flex items-center justify-center font-bold shadow-lg`}>
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-brand-dark text-base">{t.name}</h4>
                                    <p className="text-xs text-slate-600 font-medium">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed font-medium">"{t.text}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- Call To Action Section ---
const CallToActionSection = ({ setPage }: { setPage: (page: Page) => void }) => (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue/90 to-brand-blue border-t border-brand-blue/30">
         {/* Animated gradient overlay */}
         <div className="absolute inset-0 bg-gradient-to-br from-brand-green/20 via-transparent to-brand-blue/20 animate-pulse"></div>
         <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         </div>
         <div className="container mx-auto px-6 relative z-10 text-center">
             <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white drop-shadow-lg">ابدأ رحلة النمو اليوم</h2>
             <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium">نظام محاسبي متكامل ينمو مع نمو أعمالك، مصمم خصيصاً للشركات الطموحة.</p>
             <button 
                onClick={() => setPage('pricing')}
                className="bg-gradient-to-r from-brand-green to-brand-green/90 text-white font-bold py-5 px-14 rounded-xl text-lg hover:from-brand-green/90 hover:to-brand-green/80 transition-all shadow-2xl shadow-brand-green/50 border-2 border-white/20 hover:scale-110 transform active:scale-100 hover:shadow-brand-green/50"
            >
                 ابدأ رحلتك الآن
             </button>
         </div>
    </section>
);

// --- Main Component ---

interface HomePageProps {
  setPage: (page: Page) => void;
  heroBgUrl: string;
  dashboardUrl: string;
  featureSummaries: FeatureSummary[];
  stats: StatItem[];
}

// Updated with VERY PROFESSIONAL corporate backgrounds
const animatedBackgrounds = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop', // Blue Skyscrapers (Corporate/Growth)
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop', // Modern Office Desk (Clean/Professional)
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop' // Finance/Numbers (Direct Relevance)
];

const colorVariants: Record<string, { container: string, iconBg: string, iconText: string }> = {
    blue: { container: "hover:border-brand-blue/30 hover:shadow-brand-blue-bg", iconBg: "bg-brand-blue-bg", iconText: "text-brand-blue" },
    emerald: { container: "hover:border-brand-green/30 hover:shadow-brand-green-bg", iconBg: "bg-brand-green-bg", iconText: "text-brand-green" },
    indigo: { container: "hover:border-brand-blue/30 hover:shadow-brand-blue-bg", iconBg: "bg-brand-blue-bg", iconText: "text-brand-blue" },
    violet: { container: "hover:border-brand-blue/30 hover:shadow-brand-blue-bg", iconBg: "bg-brand-blue-bg", iconText: "text-brand-blue" },
};

const HomePage: React.FC<HomePageProps> = ({ setPage, heroBgUrl, dashboardUrl, featureSummaries, stats }) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureSummary | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Auto-rotate backgrounds every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentBgIndex((prev) => (prev + 1) % animatedBackgrounds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  
  const isManualOverride = heroBgUrl !== animatedBackgrounds[0] && heroBgUrl !== '' && !animatedBackgrounds.includes(heroBgUrl);

  return (
    <>
    {/* HERO SECTION - pb-0 to let image touch bottom */}
    <section className="relative pt-8 md:pt-12 pb-0 overflow-hidden bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg min-h-[60vh] flex flex-col justify-between">
      
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-blue/10 via-brand-green/10 to-brand-blue/10 animate-gradient-xy"></div>
      
      {/* Animated Background Slideshow */}
      {!isManualOverride && animatedBackgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
              <img src={bg} alt="Office Background" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-transparent to-brand-green/20"></div>
          </div>
      ))}

      {/* Manual Background (if selected) */}
      {isManualOverride && (
           <div className="absolute inset-0 z-0">
             {heroBgUrl ? (
                <>
                 <img src={heroBgUrl} alt="Hero Background" className="w-full h-full object-cover opacity-50" />
                </>
             ) : (
                 <div className="w-full h-full bg-grid-pattern"></div>
             )}
           </div>
      )}

      <FloatingIconsBackground />

      <div className="container mx-auto px-4 relative z-20 flex-grow flex flex-col">
        {/* mt-auto pushes it down. mb-0 ensures it touches bottom. */}
        <div className="relative w-full max-w-[90rem] mx-auto mt-auto mb-0 z-10 group/image">
            {/* Multi-color Gradient Glow Behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue/40 via-brand-green/40 to-brand-blue/40 rounded-[2rem] blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-brand-green/50 to-brand-blue/50 rounded-[2rem] blur-xl opacity-70"></div>
            
            <div className="relative bg-gradient-to-br from-white/20 via-white/10 to-brand-blue-bg/20 p-2 rounded-t-[1.8rem] rounded-b-none border-[3px] border-b-0 border-gradient-to-r from-brand-green via-brand-blue to-brand-blue shadow-2xl backdrop-blur-sm" style={{ borderImage: 'linear-gradient(to right, #16a34a, #1E40AF, #1E40AF) 1' }}>
                 {/* Panoramic Height */}
                 <div className="rounded-t-2xl rounded-b-none overflow-hidden bg-slate-100 relative h-[240px] md:h-[280px]">
                    <img 
                        src={dashboardUrl} 
                        alt="Dashboard Interface"
                        className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                    />
                     {/* Reflection/Glare Effect */}
                     <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                </div>
            </div>
        </div>

      </div>
    </section>

    {/* Enhanced Stats Section with Vibrant Gradients */}
    <section className="bg-gradient-to-br from-brand-blue-bg via-brand-blue-bg/50 to-brand-green-bg py-20 border-y border-slate-200/50 relative z-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <span className="inline-block text-brand-green font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-5 py-2 rounded-full border-2 border-brand-green/30 shadow-md">
                  إحصائيات
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
                {stats.map((stat) => {
                    const Icon = iconMap[stat.icon];
                    const variant = colorVariants[stat.color];
                    const gradientMap: Record<string, string> = {
                        blue: 'from-brand-blue to-brand-blue/90',
                        emerald: 'from-brand-green to-brand-green/90',
                        indigo: 'from-brand-blue to-brand-blue/90',
                        violet: 'from-brand-blue to-brand-blue/90',
                    };
                    const bgGradientMap: Record<string, string> = {
                        blue: 'from-brand-blue-bg to-brand-blue-bg/80',
                        emerald: 'from-brand-green-bg to-brand-green-bg/80',
                        indigo: 'from-brand-blue-bg to-brand-blue-bg/80',
                        violet: 'from-brand-blue-bg to-brand-blue-bg/80',
                    };
                    
                    return (
                        <div 
                            key={stat.id} 
                            className={`p-8 rounded-3xl bg-gradient-to-br ${bgGradientMap[stat.color]} border-2 border-white/80 transition-all duration-300 group hover:-translate-y-3 hover:shadow-2xl hover:scale-105 ${variant.container}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 bg-gradient-to-br ${gradientMap[stat.color]} text-white shadow-xl`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            
                            <div className="space-y-2">
                                <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${gradientMap[stat.color]} bg-clip-text text-transparent tracking-tight`}>
                                    {stat.value}
                                </div>
                                <div className="text-slate-700 text-sm font-bold">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
    
    <section id="features-summary" className="py-24 bg-gradient-to-br from-white via-brand-blue-bg/30 to-brand-green-bg/30">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <span className="inline-block text-brand-green font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-brand-green-bg to-brand-blue-bg px-5 py-2 rounded-full border-2 border-brand-green/30 shadow-md mb-4">
                  المميزات الرئيسية
                </span>
                <h2 className="text-4xl md:text-5xl font-black mb-4">
                  <span className="bg-gradient-to-r from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">
                    كل ما تحتاجه في مكان واحد
                  </span>
                </h2>
                <p className="text-slate-700 max-w-2xl mx-auto text-lg leading-relaxed font-medium">صممنا Stock.Pro ليغنيك عن استخدام برامج متعددة. نظام واحد متكامل يغطي جميع احتياجاتك.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {featureSummaries.map((feature, index) => {
                    const colorGradients = [
                        'from-brand-blue-bg to-brand-blue-bg/80',
                        'from-brand-green-bg to-brand-green-bg/80',
                        'from-brand-blue-bg to-brand-blue-bg/80',
                        'from-brand-blue-bg to-brand-blue-bg/80',
                    ];
                    return (
                        <div key={feature.id} className="transform transition-all duration-300 hover:scale-105">
                            <FeatureSummaryCard 
                              feature={feature}
                              onOpenDetails={(f) => setSelectedFeature(f)}
                              gradientClass={colorGradients[index % colorGradients.length]}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    </section>

    <TestimonialsSection />
    
    <CallToActionSection setPage={setPage} />

    <Modal 
        isOpen={!!selectedFeature} 
        onClose={() => setSelectedFeature(null)}
    >
        {selectedFeature && (
            <div className="text-right">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                    {(() => {
                        const Icon = iconMap[selectedFeature.icon];
                        return <div className="bg-brand-blue-bg p-3 rounded-xl"><Icon className="w-8 h-8 text-brand-blue" /></div>
                    })()}
                    <h3 className="text-2xl font-bold text-brand-dark">{selectedFeature.title}</h3>
                </div>
                
                <div className="space-y-6">
                    <p className="text-slate-600 text-lg leading-relaxed">
                        يتميز هذا القسم بـ {selectedFeature.description}، وهو مصمم خصيصاً لتلبية احتياجات السوق المحلي.
                    </p>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-brand-dark mb-4">تفاصيل إضافية:</h4>
                        <ul className="space-y-3">
                            {[1, 2, 3].map((_, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-xs font-bold">✓</span>
                                    ميزة تفصيلية رقم {i + 1} تتعلق بـ {selectedFeature.title}.
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setSelectedFeature(null)}
                        className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg hover:bg-slate-50 transition font-medium"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        )}
    </Modal>
    </>
  );
};

export default HomePage;
