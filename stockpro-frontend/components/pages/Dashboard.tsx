import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { UsersIcon, BoxIcon, ReceiptIcon, ShoppingCartIcon } from "../icons";
import {
  useGetDashboardStatsQuery,
  useGetMonthlyStatsQuery,
  useGetSalesByItemGroupQuery,
} from "../store/slices/dashboard/dashboardApiSlice";
import { useGetCompanyQuery } from "../store/slices/companyApiSlice";
import { formatNumber } from "../../utils/formatting";

declare var Chart: any;

// Helper function to format large numbers with K/M suffixes
const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient,
}) => (
  <div
    className={`bg-gradient-to-br ${gradient} p-6 rounded-xl shadow-lg text-white`}
  >
    <div className="flex justify-between items-center">
      <div className="opacity-80">{icon}</div>
      <div className="text-left">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ title: string }> = ({ title }) => {
  const location = useLocation();
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ bar?: any; doughnut?: any }>({});

  // Get style variant from location state, default to 'default'
  const styleVariant = (location.state as { style?: string })?.style || 'default';

  // Fetch company data for currency
  const { data: company } = useGetCompanyQuery();
  const currency = company?.currency || "SAR";

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } =
    useGetDashboardStatsQuery();

  // Fetch monthly statistics
  const { data: monthlyStats } = useGetMonthlyStatsQuery();

  // Fetch sales by item group
  const { data: salesByItemGroup } = useGetSalesByItemGroupQuery();

  useEffect(() => {
    // Bar Chart for Monthly Performance
    if (barChartRef.current && monthlyStats) {
      const barCtx = barChartRef.current.getContext("2d");
      if (barCtx) {
        if (chartInstances.current.bar) chartInstances.current.bar.destroy();

        // Convert data to thousands for better readability
        const salesData = monthlyStats.months.map((m) => m.netSales / 1000);
        const purchasesData = monthlyStats.months.map(
          (m) => m.netPurchases / 1000,
        );

        chartInstances.current.bar = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: [
              "يناير",
              "فبراير",
              "مارس",
              "أبريل",
              "مايو",
              "يونيو",
              "يوليو",
              "أغسطس",
              "سبتمبر",
              "أكتوبر",
              "نوفمبر",
              "ديسمبر",
            ],
            datasets: [
              {
                label: "المبيعات (ألف)",
                data: salesData,
                backgroundColor: "rgba(30, 64, 175, 0.7)",
                borderColor: "rgba(30, 64, 175, 1)",
                borderWidth: 1,
                borderRadius: 4,
              },
              {
                label: "المشتريات (ألف)",
                data: purchasesData,
                backgroundColor: "rgba(22, 163, 74, 0.7)",
                borderColor: "rgba(22, 163, 74, 1)",
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: { font: { family: "Cairo" } },
              },
              tooltip: {
                titleFont: { family: "Cairo" },
                bodyFont: { family: "Cairo" },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (value: number) => value + " ألف" },
              },
            },
          },
        });
      }
    }

    // Doughnut Chart for Sales by Category
    if (doughnutChartRef.current && salesByItemGroup) {
      const doughnutCtx = doughnutChartRef.current.getContext("2d");
      if (doughnutCtx) {
        if (chartInstances.current.doughnut)
          chartInstances.current.doughnut.destroy();

        // Generate dynamic colors for item groups
        const colors = [
          "#1E40AF",
          "#16a34a",
          "#f59e0b",
          "#6b7280",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#06b6d4",
          "#84cc16",
          "#f97316",
          "#14b8a6",
          "#a855f7",
        ];

        const labels = salesByItemGroup.itemGroups.map((g) => g.groupName);
        const data = salesByItemGroup.itemGroups.map((g) => g.totalSales);
        const backgroundColors = salesByItemGroup.itemGroups.map(
          (_, i) => colors[i % colors.length],
        );

        chartInstances.current.doughnut = new Chart(doughnutCtx, {
          type: "doughnut",
          data: {
            labels: labels,
            datasets: [
              {
                label: "المبيعات حسب الفئة",
                data: data,
                backgroundColor: backgroundColors,
                hoverOffset: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { font: { family: "Cairo" } },
              },
              tooltip: {
                titleFont: { family: "Cairo" },
                bodyFont: { family: "Cairo" },
                callbacks: {
                  label: function (context: any) {
                    const label = context.label || "";
                    const value = context.parsed || 0;
                    const percentage =
                      salesByItemGroup.itemGroups[context.dataIndex].percentage;
                    return `${label}: ${formatNumber(value)} ${currency} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      if (chartInstances.current.doughnut)
        chartInstances.current.doughnut.destroy();
    };
  }, [monthlyStats, salesByItemGroup, currency]);

  // Render alternative style (empty page for now)
  if (styleVariant === 'alternative') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-brand-dark">{title}</h1>
        {/* Empty page - styles will be provided later */}
      </div>
    );
  }

  // Render default style (current dashboard content)
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="اجمالي المبيعات"
          value={
            statsLoading
              ? "جاري التحميل..."
              : dashboardStats
                ? `${currency} ${formatLargeNumber(dashboardStats.netSales)}`
                : `${currency} 0`
          }
          icon={<ShoppingCartIcon className="w-12 h-12" />}
          gradient="from-blue-500 to-brand-blue"
        />
        <StatCard
          title="اجمالي المشتريات"
          value={
            statsLoading
              ? "جاري التحميل..."
              : dashboardStats
                ? `${currency} ${formatLargeNumber(dashboardStats.totalPurchases)}`
                : `${currency} 0`
          }
          icon={<ReceiptIcon className="w-12 h-12" />}
          gradient="from-lime-500 to-green-600"
        />
        <StatCard
          title="عدد الأصناف"
          value={
            statsLoading
              ? "جاري التحميل..."
              : dashboardStats
                ? dashboardStats.totalItems.toString()
                : "0"
          }
          icon={<BoxIcon className="w-12 h-12" />}
          gradient="from-yellow-400 to-amber-500"
        />
        <StatCard
          title="عدد العملاء"
          value={
            statsLoading
              ? "جاري التحميل..."
              : dashboardStats
                ? dashboardStats.totalCustomers.toString()
                : "0"
          }
          icon={<UsersIcon className="w-12 h-12" />}
          gradient="from-gray-600 to-brand-dark"
        />
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-brand-dark">
            الأداء الشهري (مبيعات ومشتريات)
          </h2>
          <div className="relative h-96">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-brand-dark">
            المبيعات حسب الفئة
          </h2>
          <div className="relative h-96">
            <canvas ref={doughnutChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
