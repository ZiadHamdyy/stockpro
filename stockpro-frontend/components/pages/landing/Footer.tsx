
import React from 'react';
import { TwitterIcon, FacebookIcon, LinkedInIcon, InstagramIcon } from './icons/IconCollection';
import { Page } from './Landing';

interface FooterProps {
  logoUrl: string;
  setPage?: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ logoUrl, setPage }) => {
  const handleNavClick = (page: Page) => {
      if (setPage) setPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-sky-100 text-slate-700 pt-20 pb-10 border-t border-blue-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1">
                <div className="flex items-center mb-6 space-x-3 space-x-reverse">
                    <div className="bg-white p-1.5 rounded-lg border border-blue-100 shadow-sm">
                        <img src={logoUrl} alt="Stock.Pro Logo" className="h-8 w-8 object-contain" />
                    </div>
                    <span className="text-2xl font-black text-slate-800">Stock<span className="text-stock-primary">Pro</span></span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    نظام محاسبي سحابي متكامل يجمع بين السهولة والقوة. صمم خصيصاً لتمكين الشركات الصغيرة والمتوسطة من النمو بثقة.
                </p>
                <div className="flex space-x-4 space-x-reverse">
                    <a href="#" className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-slate-400 hover:bg-stock-primary hover:text-white hover:border-stock-primary transition duration-300 shadow-sm"><TwitterIcon className="w-5 h-5" /></a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition duration-300 shadow-sm"><FacebookIcon className="w-5 h-5" /></a>
                    <a href="#" className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center text-slate-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition duration-300 shadow-sm"><LinkedInIcon className="w-5 h-5" /></a>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h4 className="text-lg font-bold mb-6 text-stock-dark">روابط سريعة</h4>
                <ul className="space-y-4 text-sm text-slate-500">
                    <li><button onClick={() => handleNavClick('home')} className="hover:text-stock-primary transition hover:translate-x-1 duration-200">الرئيسية</button></li>
                    <li><button onClick={() => handleNavClick('features')} className="hover:text-stock-primary transition hover:translate-x-1 duration-200">المميزات</button></li>
                    <li><button onClick={() => handleNavClick('pricing')} className="hover:text-stock-primary transition hover:translate-x-1 duration-200">باقات الأسعار</button></li>
                    <li><button onClick={() => handleNavClick('contact')} className="hover:text-stock-primary transition hover:translate-x-1 duration-200">تواصل معنا</button></li>
                </ul>
            </div>

            {/* Resources */}
            <div>
                <h4 className="text-lg font-bold mb-6 text-stock-dark">المصادر والدعم</h4>
                <ul className="space-y-4 text-sm text-slate-500">
                    <li><a href="#" className="hover:text-stock-primary transition hover:translate-x-1 duration-200">مركز المساعدة</a></li>
                    <li><a href="#" className="hover:text-stock-primary transition hover:translate-x-1 duration-200">المدونة</a></li>
                    <li><a href="#" className="hover:text-stock-primary transition hover:translate-x-1 duration-200">سياسة الخصوصية</a></li>
                    <li><a href="#" className="hover:text-stock-primary transition hover:translate-x-1 duration-200">شروط الاستخدام</a></li>
                </ul>
            </div>

            {/* Newsletter */}
            <div>
                <h4 className="text-lg font-bold mb-6 text-stock-dark">كن على اتصال</h4>
                <p className="text-slate-500 text-sm mb-4">اشترك ليصلك كل جديد عن التحديثات والعروض.</p>
                <form className="flex flex-col gap-3">
                    <input 
                        type="email" 
                        placeholder="بريدك الإلكتروني" 
                        className="bg-white text-slate-800 px-4 py-3 rounded-lg border border-blue-100 focus:outline-none focus:border-stock-primary focus:ring-2 focus:ring-blue-50 transition text-sm shadow-sm"
                    />
                    <button type="button" className="bg-stock-primary text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition text-sm shadow-lg shadow-blue-200">
                        اشترك الآن
                    </button>
                </form>
            </div>
        </div>

        <div className="pt-8 border-t border-blue-100 text-center md:text-right flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Stock.Pro. جميع الحقوق محفوظة.</p>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
              <span>صنع بكل حب</span>
              <span className="text-red-500">❤️</span>
              <span>لرواد الأعمال</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
