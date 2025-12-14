import React from 'react';
import { AlertTriangleIcon, TrendingUpIcon } from '../icons';

interface LimitWarningProps {
  resourceName: string;
  current: number;
  limit: number;
  percentage: number;
  onUpgradeClick: () => void;
}

const LimitWarning: React.FC<LimitWarningProps> = ({
  resourceName,
  current,
  limit,
  percentage,
  onUpgradeClick,
}) => {
  // Don't show if below 80%
  if (percentage < 80) return null;

  const isAtLimit = percentage >= 100;
  const isNearLimit = percentage >= 80 && percentage < 100;

  const getResourceNameArabic = (name: string): string => {
    const names: Record<string, string> = {
      users: 'المستخدمين',
      branches: 'الفروع',
      stores: 'المخازن',
      safes: 'الخزائن',
      banks: 'البنوك',
      invoicesPerMonth: 'الفواتير الشهرية',
      customers: 'العملاء',
      suppliers: 'الموردين',
      items: 'الأصناف',
      priceQuotationsPerMonth: 'عروض الأسعار الشهرية',
      financialVouchersPerMonth: 'السندات المالية الشهرية',
      currentAccounts: 'الحسابات الجارية',
      expenseRevenuePerMonth: 'المصروفات والإيرادات الشهرية',
      receivableAccounts: 'الأرصدة المدينة',
      payableAccounts: 'الأرصدة الدائنة',
    };
    return names[name] || name;
  };

  if (isAtLimit) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4 animate-pulse">
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-800 mb-1">
              وصلت إلى الحد الأقصى!
            </h4>
            <p className="text-red-700 text-sm mb-3">
              لقد وصلت إلى الحد الأقصى لعدد {getResourceNameArabic(resourceName)} ({current} من {limit}).
              يرجى ترقية خطتك للمتابعة.
            </p>
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              <TrendingUpIcon className="w-4 h-4" />
              ترقية الخطة الآن
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isNearLimit) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-yellow-800 mb-1">
              اقتربت من الحد الأقصى
            </h4>
            <p className="text-yellow-700 text-sm mb-3">
              أنت تستخدم {current} من {limit} {getResourceNameArabic(resourceName)} ({percentage.toFixed(0)}%).
              فكر في ترقية خطتك قريباً.
            </p>
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              <TrendingUpIcon className="w-4 h-4" />
              عرض خيارات الترقية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LimitWarning;

