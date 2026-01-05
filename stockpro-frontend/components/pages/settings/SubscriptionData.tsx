import React from "react";
import {
  HomeIcon,
  ShieldIcon,
  BarChartIcon,
  UsersIcon,
  BuildingIcon,
  BoxIcon,
  WalletIcon,
  LandmarkIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  TruckIcon,
  TagIcon,
  FileTextIcon,
  CreditCardIcon,
  DollarSignIcon,
  ActivityIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  HelpIcon,
} from "../../icons";
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

  const statusColors: Record<string, { gradient: string; border: string; text: string; badge: string }> = {
    ACTIVE: {
      gradient: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-50/80",
      border: "border-green-300",
      text: "text-green-900",
      badge: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    },
    EXPIRED: {
      gradient: "bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50",
      border: "border-red-300",
      text: "text-red-900",
      badge: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    },
    CANCELLED: {
      gradient: "bg-gradient-to-br from-gray-50 via-gray-50/80 to-slate-50",
      border: "border-gray-300",
      text: "text-gray-900",
      badge: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    },
    TRIAL: {
      gradient: "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50/80",
      border: "border-blue-300",
      text: "text-blue-900",
      badge: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white",
    },
  };

  const planColors: Record<string, { gradient: string; border: string; text: string; badge: string }> = {
    BASIC: {
      gradient: "bg-gradient-to-br from-orange-50 via-orange-50/80 to-yellow-50",
      border: "border-orange-300",
      text: "text-orange-900",
      badge: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    },
    GROWTH: {
      gradient: "bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50",
      border: "border-blue-300",
      text: "text-blue-900",
      badge: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    },
    BUSINESS: {
      gradient: "bg-gradient-to-br from-purple-50 via-purple-50/80 to-indigo-50",
      border: "border-purple-300",
      text: "text-purple-900",
      badge: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    },
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

  const getUsageColor = (percentage: number): { bg: string; text: string; border: string } => {
    if (percentage >= 100) {
      return {
        bg: "bg-gradient-to-r from-red-500 to-red-600",
        text: "text-red-700",
        border: "border-red-200",
      };
    }
    if (percentage >= 80) {
      return {
        bg: "bg-gradient-to-r from-yellow-500 to-orange-500",
        text: "text-yellow-700",
        border: "border-yellow-200",
      };
    }
    return {
      bg: "bg-gradient-to-r from-green-500 to-emerald-500",
      text: "text-green-700",
      border: "border-green-200",
    };
  };

  const getUsageCardColor = (label: string): { gradient: string; iconColor: string; border: string } => {
    const colorMap: Record<string, { gradient: string; iconColor: string; border: string }> = {
      "المستخدمين": {
        gradient: "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50/80",
        iconColor: "text-blue-600",
        border: "border-blue-200",
      },
      "الفروع": {
        gradient: "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50/80",
        iconColor: "text-purple-600",
        border: "border-purple-200",
      },
      "المخازن": {
        gradient: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-50/80",
        iconColor: "text-green-600",
        border: "border-green-200",
      },
      "الخزنات": {
        gradient: "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50/80",
        iconColor: "text-amber-600",
        border: "border-amber-200",
      },
      "البنوك": {
        gradient: "bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50/80",
        iconColor: "text-slate-600",
        border: "border-slate-200",
      },
      "الفواتير": {
        gradient: "bg-gradient-to-br from-red-50 via-rose-50 to-red-50/80",
        iconColor: "text-red-600",
        border: "border-red-200",
      },
      "العملاء": {
        gradient: "bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-50/80",
        iconColor: "text-cyan-600",
        border: "border-cyan-200",
      },
      "الموردين": {
        gradient: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50/80",
        iconColor: "text-orange-600",
        border: "border-orange-200",
      },
      "الأصناف": {
        gradient: "bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50/80",
        iconColor: "text-teal-600",
        border: "border-teal-200",
      },
      "عروض الأسعار": {
        gradient: "bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50/80",
        iconColor: "text-pink-600",
        border: "border-pink-200",
      },
      "السندات المالية": {
        gradient: "bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50/80",
        iconColor: "text-indigo-600",
        border: "border-indigo-200",
      },
      "الحسابات الجارية": {
        gradient: "bg-gradient-to-br from-violet-50 via-purple-50 to-violet-50/80",
        iconColor: "text-violet-600",
        border: "border-violet-200",
      },
      "المصروفات والإيرادات": {
        gradient: "bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/80",
        iconColor: "text-emerald-600",
        border: "border-emerald-200",
      },
      "الأرصدة المدينة": {
        gradient: "bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50/80",
        iconColor: "text-blue-600",
        border: "border-blue-200",
      },
      "الأرصدة الدائنة": {
        gradient: "bg-gradient-to-br from-red-50 via-pink-50 to-red-50/80",
        iconColor: "text-red-600",
        border: "border-red-200",
      },
      "التحليل المالي الذكي": {
        gradient: "bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50/80",
        iconColor: "text-purple-600",
        border: "border-purple-200",
      },
    };

    // Find matching color by checking if label contains any key
    for (const [key, colors] of Object.entries(colorMap)) {
      if (label.includes(key)) {
        return colors;
      }
    }

    // Default colors
    return {
      gradient: "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50/80",
      iconColor: "text-gray-600",
      border: "border-gray-200",
    };
  };

  const getUsageIcon = (label: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      "المستخدمين": <UsersIcon className="w-5 h-5" />,
      "الفروع": <BuildingIcon className="w-5 h-5" />,
      "المخازن": <BoxIcon className="w-5 h-5" />,
      "الخزنات": <WalletIcon className="w-5 h-5" />,
      "البنوك": <LandmarkIcon className="w-5 h-5" />,
      "الفواتير": <ReceiptIcon className="w-5 h-5" />,
      "العملاء": <UsersIcon className="w-5 h-5" />,
      "الموردين": <TruckIcon className="w-5 h-5" />,
      "الأصناف": <TagIcon className="w-5 h-5" />,
      "عروض الأسعار": <FileTextIcon className="w-5 h-5" />,
      "السندات المالية": <CreditCardIcon className="w-5 h-5" />,
      "الحسابات الجارية": <CreditCardIcon className="w-5 h-5" />,
      "المصروفات والإيرادات": <DollarSignIcon className="w-5 h-5" />,
      "الأرصدة المدينة": <ActivityIcon className="w-5 h-5" />,
      "الأرصدة الدائنة": <ActivityIcon className="w-5 h-5" />,
      "التحليل المالي الذكي": <ActivityIcon className="w-5 h-5" />,
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (label.includes(key)) {
        return icon;
      }
    }

    return <BarChartIcon className="w-5 h-5" />;
  };

  const renderUsageCard = (
    label: string,
    current: number,
    limit: number | boolean,
    isBoolean: boolean = false
  ) => {
    const cardColors = getUsageCardColor(label);
    const icon = getUsageIcon(label);

    if (isBoolean) {
      const enabled = limit as boolean;
      return (
        <div
          className={`${cardColors.gradient} rounded-xl p-5 border-2 ${cardColors.border} shadow-sm hover:shadow-md transition-all duration-200 group`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${enabled ? "bg-green-100" : "bg-gray-100"} ${cardColors.iconColor}`}>
              {enabled ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
            </div>
            <p className="text-sm font-semibold text-gray-700 flex-1">{label}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                enabled
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
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
    const usageColors = getUsageColor(percentage);

    return (
      <div
        className={`${cardColors.gradient} rounded-xl p-5 border-2 ${cardColors.border} shadow-sm hover:shadow-md transition-all duration-200 group`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-white/60 ${cardColors.iconColor} shadow-sm`}>
            {icon}
          </div>
          <p className="text-sm font-semibold text-gray-700 flex-1">{label}</p>
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-3">
          {current} <span className="text-lg text-gray-500">/ {isUnlimited ? "∞" : numericLimit}</span>
        </p>
        {!isUnlimited && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 shadow-inner overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${usageColors.bg} shadow-sm`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold ${usageColors.text}`}>
                {percentage.toFixed(1)}% مستخدم
              </p>
              {percentage >= 100 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                  الحد الأقصى
                </span>
              )}
              {percentage >= 80 && percentage < 100 && (
                <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  قريب من الحد
                </span>
              )}
            </div>
          </>
        )}
        {isUnlimited && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-gray-500 bg-white/60 px-3 py-1 rounded-full">
              غير محدود
            </span>
          </div>
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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
        <Link
          to="/dashboard"
          title="العودة للرئيسية"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HomeIcon className="w-6 h-6 text-brand-dark" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-dark">{title}</h1>
      </div>

      {/* Subscription Basic Info */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
            <ShieldIcon className="w-6 h-6" />
          </div>
          معلومات الاشتراك
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            className={`${
              planColors[subscription.planType]?.gradient || "bg-gradient-to-br from-gray-50 to-gray-50/80"
            } rounded-xl p-5 border-2 ${
              planColors[subscription.planType]?.border || "border-gray-200"
            } shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className={`w-5 h-5 ${planColors[subscription.planType]?.text || "text-gray-600"}`} />
              <p className="text-sm font-semibold text-gray-600">نوع الخطة</p>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
                planColors[subscription.planType]?.badge || "bg-gray-500 text-white"
              }`}
            >
              {planNames[subscription.planType] || subscription.planType}
            </span>
          </div>

          <div
            className={`${
              statusColors[subscription.status]?.gradient || "bg-gradient-to-br from-gray-50 to-gray-50/80"
            } rounded-xl p-5 border-2 ${
              statusColors[subscription.status]?.border || "border-gray-200"
            } shadow-sm hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ActivityIcon className={`w-5 h-5 ${statusColors[subscription.status]?.text || "text-gray-600"}`} />
              <p className="text-sm font-semibold text-gray-600">حالة الاشتراك</p>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
                statusColors[subscription.status]?.badge || "bg-gray-500 text-white"
              }`}
            >
              {statusNames[subscription.status] || subscription.status}
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50/80 rounded-xl p-5 border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-600">تاريخ البداية</p>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {formatDate(subscription.startDate)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50/80 rounded-xl p-5 border-2 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-600">تاريخ النهاية</p>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {formatDate(subscription.endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Limits and Usage */}
      {limits && usage && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue">
              <BarChartIcon className="w-6 h-6" />
            </div>
            حدود الخطة والاستخدام الحالي
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mt-0.5">
              <HelpIcon className="w-5 h-5" />
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong className="font-bold">ملاحظة:</strong> هذه المعلومات تعرض حالة الاشتراك الحالي
              للشركة. للترقية أو التعديل، يرجى التواصل مع المسؤول.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionData;

