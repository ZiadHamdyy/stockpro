
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from './Landing';

interface NavbarProps {
    setPage: (page: Page) => void;
    currentPage: Page;
    logoUrl: string;
    onLogoUpload: (file: File) => void;
    onLogoSelect: (url: string) => void;
}

const NavLink: React.FC<{
    page: Page;
    currentPage: Page;
    setPage: (page: Page) => void;
    children: React.ReactNode;
}> = ({ page, currentPage, setPage, children }) => {
    const isActive = currentPage === page;
    return (
        <button
            onClick={() => setPage(page)}
            className={`px-5 py-2 rounded-lg transition-all duration-300 text-xl font-bold ${
                isActive
                ? 'text-stock-secondary bg-white shadow-sm'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

// Blue/Green/Neutral Presets
const presetLogos = [
    { name: 'بيانات زرقاء', url: 'https://cdn-icons-png.flaticon.com/512/2920/2920326.png' }, 
    { name: 'نمو أخضر', url: 'https://cdn-icons-png.flaticon.com/512/4256/4256900.png' }, 
    { name: 'درع أزرق', url: 'https://cdn-icons-png.flaticon.com/512/2438/2438078.png' }, 
    { name: 'رسم بياني', url: 'https://cdn-icons-png.flaticon.com/512/1600/1600184.png' }, 
];

const Navbar: React.FC<NavbarProps> = ({ setPage, currentPage, logoUrl, onLogoUpload, onLogoSelect }) => {
  const navigate = useNavigate();
  const [showLogoPresets, setShowLogoPresets] = useState(false);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onLogoUpload(file);
    }
  };

  // Click outside to close presets
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (logoWrapperRef.current && !logoWrapperRef.current.contains(event.target as Node)) {
            setShowLogoPresets(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-stock-secondary/95 backdrop-blur-md shadow-md py-4' : 'bg-stock-secondary py-8'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4">
            <div className="relative group/edit" ref={logoWrapperRef}>
                 <button onClick={() => setPage('home')} className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative p-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                        <img src={logoUrl} alt="Stock.Pro Logo" className="h-10 w-auto object-contain brightness-110 drop-shadow-sm" />
                    </div>
                    <span className="text-3xl font-black text-white tracking-tight">Stock<span className="text-green-200">Pro</span></span>
                </button>
                
                {/* Hover Menu for Logo Options */}
                <div className="absolute top-full right-0 mt-2 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none group-hover/edit:pointer-events-auto z-50 flex flex-col gap-2">
                    
                    {/* File Upload */}
                    <div className="relative">
                        <input 
                            type="file" 
                            id="logoUpload" 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleFileChange} 
                        />
                        <label 
                            htmlFor="logoUpload" 
                            className="cursor-pointer bg-white text-stock-dark text-[10px] font-bold px-3 py-1.5 rounded shadow-lg hover:bg-gray-50 whitespace-nowrap block text-center border border-gray-100"
                        >
                            رفع شعار خاص
                        </label>
                    </div>

                    {/* Presets Trigger */}
                     <button
                        onClick={() => setShowLogoPresets(!showLogoPresets)}
                        className="cursor-pointer bg-stock-primary text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-lg hover:bg-blue-600 whitespace-nowrap block text-center"
                    >
                        اختر شعار جاهز
                    </button>

                    {/* Presets Dropdown */}
                    {showLogoPresets && (
                        <div className="absolute top-0 right-full mr-2 bg-white p-2 rounded-lg shadow-xl grid grid-cols-2 gap-2 w-32 border border-gray-100">
                            {presetLogos.map((preset, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => {
                                        onLogoSelect(preset.url);
                                        setShowLogoPresets(false);
                                    }}
                                    className="p-2 hover:bg-blue-50 rounded border border-gray-100 hover:border-blue-200 transition flex flex-col items-center gap-1"
                                    title={preset.name}
                                >
                                    <img src={preset.url} className="w-6 h-6 object-contain" alt={preset.name} />
                                    <span className="text-[8px] text-gray-500">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <nav className="hidden md:flex items-center gap-4">
          <NavLink page="home" currentPage={currentPage} setPage={setPage}>الرئيسية</NavLink>
          <NavLink page="features" currentPage={currentPage} setPage={setPage}>المميزات</NavLink>
          <NavLink page="pricing" currentPage={currentPage} setPage={setPage}>الأسعار</NavLink>
          <NavLink page="contact" currentPage={currentPage} setPage={setPage}>تواصل معنا</NavLink>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="bg-stock-primary text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xl border-2 border-transparent"
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setPage('contact')}
            className="bg-white text-stock-secondary font-bold py-3 px-10 rounded-full hover:bg-gray-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xl border-2 border-transparent"
          >
            اطلب عرض تجريبي
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
