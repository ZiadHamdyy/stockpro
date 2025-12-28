import React from "react";
import { HomeIcon, ShieldIcon, BarChartIcon } from "../../icons";
import { Link } from "react-router-dom";
import { useSubscription } from "../../hook/useSubscription";

interface SubscriptionDataProps {
  title: string;
}

const SubscriptionData: React.FC<SubscriptionDataProps> = ({ title }) => {
  const {
    subscription,
    limits,
    usage,
    isLoading: subscriptionLoading,
  } = useSubscription();

  const planNames: Record<string, string> = {
    BASIC: "الأساسية",
    GROWTH: "المتوسطة",
    BUSINESS: "الاحترافية",
  };

  const statusNames: Record<string, string> = {
    ACTIVE: "نشط",
    EXPIRED: "منتهي",
    CANCELLED: "ملغي",
    TRIAL: "تجريبي",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    EXPIRED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
    TRIAL: "bg-blue-100 text-blue-700",
  };

  const planColors: Record<string, string> = {
    BASIC: "bg-orange-100 text-orange-700",
    GROWTH: "bg-blue-100 text-blue-700",
    BUSINESS: "bg-purple-100 text-purple-700",
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "غير محدد";
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "غير محدد";
    }
  };

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const renderUsageCard = (
    label: string,
    current: number,
    limit: number | boolean,
    isBoolean: boolean = false
  ) => {
    if (isBoolean) {
      const enabled = limit as boolean;
      return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {enabled ? "مفعل" : "غير مفعل"}
            </span>
          </div>
        </div>
      );
    }

    const numericLimit = limit as number;
    const percentage = getUsagePercentage(current, numericLimit);
    const isUnlimited = numericLimit === -1;

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mb-2">
          {current} / {isUnlimited ? "∞" : numericLimit}
        </p>
        {!isUnlimited && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        {!isUnlimited && (
          <p className="text-xs text-gray-500 mt-1">
            {percentage.toFixed(1)}% مستخدم
          </p>
        )}
      </div>
    );
  };

  if (subscriptionLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
          <Link
            to="/dashboard"
            title="العودة للرئيسية"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <HomeIcon className="w-6 h-6 text-brand-dark" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          <span className="mr-3 text-gray-600">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
          <Link
            to="/dashboard"
            title="العودة للرئيسية"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <HomeIcon className="w-6 h-6 text-brand-dark" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        </div>
        <div className="text-center py-12">
          <ShieldIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">لا يوجد اشتراك نشط</p>
          <p className="text-sm text-gray-500">
            يرجى التواصل مع المسؤول لتفعيل الاشتراك
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <Link
          to="/dashboard"
          title="العودة للرئيسية"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <HomeIcon className="w-6 h-6 text-brand-dark" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
      </div>

      {/* Subscription Basic Info */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShieldIcon className="w-6 h-6 text-brand-blue" />
          معلومات الاشتراك
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">نوع الخطة</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                planColors[subscription.planType] || "bg-gray-100 text-gray-700"
              }`}
            >
              {planNames[subscription.planType] || subscription.planType}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">حالة الاشتراك</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                statusColors[subscription.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {statusNames[subscription.status] || subscription.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">تاريخ البداية</p>
            <p className="text-base font-bold text-gray-800">
              {formatDate(subscription.startDate)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">تاريخ النهاية</p>
            <p className="text-base font-bold text-gray-800">
              {formatDate(subscription.endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Limits and Usage */}
      {limits && usage && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChartIcon className="w-6 h-6 text-brand-blue" />
            حدود الخطة والاستخدام الحالي
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderUsageCard("المستخدمين", usage.users, limits.users)}
            {renderUsageCard("الفروع", usage.branches, limits.branches)}
            {renderUsageCard("المخازن", usage.stores, limits.stores)}
            {renderUsageCard("الخزنات", usage.safes, limits.safes)}
            {renderUsageCard("البنوك", usage.banks, limits.banks)}
            {renderUsageCard(
              "الفواتير (آخر 30 يوم)",
              usage.invoicesThisMonth,
              limits.invoicesPerMonth
            )}
            {renderUsageCard("العملاء", usage.customers, limits.customers)}
            {renderUsageCard("الموردين", usage.suppliers, limits.suppliers)}
            {renderUsageCard("الأصناف", usage.items, limits.items)}
            {renderUsageCard(
              "عروض الأسعار (آخر 30 يوم)",
              usage.priceQuotationsThisMonth,
              limits.priceQuotationsPerMonth
            )}
            {renderUsageCard(
              "السندات المالية (آخر 30 يوم)",
              usage.financialVouchersThisMonth,
              limits.financialVouchersPerMonth
            )}
            {renderUsageCard(
              "الحسابات الجارية",
              usage.currentAccounts,
              limits.currentAccounts
            )}
            {renderUsageCard(
              "المصروفات والإيرادات (آخر 30 يوم)",
              usage.expenseRevenueThisMonth,
              limits.expenseRevenuePerMonth
            )}
            {renderUsageCard(
              "الأرصدة المدينة",
              usage.receivableAccounts,
              limits.receivableAccounts
            )}
            {renderUsageCard(
              "الأرصدة الدائنة",
              usage.payableAccounts,
              limits.payableAccounts
            )}
            {renderUsageCard(
              "التحليل المالي الذكي",
              0,
              limits.financialAnalysisEnabled,
              true
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>ملاحظة:</strong> هذه المعلومات تعرض حالة الاشتراك الحالي
            للشركة. للترقية أو التعديل، يرجى التواصل مع المسؤول.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionData;

