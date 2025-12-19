
import React, { useState, useEffect, useRef } from 'react';
import { iconMap, IconName, ArrowLeftIcon, QuoteIcon, UsersIcon, ServerIcon, GlobeIcon, ChartBarIcon, CurrencyDollarIcon, CalculatorIcon, PieChartIcon, TrendingUpIcon, DocumentTextIcon } from './icons/IconCollection';
import { Page, ImageKey, FeatureSummary, StatItem } from './Landing';
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
            <div className="absolute top-[15%] right-[8%] text-emerald-500 opacity-90 animate-float-medium">
                <div className="bg-white p-4 rounded-full shadow-lg shadow-emerald-100 border border-emerald-50">
                    <CurrencyDollarIcon className="w-12 h-12" />
                </div>
            </div>
             {/* Icon 3: Calculator - Bottom Left - Blue (Tech) */}
            <div className="absolute bottom-[25%] left-[15%] text-blue-500 opacity-80 animate-float-fast">
                <div className="bg-white p-3 rounded-2xl shadow-lg shadow-blue-100 border border-blue-50">
                    <CalculatorIcon className="w-10 h-10 transform -rotate-6" />
                </div>
            </div>
             {/* Icon 4: Pie Chart - Bottom Right - Purple (Analytics) */}
             <div className="absolute top-[40%] right-[15%] text-purple-500 opacity-80 animate-float-slow">
                <div className="bg-white p-2 rounded-xl shadow-lg shadow-purple-100 border border-purple-50">
                    <PieChartIcon className="w-8 h-8 transform rotate-6" />
                </div>
            </div>
             {/* Icon 5: Trending Up - Center Left - Teal (Growth) */}
             <div className="absolute top-[35%] left-[2%] text-teal-500 opacity-60 animate-float-medium">
                <TrendingUpIcon className="w-8 h-8 transform -rotate-12" />
            </div>
        </div>
    );
};

// --- Editable Text Component ---
const EditableText: React.FC<{
  value: string;
  onSave: (newValue: string) => void;
  multiline?: boolean;
  className?: string;
}> = ({ value, onSave, multiline = false, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      multiline ? textareaRef.current?.focus() : inputRef.current?.focus();
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    setIsEditing(false);
    onSave(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border border-stock-primary rounded-md p-1 w-full resize-none outline-none ring-2 ring-stock-primary/20`}
        rows={3}
      />
    ) : (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border border-stock-primary rounded-md p-1 w-full outline-none ring-2 ring-stock-primary/20`}
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={`${className} cursor-pointer border border-transparent hover:border-dashed hover:border-gray-300 hover:bg-white/50 rounded px-1 transition-colors`}>
      {value}
    </div>
  );
};

