import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockIcon } from '../icons';

interface UpgradeRequiredProps {
  feature: string;
  currentPlan?: string;
}

const UpgradeRequired: React.FC<UpgradeRequiredProps> = ({ feature, currentPlan = 'BASIC' }) => {
  const navigate = useNavigate();

  const getPlanBadgeColor = () => {
    switch (currentPlan) {
      case 'BASIC':
        return 'bg-orange-100 text-orange-700';
      case 'GROWTH':
        return 'bg-blue-100 text-blue-700';
      case 'BUSINESS':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanName = () => {
    switch (currentPlan) {
      case 'BASIC':
        return 'الخطة الأساسية';
      case 'GROWTH':
        return 'الخطة المتوسطة';
      case 'BUSINESS':
        return 'الخطة الاحترافية';
      default:
        return 'خطة غير معروفة';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <LockIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">هذه الميزة غير متاحة</h1>
          <p className="text-orange-100 text-lg">
            تحتاج إلى ترقية خطتك للوصول إلى هذه الميزة
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Feature Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{feature}</h2>
            <p className="text-gray-600">
              هذه الميزة متاحة فقط في الخطط الأعلى
            </p>
          </div>

          {/* Current Plan Badge */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">خطتك الحالية</p>
              <div className={`inline-block px-6 py-3 rounded-lg font-bold text-lg ${getPlanBadgeColor()}`}>
                {getPlanName()}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              ماذا ستحصل بعد الترقية؟
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">الوصول إلى جميع ميزات التحليل المالي الذكي</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">تقارير مالية متقدمة ومؤشرات الأداء</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">تحليل ربحية الأصناف وكبار العملاء</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">حدود استخدام أعلى لجميع الموارد</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-bold text-lg transition-all shadow-md hover:shadow-lg"
            >
              العودة للرئيسية
            </button>
          </div>

          {/* Support Contact */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              هل لديك أسئلة؟{' '}
              <a href="/support/help-center" className="text-orange-600 hover:text-orange-700 font-bold">
                تواصل مع الدعم الفني
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeRequired;
