import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisStatus, Branch, SalesRecord } from '../types';
import { FilterPanel } from './FilterPanel';
import { SalesChart } from './SalesChart';
import { SalesTable } from './SalesTable';
import { AIAnalysis } from './AIAnalysis';
import { analyzeSalesData } from './services/geminiService';
import { BarChartIcon, BuildingIcon, CalendarIcon, PrintIcon, TrendingUpIcon, DollarSignIcon, ActivityIcon, Loader2Icon } from '../../../../icons';
import { useGetBranchesQuery } from '../../../../store/slices/branch/branchApi';
import { useGetAnnualSalesReportQuery } from '../../../../store/slices/annualSales/annualSalesApiSlice';

interface AnnualSalesProps {
  title?: string;
}

// Color palette for branches
const BRANCH_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

// Arabic month names
const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const AnnualSales: React.FC<AnnualSalesProps> = ({ title }) => {
  const selectedYear = new Date().getFullYear();
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<AnalysisStatus>('idle');
  const [aiResult, setAiResult] = useState<string>('');

  // Fetch branches
  const { data: apiBranches = [], isLoading: branchesLoading } = useGetBranchesQuery();

  // Fetch annual sales report (fetch all branches, filter on frontend)
  const { data: salesReport, isLoading: salesLoading, error: salesError } = useGetAnnualSalesReportQuery({
    year: selectedYear,
  });

  // Transform branches to match Branch interface with colors
  const branches: Branch[] = useMemo(() => {
    return apiBranches.map((branch, index) => ({
      id: branch.id,
      name: branch.name,
      color: BRANCH_COLORS[index % BRANCH_COLORS.length],
    }));
  }, [apiBranches]);

  // Initialize selected branches when branches are loaded
  useEffect(() => {
    if (branches.length > 0 && selectedBranches.length === 0) {
      setSelectedBranches(branches.map(b => b.id));
    }
  }, [branches, selectedBranches.length]);

  // Transform sales report data to SalesRecord format
  const salesData: SalesRecord[] = useMemo(() => {
    if (!salesReport || !salesReport.months) {
      // Return empty data for all 12 months
      return ARABIC_MONTHS.map((monthName, index) => ({
        monthName,
        monthIndex: index + 1,
        data: {},
      }));
    }

    return salesReport.months.map((monthData) => ({
      monthName: ARABIC_MONTHS[monthData.month - 1],
      monthIndex: monthData.month,
      data: monthData.branchSales || {},
    }));
  }, [salesReport]);

  const handleToggleBranch = (id: string) => {
    setSelectedBranches(prev => 
      prev.includes(id) 
        ? prev.filter(bId => bId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => setSelectedBranches(branches.map(b => b.id));
  const handleClearAll = () => setSelectedBranches([]);

  const handleAnalyze = async () => {
    if (selectedBranches.length === 0) {
      setAiStatus('error');
      setAiResult("يرجى اختيار فرع واحد على الأقل للتحليل.");
      return;
    }

    setAiStatus('loading');
    try {
      const result = await analyzeSalesData(salesData, selectedBranches, branches);
      setAiResult(result);
      setAiStatus('success');
    } catch (error) {
      setAiStatus('error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for English Numbers Formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate high-level summary metrics
  const totalSales = useMemo(() => {
    return salesData.reduce((acc, curr) => {
      const monthTotal = branches.reduce((sum, branch) => {
        return selectedBranches.includes(branch.id) ? sum + (curr.data[branch.id] || 0) : sum;
      }, 0);
      return acc + monthTotal;
    }, 0);
  }, [salesData, branches, selectedBranches]);

  const bestMonth = useMemo(() => {
    if (salesData.length === 0) {
      return { monthName: 'لا توجد بيانات', monthIndex: 0, data: {} };
    }
    return salesData.reduce((max, curr) => {
      const currTotal = branches.reduce((sum, b) => selectedBranches.includes(b.id) ? sum + (curr.data[b.id] || 0) : sum, 0);
      const maxTotal = branches.reduce((sum, b) => selectedBranches.includes(b.id) ? sum + (max.data[b.id] || 0) : sum, 0);
      return currTotal > maxTotal ? curr : max;
    }, salesData[0]);
  }, [salesData, branches, selectedBranches]);

  const isLoading = branchesLoading || salesLoading;
  const hasError = salesError;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 font-bold text-lg mb-2">حدث خطأ أثناء تحميل البيانات</p>
          <p className="text-slate-600">يرجى المحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 pb-12 font-sans" dir="rtl">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:border-b-2 print:border-black print:shadow-none print:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 print:hidden">
                <BarChartIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title || 'تقرير المبيعات السنوي'}</h1>
                <p className="text-sm text-slate-500 font-medium print:text-slate-600">لوحة القيادة التنفيذية - السنة المالية {selectedYear}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm font-medium text-slate-500 print:hidden">
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  {selectedYear}
                </span>
                <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                  <BuildingIcon className="w-4 h-4 text-slate-400" />
                  {selectedBranches.length} فروع
                </span>
              </div>
              
              <button 
                onClick={handlePrint}
                className="group flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 no-print border border-transparent hover:border-slate-700"
              >
                <PrintIcon className="w-4 h-4 group-hover:text-indigo-300 transition-colors" />
                طباعة / معاينة
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Stats Cards - Colorful & Cheerful */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
          
          {/* Card 1: Total Sales - Blue/Indigo */}
          <div className="group relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:bg-white print:border print:border-slate-300 print:shadow-none print:text-black">
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:opacity-20 transition-opacity"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform">
                <DollarSignIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">YTD</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-blue-100 mb-1 print:text-slate-500">إجمالي المبيعات السنوية</p>
              <h3 className="text-3xl font-extrabold text-white tabular-nums tracking-tight print:text-black">
                {formatCurrency(totalSales)}
              </h3>
            </div>
          </div>

          {/* Card 2: Best Month - Emerald/Teal */}
          <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:bg-white print:border print:border-slate-300 print:shadow-none print:text-black">
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl group-hover:opacity-20 transition-opacity"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-emerald-100 mb-1 print:text-slate-500">الشهر الأفضل أداءً</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white print:text-black">{bestMonth.monthName}</h3>
              </div>
            </div>
          </div>

          {/* Card 3: Average - Amber/Orange */}
          <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:bg-white print:border print:border-slate-300 print:shadow-none print:text-black">
             <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:opacity-20 transition-opacity"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform">
                <ActivityIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">AVG</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-amber-100 mb-1 print:text-slate-500">متوسط المبيعات الشهري</p>
              <h3 className="text-3xl font-extrabold text-white tabular-nums tracking-tight print:text-black">
                 {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', notation: "compact", maximumFractionDigits: 1 }).format(totalSales / 12)}
              </h3>
            </div>
          </div>
        </div>

        {/* Filters - Hidden in Print */}
        <div className="no-print">
          <FilterPanel 
            branches={branches}
            selectedBranches={selectedBranches}
            onToggleBranch={handleToggleBranch}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
        </div>

        {/* AI Section */}
        <AIAnalysis 
          status={aiStatus}
          result={aiResult}
          onAnalyze={handleAnalyze}
        />

        {/* Content Grid */}
        <div className="space-y-8">
          {/* Chart Section */}
          <section className="print-card break-inside-avoid">
            <SalesChart 
              data={salesData} 
              branches={branches} 
              selectedBranches={selectedBranches} 
            />
          </section>

          {/* Table Section */}
          <section className="print-card break-inside-avoid">
            <SalesTable 
              data={salesData} 
              branches={branches} 
              selectedBranches={selectedBranches} 
            />
          </section>
        </div>

      </main>
    </div>
  );
};

export default AnnualSales;