
import React, { useState, useEffect } from 'react';
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
            className={`px-5 py-2.5 rounded-xl transition-all duration-300 text-lg font-bold relative overflow-hidden group ${
                isActive
                ? 'text-white bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 shadow-lg shadow-blue-400/50 scale-105'
                : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
            }`}
        >
            {!isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
}

const Navbar: React.FC<NavbarProps> = ({ setPage, currentPage, logoUrl }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
        ? 'bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 backdrop-blur-xl shadow-2xl shadow-blue-500/20 py-3 border-b border-white/20' 
        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-6'
    }`}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 animate-pulse pointer-events-none"></div>
      
      <div className="container mx-auto px-6 flex justify-between items-center transition-all duration-300 relative z-10">
        <div className="flex items-center gap-4">
            <div className="relative">
                 <button onClick={() => setPage('home')} className="flex items-center space-x-3 space-x-reverse group/logo transition-transform duration-300 hover:scale-105">
                    <div className="relative p-2 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border-2 border-white/30 shadow-lg group-hover/logo:border-white/50 group-hover/logo:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-emerald-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300"></div>
                        <img src={logoUrl} alt="Stock.Pro Logo" className="h-10 w-auto object-contain brightness-110 drop-shadow-lg relative z-10" />
                    </div>
                    <span className="text-3xl font-black tracking-tight relative">
                        <span className="bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent drop-shadow-lg">Stock</span>
                        <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-teal-200 bg-clip-text text-transparent">Pro</span>
                    </span>
                </button>
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
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:shadow-blue-400/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-100 text-lg border-2 border-white/20 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative z-10">تسجيل الدخول</span>
          </button>
          <button
            onClick={() => setPage('contact')}
            className="bg-gradient-to-r from-white to-emerald-50 text-stock-secondary font-bold py-3 px-10 rounded-xl hover:from-emerald-50 hover:to-white hover:shadow-2xl hover:shadow-emerald-300/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-100 text-lg border-2 border-white/40 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative z-10 bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">اطلب عرض تجريبي</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-br from-blue-600/98 via-indigo-600/98 to-purple-600/98 backdrop-blur-xl border-t border-white/20 shadow-2xl">
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-3">
            <button
              onClick={() => {
                setPage('home');
                setMobileMenuOpen(false);
              }}
              className={`px-5 py-3 rounded-xl transition-all duration-300 text-lg font-bold text-right ${
                currentPage === 'home'
                  ? 'bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => {
                setPage('features');
                setMobileMenuOpen(false);
              }}
              className={`px-5 py-3 rounded-xl transition-all duration-300 text-lg font-bold text-right ${
                currentPage === 'features'
                  ? 'bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              المميزات
            </button>
            <button
              onClick={() => {
                setPage('pricing');
                setMobileMenuOpen(false);
              }}
              className={`px-5 py-3 rounded-xl transition-all duration-300 text-lg font-bold text-right ${
                currentPage === 'pricing'
                  ? 'bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              الأسعار
            </button>
            <button
              onClick={() => {
                setPage('contact');
                setMobileMenuOpen(false);
              }}
              className={`px-5 py-3 rounded-xl transition-all duration-300 text-lg font-bold text-right ${
                currentPage === 'contact'
                  ? 'bg-gradient-to-r from-blue-600 via-emerald-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              تواصل معنا
            </button>
            <div className="pt-4 border-t border-white/20 flex flex-col gap-3">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center"
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => {
                  setPage('contact');
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-white to-emerald-50 text-stock-secondary font-bold py-3 px-6 rounded-xl hover:from-emerald-50 hover:to-white transition-all duration-300 text-center"
              >
                <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">اطلب عرض تجريبي</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
