import React from "react";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";

interface InvoiceHeaderProps {
  branchName?: string;
  userName?: string;
  title?: string;
}

const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ branchName, userName, title }) => {
  const { data: companyInfo, isLoading, error } = useGetCompanyQuery();

  if (isLoading) {
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

  if (error || !companyInfo) {
    return (
      <div className="flex justify-center items-center p-4 bg-white">
        <p className="text-red-500">خطأ في تحميل بيانات الشركة</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between items-start">
        <div className="text-sm">
          <p>
            <span className="font-semibold">الرقم الضريبي:</span>{" "}
            {companyInfo.taxNumber}
          </p>
          <p>
            <span className="font-semibold">السجل التجاري:</span>{" "}
            {companyInfo.commercialReg}
          </p>
          {(branchName || userName) && (
            <div className="hidden print:block mt-2 pt-2 border-t border-gray-300">
              {branchName && (
                <p>
                  <span className="font-semibold">الفرع:</span> {branchName}
                </p>
              )}
              {userName && (
                <p>
                  <span className="font-semibold">المستخدم:</span> {userName}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="text-right text-sm">
          {title && (
            <h1 className="text-3xl font-bold text-brand-dark mb-3">
              {title}
            </h1>
          )}
          {companyInfo.logo && (
            <img
              src={companyInfo.logo}
              alt="Company Logo"
              className="h-20 w-auto object-contain mb-2"
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
      </div>
    </div>
  );
};

export default InvoiceHeader;
