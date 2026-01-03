import React from "react";
import { translatePermissionsToArabic } from "../../utils/permissionTranslator";
import { LockIcon } from "../icons";

interface AccessDeniedProps {
  missingPermissions?: string[];
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ missingPermissions = [] }) => {
  const missingArabic = missingPermissions.length > 0 
    ? translatePermissionsToArabic(missingPermissions)
    : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <LockIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            لا يمكنك الوصول إلى هذه الصفحة
          </h1>
          <p className="text-gray-600">
            ليس لديك الصلاحيات المطلوبة للوصول إلى هذا المحتوى
          </p>
        </div>

        {/* Missing Permissions List */}
        {missingArabic.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              الصلاحيات المطلوبة:
            </h2>
            <ul className="space-y-2">
              {missingArabic.map((permission, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-red-800"
                >
                  <span className="text-red-600 mt-1">•</span>
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm text-center">
            يرجى التواصل مع المدير لإضافة هذه الصلاحيات إلى حسابك
          </p>
        </div>

        {/* Logo at bottom */}
        <div className="mt-8 text-center">
          <img
            src="/stockpro.jpeg"
            alt="StockPro"
            className="max-w-xs h-auto mx-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
