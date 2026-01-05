import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Branch, SalesRecord } from '../types';
import { FilterPanel } from './FilterPanel';
import { SalesChart } from './SalesChart';
import { SalesTable } from './SalesTable';
import { BarChartIcon, BuildingIcon, CalendarIcon, PrintIcon, TrendingUpIcon, DollarSignIcon, ActivityIcon, Loader2Icon, ChevronDownIcon } from '../../../../icons';
import { useGetBranchesQuery } from '../../../../store/slices/branch/branchApi';
import { useGetAnnualSalesReportQuery } from '../../../../store/slices/annualSales/annualSalesApiSlice';
import ReportHeader from '../../ReportHeader';

interface AnnualSalesProps {
  title?: string;
}

/**
 * Annual Sales Report Component
 * 
 * IMPORTANT: This component RESPECTS branch filters when branches are selected.
 * Unlike other financial analysis reports, this report allows filtering by selected branches.
 * 
 * - When branches are selected via `selectedBranches`, data is filtered to show only those branches
 * - When no branches are selected (or all are selected), data shows all branches
 * - The report uses branch filtering to provide branch-specific sales analysis
 * 
 * This is different from other financial analysis reports which always show company-wide data.
 */
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch branches
  const { data: apiBranches = [], isLoading: branchesLoading } = useGetBranchesQuery(undefined);

  // Fetch annual sales report - data is filtered by selectedBranches on the frontend
  // The API returns all branches, and we filter based on selectedBranches state
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

  // Generate years list (from current year going backwards to 2000)
  const years = useMemo(() => {
    const yearsList = [];
    for (let y = currentYear; y >= 2000; y--) {
      yearsList.push(y);
    }
    return yearsList;
  }, [currentYear]);

  // Handle year selection
  const handleSelectYear = useCallback((year: number) => {
    setSelectedYear(year);
    setIsYearDropdownOpen(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearDropdownOpen]);

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
  // NOTE: These calculations filter by selectedBranches - only include selected branches
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
  <>
    <style>{`
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
        }
        .print-card-bg {
          background: white !important;
          color: black !important;
        }
        .print-card-bg * {
          color: black !important;
        }
        .print-card-bg h3 {
          color: black !important;
        }
        .print-card-bg p {
          color: #374151 !important;
        }
        /* Optimize main container for print */
        main {
          margin: 0 !important;
          padding: 0.5cm 0.5cm !important;
          max-width: 100% !important;
        }
        /* Hide unnecessary elements */
        header {
          page-break-after: avoid !important;
          break-after: avoid !important;
        }
        /* Ensure stats cards don't break awkwardly */
        .grid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 0.5cm !important;
        }
      }
    `}</style>
    <div
      className="min-h-screen bg-[#f1f5f9] text-slate-800 pb-12 font-sans print:bg-white print:min-h-0"
      dir="rtl"
    >
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:border-b print:border-black print:shadow-none print:static print:py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6 print:px-4">
          <div className="flex justify-between h-20 items-center print:h-auto print:py-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 print:hidden">
                <BarChartIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 print:text-xl">
                  {title || 'تقرير المبيعات السنوي'}
                </h1>
                <p className="text-sm text-slate-500 font-medium print:text-[11px] print:text-slate-600">
                  لوحة القيادة التنفيذية - السنة المالية {selectedYear}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm font-medium text-slate-500 print:hidden">
                <div className="relative" ref={yearDropdownRef}>
                  <button
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    {selectedYear}
                    <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                  </button>
                  {isYearDropdownOpen && (
                    <div className="absolute z-50 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto min-w-[120px]">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleSelectYear(year)}
                          className={`w-full px-4 py-2.5 text-right hover:bg-slate-50 transition-colors ${
                            year === selectedYear ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:max-w-full print:mx-0 print:py-2 print:space-y-2 print:px-0">
        
        {/* Report Header - Company Info - Print Only */}
        <div className="print:block hidden print:mb-2">
          <ReportHeader title={title || 'تقرير المبيعات السنوي'} />
        </div>

        {/* Report Metadata - Print Only */}
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 print:py-2 print:mb-2 print:mt-0 print:px-4 print:border-t print:border-b">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right print:space-y-0">
              <p className="text-base text-gray-700 print:text-xs print:mb-0">
                <span className="font-semibold text-gray-800">السنة:</span> <span className="font-extrabold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg inline-block">{selectedYear}</span>
              </p>
            </div>
            <div className="space-y-2 text-right print:space-y-0">
              <p className="text-base text-gray-700 print:text-xs print:mb-0">
                <span className="font-semibold text-gray-800">التاريخ:</span> <span className="font-extrabold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg inline-block">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Top Stats Cards - Colorful & Cheerful */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-2 print:mb-2">
          
          {/* Card 1: Total Sales - Blue/Indigo */}
          <div className="group relative bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:!bg-white print:border-2 print:border-slate-400 print:shadow-none print:p-4 print:rounded-lg print-card-bg">
            {/* Abstract Shapes - Hidden in Print */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-15 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:opacity-25 transition-opacity print:hidden"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl group-hover:opacity-30 transition-opacity print:hidden"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10 print:mb-2">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform print:hidden">
                <DollarSignIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md print:hidden">YTD</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-blue-100 mb-1 print:text-[11px] print:!text-slate-700 print:font-semibold">
                إجمالي المبيعات السنوية
              </p>
              <h3 className="text-3xl font-extrabold text-white tabular-nums tracking-tight print:!text-black print:text-xl print:font-bold">
                {formatCurrency(totalSales)}
              </h3>
            </div>
          </div>

          {/* Card 2: Best Month - Emerald/Teal */}
          <div className="group relative bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:!bg-white print:border-2 print:border-slate-400 print:shadow-none print:p-4 print:rounded-lg print-card-bg">
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-15 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl group-hover:opacity-25 transition-opacity print:hidden"></div>
             <div className="absolute top-0 right-0 w-28 h-28 bg-teal-300 opacity-20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl group-hover:opacity-30 transition-opacity print:hidden"></div>

            <div className="flex justify-between items-start mb-4 relative z-10 print:mb-2">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform print:hidden">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-emerald-100 mb-1 print:text-[11px] print:!text-slate-700 print:font-semibold">
                الشهر الأفضل أداءً
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white print:!text-black print:text-xl print:font-bold">
                  {bestMonth.monthName || 'لا توجد بيانات'}
                </h3>
              </div>
            </div>
          </div>

          {/* Card 3: Average - Amber/Orange */}
          <div className="group relative bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden print:!bg-white print:border-2 print:border-slate-400 print:shadow-none print:p-4 print:rounded-lg print-card-bg">
             <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white opacity-15 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:opacity-25 transition-opacity print:hidden"></div>
             <div className="absolute top-0 left-0 w-20 h-20 bg-orange-300 opacity-25 rounded-full -translate-y-1/2 -translate-x-1/2 blur-lg group-hover:opacity-35 transition-opacity print:hidden"></div>

            <div className="flex justify-between items-start mb-4 relative z-10 print:mb-2">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white border border-white/10 group-hover:scale-110 transition-transform print:hidden">
                <ActivityIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md print:hidden">AVG</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-amber-100 mb-1 print:text-[11px] print:!text-slate-700 print:font-semibold">
                متوسط المبيعات الشهري
              </p>
              <h3 className="text-3xl font-extrabold text-white tabular-nums tracking-tight print:!text-black print:text-xl print:font-bold">
                 {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(totalSales / 12)}
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

        {/* Content Grid */}
        <div className="space-y-4 print:space-y-0 print:w-full">
          {/* Chart Section - Hidden in Print */}
          <section className="print-card break-inside-avoid print:w-full print:[max-width:100%] print:overflow-hidden print:hidden">
            <SalesChart 
              data={salesData} 
              branches={branches} 
              selectedBranches={selectedBranches} 
            />
          </section>

          {/* Table Section - Full width and height for print */}
          <section className="print-card break-inside-auto print:mt-0 print:mb-0 print:w-full print:h-auto">
            <SalesTable 
              data={salesData} 
              branches={branches} 
              selectedBranches={selectedBranches} 
            />
          </section>
        </div>

      </main>
    </div>
  </>
  );
};

export default AnnualSales;