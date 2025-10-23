import React from 'react';
import type { CompanyInfo } from '../../../types';

interface ReportHeaderProps {
  title: string;
  companyInfo: CompanyInfo;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ title, companyInfo }) => (
  <div className="border-2 border-brand-blue rounded-lg mb-4 p-4 bg-white">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        {companyInfo.logo && <img src={companyInfo.logo} alt="Company Logo" className="h-20 w-auto object-contain" />}
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{companyInfo.name}</h2>
          <p className="text-sm text-gray-600">{companyInfo.address}</p>
          <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
        </div>
      </div>
      <div className="text-left">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <div className="text-sm mt-2">
            <p><span className="font-semibold">الرقم الضريبي:</span> {companyInfo.taxNumber}</p>
            <p><span className="font-semibold">السجل التجاري:</span> {companyInfo.commercialReg}</p>
        </div>
      </div>
    </div>
  </div>
);

export default ReportHeader;