// --- Feature Summary Card ---
const FeatureSummaryCard: React.FC<{
  feature: FeatureSummary;
  onUpdate: (id: number, updatedValues: Partial<FeatureSummary>) => void;
  onOpenDetails: (feature: FeatureSummary) => void;
}> = ({ feature, onUpdate, onOpenDetails }) => {
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const Icon = iconMap[feature.icon];
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsIconPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  const handleIconChange = (newIcon: IconName) => {
    onUpdate(feature.id, { icon: newIcon });
    setIsIconPickerOpen(false);
  };

  return (
    <div 
        className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300 relative group cursor-pointer"
        onClick={(e) => {
             if (!(e.target as HTMLElement).closest('input') && 
                 !(e.target as HTMLElement).closest('textarea') &&
                 !(e.target as HTMLElement).closest('.icon-picker-trigger')) {
                 onOpenDetails(feature);
             }
        }}
    >
      <div className="relative inline-block mb-6 icon-picker-trigger">
        <div 
          className="p-4 bg-blue-50 text-stock-primary rounded-2xl transition-all duration-300 group-hover:bg-stock-primary group-hover:text-white group-hover:scale-110 shadow-inner"
          onClick={(e) => {
              e.stopPropagation();
              setIsIconPickerOpen(prev => !prev);
          }}
        >
          <Icon className="w-8 h-8" />
        </div>
        
        {isIconPickerOpen && (
          <div ref={pickerRef} onClick={(e) => e.stopPropagation()} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border rounded-xl shadow-xl p-3 z-30 grid grid-cols-3 gap-2 w-48">
            {(Object.keys(iconMap) as IconName[]).map(iconName => {
              const PickerIcon = iconMap[iconName];
              return (
                <button 
                  key={iconName}
                  onClick={() => handleIconChange(iconName)}
                  className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition ${feature.icon === iconName ? 'bg-blue-50 text-stock-primary' : ''}`}
                >
                  <PickerIcon className="w-6 h-6" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
          <EditableText
              value={feature.title}
              onSave={(newValue) => onUpdate(feature.id, { title: newValue })}
              className="text-xl font-bold mb-3 text-stock-dark"
          />
          <EditableText
              value={feature.description}
              onSave={(newValue) => onUpdate(feature.id, { description: newValue })}
              className="text-slate-500 leading-relaxed text-sm"
              multiline
          />
      </div>
    </div>
  );
};

// --- Testimonials Section ---
const TestimonialsSection = () => (
    <section className="py-24 bg-blue-50 border-t border-blue-100">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider bg-emerald-100/50 px-4 py-1.5 rounded-full border border-emerald-100">قصص نجاح</span>
                <h2 className="text-3xl md:text-4xl font-black text-stock-dark mt-4">شركاء النجاح</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { name: "أحمد العلي", role: "المدير التنفيذي - شركة النور", text: "دقة في الحسابات وسهولة في الاستخدام. هذا بالضبط ما كنا نبحث عنه." },
                    { name: "سارة محمد", role: "متجر أزياء", text: "نظام نقاط البيع والمخزون مترابط بشكل لا يصدق. وفر علينا ساعات من العمل اليدوي." },
                    { name: "خالد عبدالله", role: "مدير مالي", text: "التقارير المالية تصدر بضغطة زر، مما يجعل اتخاذ القرارات أسرع وأدق." }
                ].map((t, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 relative hover:border-stock-primary/20 hover:shadow-lg transition-all duration-300">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-stock-primary font-bold shadow-sm">
                                {t.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-stock-dark text-sm">{t.name}</h4>
                                <p className="text-xs text-slate-500">{t.role}</p>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">"{t.text}"</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- Call To Action Section ---
const CallToActionSection = ({ setPage }: { setPage: (page: Page) => void }) => (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-200 border-t border-blue-200">
         <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px), linear-gradient(90deg, #bfdbfe 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
         </div>
         <div className="container mx-auto px-6 relative z-10 text-center">
             <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-stock-dark">ابدأ رحلة النمو اليوم</h2>
             <p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">نظام محاسبي متكامل ينمو مع نمو أعمالك، مصمم خصيصاً للشركات الطموحة.</p>
             <button 
                onClick={() => setPage('pricing')}
                className="bg-stock-primary text-white font-bold py-4 px-12 rounded-xl text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 border-2 border-transparent hover:scale-105"
            >
                 أنشئ حسابك المجاني
             </button>
         </div>
    </section>
);

// --- Main Component ---

interface HomePageProps {
  setPage: (page: Page) => void;
  heroBgUrl: string;
  dashboardUrl: string;
  onImageUpload: (key: ImageKey, file: File) => void;
  onImageSelect: (key: ImageKey, url: string) => void;
  featureSummaries: FeatureSummary[];
  onFeatureSummaryChange: (id: number, updatedValues: Partial<FeatureSummary>) => void;
  stats: StatItem[];
  onStatChange: (id: number, updatedValues: Partial<StatItem>) => void;
}

// Updated with VERY PROFESSIONAL corporate backgrounds
const animatedBackgrounds = [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop', // Blue Skyscrapers (Corporate/Growth)
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop', // Modern Office Desk (Clean/Professional)
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop' // Finance/Numbers (Direct Relevance)
];

const colorVariants: Record<string, { container: string, iconBg: string, iconText: string }> = {
    blue: { container: "hover:border-blue-300 hover:shadow-blue-100", iconBg: "bg-blue-50", iconText: "text-blue-600" },
    emerald: { container: "hover:border-emerald-300 hover:shadow-emerald-100", iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
    indigo: { container: "hover:border-indigo-300 hover:shadow-indigo-100", iconBg: "bg-indigo-50", iconText: "text-indigo-600" },
    violet: { container: "hover:border-violet-300 hover:shadow-violet-100", iconBg: "bg-violet-50", iconText: "text-violet-600" },
};

const HomePage: React.FC<HomePageProps> = ({ setPage, heroBgUrl, dashboardUrl, onImageUpload, onImageSelect, featureSummaries, onFeatureSummaryChange, stats, onStatChange }) => {
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
    <section className="relative pt-32 pb-0 overflow-hidden bg-white min-h-screen flex flex-col justify-between">
      
      {/* Animated Background Slideshow */}
      {!isManualOverride && animatedBackgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`}
          >
              <img src={bg} alt="Office Background" className="w-full h-full object-cover" />
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
        
        {/* Flex Layout for Far Right / Far Left positioning with reduced width and high transparency */}
        <div className="flex flex-col md:flex-row justify-between items-stretch w-full px-0 md:px-4 mt-12 mb-auto gap-4 md:gap-20">
            
            {/* Right Box (First in RTL) */}
            <div className="w-full md:w-[42%] max-w-xl bg-white/[0.02] backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl relative overflow-hidden text-right flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                <div className="relative z-10">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-stock-dark text-[10px] font-bold mb-4 shadow-sm backdrop-blur-md">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-stock-secondary"></span>
                        </span>
                        <span className="drop-shadow-md">نظام محاسبي معتمد</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-stock-dark drop-shadow-lg">
                    تحكم في <span className="text-blue-600 drop-shadow-md">أرقامك</span> <br/>
                    وضاعف <span className="text-emerald-600 drop-shadow-md">أرباحك</span>
                    </h1>
                </div>
            </div>

            {/* Left Box (Second in RTL) */}
            <div className="w-full md:w-[42%] max-w-xl bg-white/[0.02] backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl relative overflow-hidden text-right flex flex-col justify-center transition-all hover:bg-white/[0.05]">
                <div className="relative z-10">
                    <p className="text-lg text-slate-900 leading-relaxed mb-8 font-bold drop-shadow-md">
                    منصة Stock.Pro تمنحك الرؤية الكاملة لإدارة المخزون، المبيعات، والعملاء بدقة متناهية.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-start gap-4 w-full">
                        <button
                            onClick={() => setPage('pricing')}
                            className="bg-stock-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-sm border-2 border-transparent flex-1 justify-center"
                        >
                            جرب مجاناً
                        </button>
                        <button
                            onClick={() => setPage('features')}
                            className="bg-white/80 text-stock-dark font-bold py-3 px-8 rounded-xl hover:bg-white transition-all border border-white/50 shadow-lg text-sm flex items-center justify-center gap-2 flex-1 backdrop-blur-sm"
                        >
                            شاهد الفيديو
                        </button>
                    </div>
                </div>
            </div>

        </div>

        {/* Dashboard Preview - Moved to Absolute Bottom */}
        {/* mt-auto pushes it down. mb-0 ensures it touches bottom. */}
        <div className="relative w-full max-w-[90rem] mx-auto mt-auto mb-0 z-10 group/image">
            {/* Green Glow Behind */}
            <div className="absolute -inset-2 bg-emerald-500/60 rounded-[2rem] blur-xl opacity-50 animate-pulse"></div>
            
            <div className="relative bg-white/10 p-2 rounded-t-[1.8rem] rounded-b-none border-[3px] border-b-0 border-emerald-500/80 shadow-2xl backdrop-blur-sm">
                 {/* Panoramic Height */}
                 <div className="rounded-t-2xl rounded-b-none overflow-hidden bg-slate-100 relative h-[240px] md:h-[280px]">
                    <img 
                        src={dashboardUrl} 
                        alt="Dashboard Interface"
                        className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                    />
                     {/* Reflection/Glare Effect */}
                     <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

                    {/* Edit Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity z-20 bg-black/20 backdrop-blur-sm">
                         <input 
                            type="file" 
                            id="dashUpload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && onImageUpload('dashboard', e.target.files[0])}
                        />
                        <label htmlFor="dashUpload" className="cursor-pointer bg-white text-stock-dark font-bold py-3 px-8 rounded-full shadow-xl hover:bg-blue-50 transition border border-gray-200">
                            تغيير صورة البرنامج
                        </label>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>

    {/* Stats Section with Professional Colors and Editing */}
    <section className="bg-white py-16 border-y border-slate-100 relative z-20">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                {stats.map((stat) => {
                    const Icon = iconMap[stat.icon];
                    const variant = colorVariants[stat.color];
                    
                    return (
                        <div key={stat.id} className={`p-6 rounded-2xl bg-white border border-slate-100 transition-all duration-300 group hover:-translate-y-1 ${variant.container}`}>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${variant.iconBg} ${variant.iconText}`}>
                                <Icon className="w-7 h-7" />
                            </div>
                            
                            <div className="space-y-1">
                                <EditableText
                                    value={stat.value}
                                    onSave={(val) => onStatChange(stat.id, { value: val })}
                                    className="text-3xl font-black text-slate-900 tracking-tight"
                                />
                                <EditableText
                                    value={stat.label}
                                    onSave={(val) => onStatChange(stat.id, { label: val })}
                                    className="text-slate-500 text-sm font-bold"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </section>
    
    <section id="features-summary" className="py-24 bg-blue-50">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-stock-dark mb-4">كل ما تحتاجه في مكان واحد</h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">صممنا Stock.Pro ليغنيك عن استخدام برامج متعددة. نظام واحد متكامل.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featureSummaries.map((feature) => (
                    <FeatureSummaryCard 
                      key={feature.id} 
                      feature={feature}
                      onUpdate={onFeatureSummaryChange}
                      onOpenDetails={(f) => setSelectedFeature(f)}
                    />
                ))}
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
                        return <div className="bg-blue-50 p-3 rounded-xl"><Icon className="w-8 h-8 text-stock-primary" /></div>
                    })()}
                    <h3 className="text-2xl font-bold text-stock-dark">{selectedFeature.title}</h3>
                </div>
                
                <div className="space-y-6">
                    <p className="text-slate-600 text-lg leading-relaxed">
                        يتميز هذا القسم بـ {selectedFeature.description}، وهو مصمم خصيصاً لتلبية احتياجات السوق المحلي.
                    </p>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-stock-dark mb-4">تفاصيل إضافية:</h4>
                        <ul className="space-y-3">
                            {[1, 2, 3].map((_, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stock-secondary/10 text-stock-secondary flex items-center justify-center text-xs font-bold">✓</span>
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
