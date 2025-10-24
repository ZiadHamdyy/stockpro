import { useState, useEffect } from 'react';
import { useGetCompanyQuery, useUpsertCompanyMutation } from '../store/slices/companyApiSlice';
import type { CompanyInfo } from '../../types';
import { useToast } from '../common/ToastProvider';

export const useCompanyData = () => {
  const { data: company, isLoading: isFetching, error: fetchError } = useGetCompanyQuery();
  const [upsertCompany, { isLoading: isSaving }] = useUpsertCompanyMutation();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CompanyInfo>({
    name: '',
    activity: '',
    address: '',
    phone: '',
    taxNumber: '',
    commercialReg: '',
    currency: 'SAR',
    logo: null,
    capital: 0,
    vatRate: 15,
    isVatEnabled: true,
  });

  const [vatRate, setVatRate] = useState(15);
  const [isVatEnabled, setIsVatEnabled] = useState(true);

  // Update form data when company data is fetched
  useEffect(() => {
    if (company) {
      setFormData(company);
      setVatRate(company.vatRate);
      setIsVatEnabled(company.isVatEnabled);
    }
  }, [company]);

  const handleFieldChange = (field: keyof CompanyInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, logo: null }));
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Only send logoPath if it's a file path, not a base64 string
      // Base64 logos are too large and should be uploaded separately if needed
      const logoPath = formData.logo && !formData.logo.startsWith('data:') 
        ? formData.logo 
        : undefined;

      await upsertCompany({
        name: formData.name,
        activity: formData.activity,
        address: formData.address,
        phone: formData.phone,
        taxNumber: formData.taxNumber,
        commercialReg: formData.commercialReg,
        currency: formData.currency,
        capital: formData.capital,
        vatRate: vatRate,
        isVatEnabled: isVatEnabled,
        logoPath: logoPath,
      }).unwrap();

      showToast('تم حفظ البيانات بنجاح!');
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ البيانات');
      console.error('Error saving company data:', error);
    }
  };

  return {
    company: formData,
    vatRate,
    setVatRate,
    isVatEnabled,
    setIsVatEnabled,
    isLoading: isFetching || isSaving,
    handleFieldChange,
    handleLogoChange,
    removeLogo,
    handleSubmit,
    fetchError,
  };
};

