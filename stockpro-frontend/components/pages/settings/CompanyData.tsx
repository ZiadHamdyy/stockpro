import React from 'react';
import type { CompanyInfo } from '../../../types';
import { HomeIcon } from '../../icons';

interface CompanyDataProps {
  title: string;
  vatRate: number;
  setVatRate: (rate: number) => void;
  isVatEnabled: boolean;
  setIsVatEnabled: (enabled: boolean) => void;
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  onGoHome: () => void;
}

const CompanyData: React.FC<CompanyDataProps> = ({ title, vatRate, setVatRate, isVatEnabled, setIsVatEnabled, companyInfo, setCompanyInfo, onGoHome }) => {
  const inputStyle = "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setCompanyInfo({ 
      ...companyInfo, 
      [id]: id === 'capital' ? parseFloat(value) || 0 : value 
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo({ ...companyInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
      setCompanyInfo({ ...companyInfo, logo: null });
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the data to a backend.
    // For this app, the state is already updated.
    alert('تم حفظ البيانات بنجاح!');
  }


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <button onClick={onGoHome} title="العودة للرئيسية" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <HomeIcon className="w-6 h-6 text-brand-dark" />
        </button>
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم الشركة</label>
            <input type="text" id="name" value={companyInfo.name} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل اسم الشركة" />
          </div>

          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700">النشاط التجاري</label>
            <input type="text" id="activity" value={companyInfo.activity} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل النشاط التجاري" />
          </div>
          
          <div className="md:col-span-3">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">العنوان</label>
            <input type="text" id="address" value={companyInfo.address} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل العنوان بالتفصيل" />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input type="tel" id="phone" value={companyInfo.phone} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل رقم الهاتف" />
          </div>

          <div>
            <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700">الرقم الضريبي</label>
            <input type="text" id="taxNumber" value={companyInfo.taxNumber} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل الرقم الضريبي" />
          </div>
          
          <div>
            <label htmlFor="commercialReg" className="block text-sm font-medium text-gray-700">السجل التجاري</label>
            <input type="text" id="commercialReg" value={companyInfo.commercialReg} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل رقم السجل التجاري" />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">العملة</label>
            <select id="currency" value={companyInfo.currency} onChange={handleInfoChange} className={inputStyle}>
              <option value="SAR">الريال السعودي (SAR)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>
              <option value="EGP">الجنيه المصري (EGP)</option>
              <option value="AED">الدرهم الإماراتي (AED)</option>
            </select>
          </div>
           <div>
            <label htmlFor="capital" className="block text-sm font-medium text-gray-700">رأس المال</label>
            <input type="number" id="capital" name="capital" value={companyInfo.capital} onChange={handleInfoChange} className={inputStyle} placeholder="ادخل رأس المال" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
                <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700">ضريبة القيمة المضافة</label>
                <div className="relative mt-1">
                <input 
                    type="number" 
                    id="vatRate" 
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className={inputStyle + " pl-7 text-left"} 
                    placeholder="15" 
                    disabled={!isVatEnabled}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                </div>
            </div>
             <div className="flex items-center gap-2 pb-3">
                <input 
                    type="checkbox" 
                    id="isVatEnabled" 
                    checked={isVatEnabled} 
                    onChange={(e) => setIsVatEnabled(e.target.checked)} 
                    className="h-5 w-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" 
                />
                <label htmlFor="isVatEnabled" className="text-sm font-medium text-gray-700">تفعيل ضريبة القيمة المضافة</label>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700">شعار الشركة</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-blue border-dashed rounded-md bg-brand-blue-bg">
                {companyInfo.logo ? (
                    <div className="text-center relative">
                        <img src={companyInfo.logo} alt="Company Logo Preview" className="mx-auto h-32 w-auto" />
                        <button type="button" onClick={removeLogo} className="absolute top-0 right-0 mt-1 mr-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                    </div>
                ) : (
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-blue hover:text-blue-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue">
                                <span>ارفع ملف</span>
                                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                            </label>
                            <p className="pr-1">أو اسحبه هنا</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-gray-200 mt-6 flex justify-end">
          <button type="submit" className="px-8 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition duration-150 ease-in-out">
            حفظ البيانات
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyData;