import React from "react";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";
import type { CompanyInfo } from "../../types";

interface DocumentHeaderProps {
  companyInfo?: CompanyInfo;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({ companyInfo: propCompanyInfo }) => {
  const { data: queryCompanyInfo, isLoading, error } = useGetCompanyQuery();
  
  // Use prop if provided, otherwise use query result
  const companyInfo = propCompanyInfo || queryCompanyInfo;

  if (isLoading && !propCompanyInfo) {
    return (
      <div className="flex justify-between items-start p-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 bg-gray-200 animate-pulse rounded"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if ((error || !companyInfo) && !propCompanyInfo) {
    return (
      <div className="flex justify-center items-center p-4 bg-white">
        <p className="text-red-500">خطأ في تحميل بيانات الشركة</p>
      </div>
    );
  }

  if (!companyInfo) {
    return null;
  }

  return (
    <div className="flex justify-between items-start p-4 bg-white">
      <div className="flex items-center gap-4">
        {companyInfo.logo && (
          <img
            src={companyInfo.logo}
            alt="Company Logo"
            className="h-20 w-auto object-contain"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">
            {companyInfo.name}
          </h2>
          <p className="text-sm text-gray-600">{companyInfo.address}</p>
          <p className="text-sm text-gray-600">هاتف: {companyInfo.phone}</p>
        </div>
      </div>
      <div className="text-left text-sm">
        <p>
          <span className="font-semibold">الرقم الضريبي:</span>{" "}
          {companyInfo.taxNumber}
        </p>
        <p>
          <span className="font-semibold">السجل التجاري:</span>{" "}
          {companyInfo.commercialReg}
        </p>
      </div>
    </div>
  );
};

export default DocumentHeader;

