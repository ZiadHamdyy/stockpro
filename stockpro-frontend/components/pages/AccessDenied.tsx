import React from "react";
import { useNavigate } from "react-router-dom";
import { HomeIcon } from "../icons";

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-brand-dark mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          الوصول مرفوض
        </h2>
        <p className="text-gray-600 mb-8">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المدير إذا
          كنت تعتقد أن هذا خطأ.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          <span>العودة إلى الرئيسية</span>
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
