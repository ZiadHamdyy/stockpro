import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    UsersIcon, BoxIcon, ShoppingCartIcon, 
    TrendingUpIcon, TrendingDownIcon, 
    DollarSignIcon, ActivityIcon,
    WalletIcon, CreditCardIcon, TruckIcon,
    ClockIcon, FilterIcon
} from '../icons';
import { formatNumber } from '../../utils/formatting';
import { getPathFromMenuKey } from '../../utils/menuPathMapper';
import { useGetCompanyQuery } from '../store/slices/companyApiSlice';
import { useGetSalesInvoicesQuery } from '../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetPurchaseInvoicesQuery } from '../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetExpensePaymentVouchersQuery } from '../store/slices/paymentVoucherApiSlice';
import { useGetSafesQuery } from '../store/slices/safe/safeApiSlice';
import { useGetBanksQuery } from '../store/slices/bank/bankApiSlice';
import { useGetBranchesQuery } from '../store/slices/branch/branchApi';
import { useGetBalanceSheetQuery } from '../store/slices/balanceSheet/balanceSheetApiSlice';
import { getCurrentYearRange } from '../pages/reports/dateUtils';

declare var Chart: any;

// --- Helper Components ---
const QuickActionButton: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    colorClass: string; 
    onClick?: () => void 
}> = ({ title, icon, colorClass, onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className="group relative bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-xl p-2.5 shadow-md border border-slate-300/80 flex flex-col items-center justify-center gap-1.5 h-22 active:scale-95 transition-all duration-300 hover:shadow-xl hover:border-slate-400 hover:-translate-y-0.5 w-full backdrop-blur-sm"
        >
            <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/60 group-hover:ring-white group-hover:shadow-xl`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors text-center leading-tight whitespace-nowrap" style={{ fontFamily: 'Cairo, sans-serif' }}>{title}</span>
        </button>
    );
};

const SummaryCard: React.FC<{ 
    title: string; 
    value: string; 
    subValue?: string;
    isPositive?: boolean;
    icon: React.ReactNode; 
    accentColor: string; 
}> = ({ title, value, subValue, isPositive, icon, accentColor }) => {
    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 shadow-md border border-slate-300/80 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between hover:border-slate-400 hover:shadow-xl backdrop-blur-sm">
            <div className={`absolute top-0 right-0 w-1.5 h-full ${accentColor} shadow-lg`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex justify-between items-center mb-1.5 pl-1 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider" style={{ fontFamily: 'Cairo, sans-serif' }}>{title}</span>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg group-hover:scale-110 ${accentColor.replace('bg-', 'text-').replace('500', '50') + ' bg-opacity-20'} border-2 ${accentColor.replace('bg-', 'border-').replace('500', '200')}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: `w-5 h-5 ${accentColor.replace('bg-', 'text-')}` })}
                </div>
            </div>
            {subValue && (
                <div className="flex items-center gap-1 pl-1 relative z-10">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border shadow-sm ${isPositive ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                        {isPositive ? <TrendingUpIcon className="w-3 h-3"/> : <TrendingDownIcon className="w-3 h-3"/>}
                        {subValue}
                    </span>
                </div>
            )}
        </div>
    );
};

// Alternative Dashboard Component
const AlternativeDashboard: React.FC<{ title: string }> = ({ title }) => {
    const navigate = useNavigate();
    const { data: company } = useGetCompanyQuery();
    
    // API Hooks for data fetching
    const { data: salesInvoices = [], isLoading: salesInvoicesLoading } = useGetSalesInvoicesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: purchaseInvoices = [], isLoading: purchaseInvoicesLoading } = useGetPurchaseInvoicesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: expensePaymentVouchers = [], isLoading: expensesLoading } = useGetExpensePaymentVouchersQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: safes = [], isLoading: safesLoading } = useGetSafesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: banks = [], isLoading: banksLoading } = useGetBanksQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { data: branches = [], isLoading: branchesLoading } = useGetBranchesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    
    // Get current year range for balance sheet
    const yearRange = getCurrentYearRange();
    const { data: balanceSheet, isLoading: balanceSheetLoading } = useGetBalanceSheetQuery({
        startDate: yearRange.start,
        endDate: yearRange.end,
    }, {
        refetchOnMountOrArgChange: true,
    });
    
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const branchChartRef = useRef<HTMLCanvasElement>(null); 
    const liquidityChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ bar?: any; branch?: any; liquidity?: any }>({});
    
    // Filters State
    const [timeRange, setTimeRange] = useState<'6m' | '1y'>('6m');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedBranch, setSelectedBranch] = useState<string>('all');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        // Get current year for filtering
        const currentYear = new Date().getFullYear();
        
        // Filter sales invoices for current year only
        const currentYearSalesInvoices = salesInvoices.filter(inv => {
            if (!inv.date) return false;
            const invoiceYear = new Date(inv.date).getFullYear();
            return invoiceYear === currentYear;
        });
        
        // Filter purchase invoices for current year only
        const currentYearPurchaseInvoices = purchaseInvoices.filter(inv => {
            if (!inv.date) return false;
            const invoiceYear = new Date(inv.date).getFullYear();
            return invoiceYear === currentYear;
        });
        
        // Calculate total sales from current year sales invoices only
        const totalSales = currentYearSalesInvoices.reduce((sum, inv) => sum + (inv.net || 0), 0);
        
        // Calculate total purchases from current year purchase invoices only
        const totalPurchases = currentYearPurchaseInvoices.reduce((sum, inv) => sum + (inv.net || 0), 0);
        
        // Calculate total expenses from payment vouchers with expense entityType
        const totalExpenses = expensePaymentVouchers
            .filter(v => {
                const entityType = (v.entityType || '').toLowerCase();
                return entityType === 'expense' || entityType === 'expense-type';
            })
            .reduce((sum, v) => sum + (v.amount || 0), 0);
        
        // Calculate receivables (credit sales) from current year only
        const receivables = currentYearSalesInvoices
            .filter(i => i.paymentMethod === 'credit')
            .reduce((sum, i) => sum + (i.net || 0), 0);
        
        // Calculate payables (credit purchases) from current year only
        const payables = currentYearPurchaseInvoices
            .filter(i => i.paymentMethod === 'credit')
            .reduce((sum, i) => sum + (i.net || 0), 0);
        
        // Use balance sheet data for liquidity calculation
        const cashBalance = balanceSheet?.cashInSafes || 0;
        const bankBalance = balanceSheet?.cashInBanks || 0;
        const receivablesFromBalanceSheet = balanceSheet?.receivables || 0;
        const inventoryValue = balanceSheet?.inventory || 0;
        
        // Calculate total liquidity from balance sheet
        const totalLiquidity = cashBalance + bankBalance + inventoryValue + receivablesFromBalanceSheet;

        // Calculate branch stats from current year sales invoices grouped by branch
        const branchStats = branches.map(branch => {
            // Filter sales invoices by branchId or branch name and current year
            const branchSales = currentYearSalesInvoices
                .filter(inv => {
                    const invBranchId = inv.branchId || inv.branch?.id;
                    const invBranchName = inv.branch?.name;
                    return invBranchId === branch.id || invBranchName === branch.name;
                })
                .reduce((sum, inv) => sum + (inv.net || 0), 0);
            
            return { name: branch.name, sales: branchSales };
        }).sort((a, b) => b.sales - a.sales);

        return { 
            totalSales, 
            totalPurchases, 
            totalExpenses, 
            receivables, 
            payables, 
            cashBalance: balanceSheet?.cashInSafes || 0, 
            bankBalance: balanceSheet?.cashInBanks || 0, 
            inventoryValue, 
            totalLiquidity, 
            branchStats 
        };
    }, [salesInvoices, purchaseInvoices, expensePaymentVouchers, safes, banks, branches, balanceSheet]);

    // Check if any data is still loading
    const isLoading = salesInvoicesLoading || purchaseInvoicesLoading || expensesLoading || 
                      safesLoading || banksLoading || branchesLoading || balanceSheetLoading;

    // Handle navigation
    const handleNavigate = (key: string, label: string) => {
        const path = getPathFromMenuKey(key);
        if (path) {
            navigate(path);
        }
    };

    // --- Chart 1: Financial Performance (3D Bars + Data Labels) ---
    useEffect(() => {
        // Allow chart to render even with empty data - it will show zeros
        if (barChartRef.current && !salesInvoicesLoading && !purchaseInvoicesLoading) {
            const ctx = barChartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstances.current.bar) chartInstances.current.bar.destroy();
                
                // Get current date for filtering
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-11
                
                // Determine months to show
                const monthsToShow = timeRange === '6m' ? 6 : 12;
                
                // Arabic month names
                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                
                // Filter invoices by branch if selected
                const filteredSalesInvoices = selectedBranch === 'all' 
                    ? salesInvoices 
                    : salesInvoices.filter(inv => {
                        const invBranchId = inv.branchId || inv.branch?.id;
                        const invBranchName = inv.branch?.name;
                        return invBranchId === branches.find(b => b.name === selectedBranch)?.id || invBranchName === selectedBranch;
                    });
                
                const filteredPurchaseInvoices = selectedBranch === 'all'
                    ? purchaseInvoices
                    : purchaseInvoices.filter(inv => {
                        const invBranchId = inv.branchId || inv.branch?.id;
                        const invBranchName = inv.branch?.name;
                        return invBranchId === branches.find(b => b.name === selectedBranch)?.id || invBranchName === selectedBranch;
                    });
                
                // Initialize monthly data - for 6 months, go backwards from current month (oldest to newest)
                const monthlyData = Array.from({ length: monthsToShow }, (_, i) => {
                    let monthIndex: number;
                    let year: number;
                    
                    if (timeRange === '6m') {
                        // For 6 months: calculate months going backwards (5 months ago to current month)
                        // i=0 should be 5 months ago, i=5 should be current month
                        const monthsAgo = 5 - i; // 5, 4, 3, 2, 1, 0
                        const targetMonth = currentMonth - monthsAgo;
                        
                        if (targetMonth < 0) {
                            // Previous year
                            monthIndex = 12 + targetMonth;
                            year = currentYear - 1;
                        } else {
                            monthIndex = targetMonth;
                            year = currentYear;
                        }
                    } else {
                        // For 1 year: January (0) to December (11)
                        monthIndex = i;
                        year = currentYear;
                    }
                    
                    return {
                        monthIndex,
                        monthName: monthNames[monthIndex],
                        year,
                        sales: 0,
                        purchases: 0,
                    };
                });
                
                // Aggregate sales by month
                filteredSalesInvoices.forEach((invoice) => {
                    if (!invoice.date) return;
                    const invoiceDate = new Date(invoice.date);
                    const invoiceYear = invoiceDate.getFullYear();
                    const invoiceMonth = invoiceDate.getMonth();
                    
                    // Check if this invoice falls within our date range
                    if (timeRange === '6m') {
                        // For 6 months, check if it's within the last 6 months
                        const monthsDiff = (currentYear - invoiceYear) * 12 + (currentMonth - invoiceMonth);
                        if (monthsDiff >= 0 && monthsDiff < 6) {
                            // monthsDiff: 0 = current month, 5 = 5 months ago
                            // monthlyData: index 0 = 5 months ago, index 5 = current month
                            // So we need to reverse: dataIndex = 5 - monthsDiff
                            const dataIndex = 5 - monthsDiff;
                            if (dataIndex >= 0 && dataIndex < monthlyData.length) {
                                monthlyData[dataIndex].sales += invoice.net || 0;
                            }
                        }
                    } else {
                        // For 1 year, check if it's in the current year
                        if (invoiceYear === currentYear) {
                            monthlyData[invoiceMonth].sales += invoice.net || 0;
                        }
                    }
                });
                
                // Aggregate purchases by month
                filteredPurchaseInvoices.forEach((invoice) => {
                    if (!invoice.date) return;
                    const invoiceDate = new Date(invoice.date);
                    const invoiceYear = invoiceDate.getFullYear();
                    const invoiceMonth = invoiceDate.getMonth();
                    
                    // Check if this invoice falls within our date range
                    if (timeRange === '6m') {
                        // For 6 months, check if it's within the last 6 months
                        const monthsDiff = (currentYear - invoiceYear) * 12 + (currentMonth - invoiceMonth);
                        if (monthsDiff >= 0 && monthsDiff < 6) {
                            // monthsDiff: 0 = current month, 5 = 5 months ago
                            // monthlyData: index 0 = 5 months ago, index 5 = current month
                            // So we need to reverse: dataIndex = 5 - monthsDiff
                            const dataIndex = 5 - monthsDiff;
                            if (dataIndex >= 0 && dataIndex < monthlyData.length) {
                                monthlyData[dataIndex].purchases += invoice.net || 0;
                            }
                        }
                    } else {
                        // For 1 year, check if it's in the current year
                        if (invoiceYear === currentYear) {
                            monthlyData[invoiceMonth].purchases += invoice.net || 0;
                        }
                    }
                });
                
                // Extract labels and data
                const labels = monthlyData.map(d => d.monthName);
                const salesData = monthlyData.map(d => d.sales);

                const datasets = [];
                
                // 3D Gradient for Sales Bars
                const salesGradient = ctx.createLinearGradient(0, 0, 0, 400);
                salesGradient.addColorStop(0, '#3b82f6'); // Lighter Blue top
                salesGradient.addColorStop(1, '#1e3a8a'); // Darker Blue bottom

                datasets.push({
                    label: 'المبيعات',
                    data: salesData,
                    backgroundColor: salesGradient,
                    hoverBackgroundColor: '#2563eb',
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                    order: 2,
                    borderWidth: 0,
                });

                // Plugin to draw values ON TOP of bars
                const drawValuesPlugin = {
                    id: 'drawValues',
                    afterDatasetsDraw(chart: any) {
                        const { ctx } = chart;
                        chart.data.datasets.forEach((dataset: any, i: number) => {
                            const meta = chart.getDatasetMeta(i);
                            if (!meta.hidden && dataset.type !== 'line') {
                                meta.data.forEach((element: any, index: number) => {
                                    const data = dataset.data[index];
                                    if (data) {
                                        ctx.save();
                                        ctx.fillStyle = '#1e293b'; 
                                        ctx.font = 'bold 10px Cairo';
                                        ctx.textAlign = 'center';
                                        ctx.fillText(formatNumber(data), element.x, element.y - 8);
                                        ctx.restore();
                                    }
                                });
                            }
                        });
                    }
                };

                chartInstances.current.bar = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { 
                                display: true, 
                                position: 'bottom', 
                                labels: { 
                                    font: { family: 'Cairo', size: 11 }, 
                                    usePointStyle: true,
                                    padding: 20
                                } 
                            }, 
                            tooltip: { 
                                titleFont: { family: 'Cairo' }, 
                                bodyFont: { family: 'Cairo' },
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 12,
                                cornerRadius: 8
                            } 
                        },
                        scales: {
                            y: { 
                                grid: { borderDash: [4, 4], color: '#e2e8f0' }, 
                                border: { display: false }, 
                                ticks: { font: { family: 'Cairo', size: 10, weight: 'bold' }, color: '#64748b' } 
                            },
                            x: { 
                                grid: { display: false }, 
                                border: { display: false }, 
                                ticks: { font: { family: 'Cairo', size: 10, weight: 'bold' }, color: '#64748b' } 
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        }
                    },
                    plugins: [drawValuesPlugin]
                });
            }
        }
    }, [timeRange, selectedBranch, salesInvoices, purchaseInvoices, branches, salesInvoicesLoading, purchaseInvoicesLoading]);

    // --- Chart 2: Branch Sales (With Labels & Percentage On Segments) ---
    useEffect(() => {
        if (branchChartRef.current && !isLoading) {
            const ctx = branchChartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstances.current.branch) chartInstances.current.branch.destroy();
                
                const labels = stats.branchStats.map(b => b.name);
                const dataValues = stats.branchStats.map(b => b.sales);
                const total = dataValues.reduce((a, b) => a + b, 0);

                // Plugin to draw Total in Center
                const centerTextPlugin = {
                    id: 'centerTextBranch',
                    beforeDraw: function(chart: any) {
                        const width = chart.width, height = chart.height, ctx = chart.ctx;
                        ctx.restore();
                        
                        const text = formatNumber(total);
                        const textLength = text.length;
                        
                        // Dynamic font size based on text length - adjust to fit circle
                        // Longer numbers = smaller font, shorter numbers = larger font
                        let fontSize;
                        const maxWidth = Math.min(width, height) * 0.6; // 60% of smaller dimension
                        
                        // Start with a base size and adjust based on text length
                        if (textLength <= 8) {
                            fontSize = (height / 90).toFixed(2); // Larger for short numbers
                        } else if (textLength <= 12) {
                            fontSize = (height / 110).toFixed(2);
                        } else if (textLength <= 16) {
                            fontSize = (height / 130).toFixed(2);
                        } else {
                            fontSize = (height / 150).toFixed(2); // Smaller for very long numbers
                        }
                        
                        // Test if text fits, reduce if needed
                        ctx.font = `bold ${fontSize}em Cairo`;
                        const metrics = ctx.measureText(text);
                        const textWidth = metrics.width;
                        
                        // If text is too wide, scale down
                        if (textWidth > maxWidth) {
                            fontSize = ((maxWidth / textWidth) * parseFloat(fontSize)).toFixed(2);
                        }
                        
                        ctx.font = `bold ${fontSize}em Cairo`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#1e3a8a"; // Dark Blue
                        
                        const textX = width / 2;
                        const textY = height / 2;

                        ctx.fillText(text, textX, textY);
                        
                        // Subtitle - proportional to main text
                        const subFontSize = (parseFloat(fontSize) * 0.35).toFixed(2);
                        ctx.font = `bold ${subFontSize}em Cairo`;
                        ctx.fillStyle = "#64748b"; // Slate 500
                        const subText = "إجمالي المبيعات";
                        const subTextX = width / 2;
                        const subTextY = textY + (height / 10); // Position below main text

                        // Add subtle shadow to subtitle
                        ctx.shadowColor = 'rgba(71, 85, 105, 0.2)';
                        ctx.shadowBlur = 4;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                        
                        ctx.fillText(subText, subTextX, subTextY);

                        ctx.save();
                    }
                };

                // Plugin to draw labels and percentage ON the segments
                const segmentLabelPlugin = {
                    id: 'segmentLabelPlugin',
                    afterDatasetsDraw(chart: any) {
                        const { ctx } = chart;
                        const dataset = chart.data.datasets[0];
                        const meta = chart.getDatasetMeta(0);
                        const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#fff';

                        meta.data.forEach((element: any, index: number) => {
                            const value = dataset.data[index];
                            if (value === 0) return; // Don't draw if 0

                            const percentage = ((value / total) * 100).toFixed(1) + '%';
                            const label = chart.data.labels[index];

                            // Calculate position
                            const { startAngle, endAngle, outerRadius, innerRadius, x, y } = element;
                            const middleAngle = startAngle + (endAngle - startAngle) / 2;
                            const midRadius = (innerRadius + outerRadius) / 2;
                            
                            const textX = x + Math.cos(middleAngle) * midRadius;
                            const textY = y + Math.sin(middleAngle) * midRadius;

                            // Only draw if segment is large enough
                            const arcSize = endAngle - startAngle;
                            if (arcSize > 0.15) {
                                ctx.save();
                                // Shadow for text readability
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                                ctx.shadowBlur = 5;
                                
                                // Draw Percentage and Label together
                                ctx.font = 'bold 10px Cairo';
                                const fullText = `${percentage} ${label}`;
                                ctx.fillText(fullText, textX, textY);
                                
                                ctx.restore();
                            } else if (arcSize > 0.08) {
                                // For smaller segments, show only percentage
                                ctx.save();
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                                ctx.shadowBlur = 5;
                                ctx.font = 'bold 9px Cairo';
                                ctx.fillText(percentage, textX, textY);
                                ctx.restore();
                            }
                        });
                    }
                };

                // Generate more colors for multiple branches - using program colors (blue and green)
                const branchColors = [
                    '#3b82f6', '#10b981', '#1e40af', '#047857',
                    '#3b82f6', '#10b981', '#1e40af', '#047857',
                    '#3b82f6', '#10b981', '#1e40af', '#047857'
                ];
                
                chartInstances.current.branch = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: labels.map((_, i) => branchColors[i % branchColors.length]),
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            hoverOffset: 8,
                            hoverBorderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%', 
                        plugins: { 
                            legend: { display: false }, 
                            tooltip: { 
                                titleFont: { family: 'Cairo', size: 12 }, 
                                bodyFont: { family: 'Cairo', size: 11 },
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: true
                            } 
                        }
                    },
                    plugins: [centerTextPlugin, segmentLabelPlugin]
                });
            }
        }
    }, [stats, isLoading]);

    // --- Chart 3: Liquidity (Center Text) ---
    useEffect(() => {
        if (liquidityChartRef.current && !isLoading && balanceSheet) {
            const ctx = liquidityChartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstances.current.liquidity) chartInstances.current.liquidity.destroy();
                
                const labels = ['نقدية', 'بنوك', 'مخزون', 'مديونيات'];
                const dataValues = [
                    balanceSheet.cashInSafes || 0, 
                    balanceSheet.cashInBanks || 0, 
                    balanceSheet.inventory || 0, 
                    balanceSheet.receivables || 0
                ];
                const total = dataValues.reduce((a, b) => a + b, 0);

                // Plugin for Center Text
                const centerTextPluginLiquidity = {
                    id: 'centerTextLiquidity',
                    beforeDraw: function(chart: any) {
                        const width = chart.width, height = chart.height, ctx = chart.ctx;
                        ctx.restore();
                        
                        const text = formatNumber(total);
                        const textLength = text.length;
                        
                        // Dynamic font size based on text length - adjust to fit circle
                        // Longer numbers = smaller font, shorter numbers = larger font
                        let fontSize;
                        const maxWidth = Math.min(width, height) * 0.6; // 60% of smaller dimension
                        
                        // Start with a base size and adjust based on text length
                        if (textLength <= 8) {
                            fontSize = (height / 90).toFixed(2); // Larger for short numbers
                        } else if (textLength <= 12) {
                            fontSize = (height / 110).toFixed(2);
                        } else if (textLength <= 16) {
                            fontSize = (height / 130).toFixed(2);
                        } else {
                            fontSize = (height / 150).toFixed(2); // Smaller for very long numbers
                        }
                        
                        // Test if text fits, reduce if needed
                        ctx.font = `bold ${fontSize}em Cairo`;
                        const metrics = ctx.measureText(text);
                        const textWidth = metrics.width;
                        
                        // If text is too wide, scale down
                        if (textWidth > maxWidth) {
                            fontSize = ((maxWidth / textWidth) * parseFloat(fontSize)).toFixed(2);
                        }
                        
                        ctx.font = `bold ${fontSize}em Cairo`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#047857"; // Emerald Dark

                        const textX = width / 2;
                        const textY = height / 2 - 5; // Slightly above center

                        ctx.fillText(text, textX, textY);
                        
                        // Subtitle - proportional to main text
                        const subFontSize = (parseFloat(fontSize) * 0.35).toFixed(2);
                        ctx.font = `bold ${subFontSize}em Cairo`;
                        ctx.fillStyle = "#64748b"; // Slate 500
                        const subText = "إجمالي السيولة";
                        const subTextX = width / 2;
                        const subTextY = textY + (height / 12); // Closer spacing

                        // Add subtle shadow to subtitle
                        ctx.shadowColor = 'rgba(71, 85, 105, 0.2)';
                        ctx.shadowBlur = 4;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                        
                        ctx.fillText(subText, subTextX, subTextY);

                        ctx.save();
                    }
                };

                // Plugin to draw percentage and label text ON the liquidity segments
                const segmentLabelPluginLiquidity = {
                    id: 'segmentLabelPluginLiquidity',
                    afterDatasetsDraw(chart: any) {
                        const { ctx } = chart;
                        const dataset = chart.data.datasets[0];
                        const meta = chart.getDatasetMeta(0);
                        const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = '#ffffff';

                        meta.data.forEach((element: any, index: number) => {
                            const value = dataset.data[index];
                            if (!value || total === 0) return;

                            const percentage = ((value / total) * 100).toFixed(0) + '%';
                            const label = chart.data.labels[index];

                            const { startAngle, endAngle, outerRadius, innerRadius, x, y } = element;
                            const middleAngle = startAngle + (endAngle - startAngle) / 2;
                            const midRadius = (innerRadius + outerRadius) / 2;

                            const textX = x + Math.cos(middleAngle) * midRadius;
                            const textY = y + Math.sin(middleAngle) * midRadius;

                            // Only draw if the arc is large enough so text does not overlap
                            const arcSize = endAngle - startAngle;
                            if (arcSize > 0.2) {
                                ctx.save();
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                                ctx.shadowBlur = 5;
                                ctx.font = 'bold 10px Cairo';
                                // Draw percentage and label together: "33% بنوك"
                                const fullText = `${percentage} ${label}`;
                                ctx.fillText(fullText, textX, textY);
                                ctx.restore();
                            } else if (arcSize > 0.1) {
                                // For smaller segments, show only percentage
                                ctx.save();
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                                ctx.shadowBlur = 5;
                                ctx.font = 'bold 9px Cairo';
                                ctx.fillText(percentage, textX, textY);
                                ctx.restore();
                            }
                        });
                    }
                };

                chartInstances.current.liquidity = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: ['#10b981', '#3b82f6', '#1e40af', '#047857'],
                            borderWidth: 0,
                            hoverOffset: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } } }
                    },
                    plugins: [centerTextPluginLiquidity, segmentLabelPluginLiquidity]
                });
            }
        }
    }, [balanceSheet, isLoading]);

    // Cleanup charts on unmount
    useEffect(() => {
        return () => {
            if (chartInstances.current.bar) chartInstances.current.bar.destroy();
            if (chartInstances.current.branch) chartInstances.current.branch.destroy();
            if (chartInstances.current.liquidity) chartInstances.current.liquidity.destroy();
        };
    }, []);

    // Handle chart resize when container size changes
    useEffect(() => {
        const resizeCharts = () => {
            if (chartInstances.current.bar) {
                chartInstances.current.bar.resize();
            }
            if (chartInstances.current.branch) {
                chartInstances.current.branch.resize();
            }
            if (chartInstances.current.liquidity) {
                chartInstances.current.liquidity.resize();
            }
        };

        // Use ResizeObserver to detect container size changes
        const observers: ResizeObserver[] = [];
        
        if (barChartRef.current) {
            const barObserver = new ResizeObserver(() => {
                resizeCharts();
            });
            barObserver.observe(barChartRef.current);
            observers.push(barObserver);
        }

        if (branchChartRef.current) {
            const branchObserver = new ResizeObserver(() => {
                resizeCharts();
            });
            branchObserver.observe(branchChartRef.current);
            observers.push(branchObserver);
        }

        if (liquidityChartRef.current) {
            const liquidityObserver = new ResizeObserver(() => {
                resizeCharts();
            });
            liquidityObserver.observe(liquidityChartRef.current);
            observers.push(liquidityObserver);
        }

        // Also listen to window resize as fallback
        window.addEventListener('resize', resizeCharts);

        return () => {
            observers.forEach(observer => observer.disconnect());
            window.removeEventListener('resize', resizeCharts);
        };
    }, []);

    // --- Time Formatting Helpers ---
    const getFormattedDate = () => {
        return currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') + ' م';
    };

    const getFormattedTime = () => {
        return currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }).toLowerCase();
    };

    return (
        <div className="flex flex-col font-sans text-slate-800 bg-slate-200">
            
            {/* 1. TOP HEADER SECTION */}
            <div className="shrink-0 p-3 pb-1 z-20 relative">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-700/50 h-[95px] flex items-center transition-all hover:border-blue-600/70">
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-900 via-[#1e40af] to-blue-800">
                         <div className="absolute inset-0 opacity-[0.12]" 
                             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
                        </div>
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                    </div>

                    <div className="relative z-10 w-full px-6 grid grid-cols-3 gap-4 items-center text-white">
                        {/* Right: Company Info with Logo */}
                        <div className="flex items-center gap-4 border-l border-white/20 pl-6 h-full justify-center">
                            {/* Logo */}
                            {company?.logo && (
                                <div className="flex-shrink-0">
                                    <img 
                                        src={company.logo} 
                                        alt="Company Logo" 
                                        className="h-16 w-16 object-contain rounded-lg bg-white/10 p-1.5 border-2 border-white/20 shadow-lg backdrop-blur-sm"
                                    />
                                </div>
                            )}
                            {/* Company Name */}
                            <div className="flex flex-col items-start gap-1.5">
                                <div className="bg-gradient-to-r from-white/20 to-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/30 shadow-lg">
                                    <h2 className="text-lg font-extrabold text-white tracking-wide drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                        {company?.name || "الشركة"}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/30 rounded-full border border-white/20 backdrop-blur-sm">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                    <p className="text-blue-100 text-[9px] font-bold tracking-wider">النظام متصل</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Stock.Pro Logo - Bigger and Better */}
                        <div className="flex justify-center group relative cursor-default">
                            <div className="absolute -inset-12 bg-blue-500/30 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
                            
                            <div className="relative flex items-baseline transform group-hover:scale-105 transition-transform duration-500 ease-out">
                                <h1 className="text-7xl font-black tracking-[0.2em] drop-shadow-2xl text-white" style={{ 
                                    fontFamily: 'Cairo, sans-serif',
                                    fontWeight: 900
                                }}>
                                    Pro
                                </h1>
                                <span className="text-7xl font-black text-amber-400 animate-pulse mx-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">.</span>
                                <h1 className="text-7xl font-black tracking-[0.2em] drop-shadow-2xl text-white" style={{ 
                                    fontFamily: 'Cairo, sans-serif',
                                    fontWeight: 900
                                }}>
                                    Stock
                                </h1>
                            </div>
                        </div>

                        {/* Left: Clock */}
                        <div className="flex justify-end">
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100/95 border-2 border-slate-300/80 rounded-xl px-4 py-2 flex items-center gap-3 shadow-xl min-w-[240px] justify-between group hover:border-blue-400 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm">
                                <div className="text-right flex flex-col justify-center">
                                    <div className="flex items-baseline gap-1 dir-ltr">
                                        <span className="font-mono text-base font-black text-slate-800 tracking-wider leading-none">
                                            {getFormattedTime().split(' ')[0]} 
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 uppercase ml-1">{getFormattedTime().split(' ')[1]}</span>
                                    </div>
                                    <span className="block text-slate-700 text-xl font-extrabold tracking-widest mb-0.5 uppercase group-hover:text-blue-700 transition-colors" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                        {getFormattedDate()}
                                    </span>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2.5 rounded-lg shadow-inner border border-blue-200 group-hover:border-blue-300 transition-colors">
                                    <ClockIcon className="w-6 h-6 text-blue-700 group-hover:text-blue-800 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT WRAPPER */}
            <div className="bg-slate-200 p-3 pt-2 flex flex-col gap-3 relative">
                
                {/* 2. COMPACT MIDDLE ROW: Cards & Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 shrink-0">
                    
                    {/* Actions Panel */}
                    <div className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] p-3 rounded-2xl border-2 border-blue-700/50 shadow-xl flex flex-col relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1.5 bg-white/25 rounded-lg text-white shadow-lg backdrop-blur-sm border border-white/20"><ShoppingCartIcon className="w-4 h-4"/></div>
                            <h3 className="text-white font-extrabold text-xl tracking-wide drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>الوصول السريع</h3>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 gap-2 relative z-10">
                            <QuickActionButton title="فاتورة مبيعات" icon={<ShoppingCartIcon/>} colorClass="bg-blue-600" onClick={() => handleNavigate('sales_invoice', 'فاتورة مبيعات')} />
                            <QuickActionButton title="فاتورة مشتريات" icon={<BoxIcon/>} colorClass="bg-emerald-600" onClick={() => handleNavigate('purchase_invoice', 'فاتورة مشتريات')} />
                            <QuickActionButton title="إضافة عميل" icon={<UsersIcon/>} colorClass="bg-indigo-600" onClick={() => handleNavigate('add_customer', 'إضافة عميل')} />
                            <QuickActionButton title="سند صرف" icon={<CreditCardIcon/>} colorClass="bg-rose-600" onClick={() => handleNavigate('payment_voucher', 'سند صرف')} />
                            <QuickActionButton title="سند قبض" icon={<DollarSignIcon/>} colorClass="bg-teal-600" onClick={() => handleNavigate('receipt_voucher', 'سند قبض')} />
                            <QuickActionButton title="إضافة مصروف" icon={<ActivityIcon/>} colorClass="bg-amber-600" onClick={() => handleNavigate('expenses_list', 'إضافة مصروف')} />
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] p-3 rounded-2xl border-2 border-blue-700/50 shadow-xl flex flex-col relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1.5 bg-white/25 rounded-lg text-white shadow-lg backdrop-blur-sm border border-white/20"><ActivityIcon className="w-4 h-4"/></div>
                            <h3 className="text-white font-extrabold text-xl tracking-wide drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>الأداء السنوي</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 relative z-10">
                            <SummaryCard 
                                title="المبيعات" 
                                value={isLoading ? "..." : formatNumber(stats.totalSales)} 
                                subValue="+12%" 
                                isPositive={true} 
                                icon={<ShoppingCartIcon/>} 
                                accentColor="bg-blue-500" 
                            />
                            <SummaryCard 
                                title="المشتريات" 
                                value={isLoading ? "..." : formatNumber(stats.totalPurchases)} 
                                subValue="المدفوعات" 
                                isPositive={false} 
                                icon={<CreditCardIcon/>} 
                                accentColor="bg-purple-500" 
                            />
                            <SummaryCard 
                                title="مستحقات (لنا)" 
                                value={isLoading ? "..." : formatNumber(stats.receivables)} 
                                subValue="تحصيل" 
                                isPositive={true} 
                                icon={<WalletIcon/>} 
                                accentColor="bg-amber-500" 
                            />
                            <SummaryCard 
                                title="مستحقات (علينا)" 
                                value={isLoading ? "..." : formatNumber(stats.payables)} 
                                subValue="سداد" 
                                isPositive={false} 
                                icon={<TruckIcon/>} 
                                accentColor="bg-rose-500" 
                            />
                        </div>
                    </div>

                </div>

                {/* 3. FLEXIBLE BOTTOM ROW: Charts (Updated with 3D effects & Filters) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
                    
                    {/* Main Chart - Financial Performance */}
                    <div className="lg:col-span-6 bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-2xl shadow-xl border-2 border-blue-700/50 p-3 flex flex-col relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                <div className="w-2 h-7 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div> الأداء المالي التاريخي
                            </h3>
                            
                            {/* NEW FILTERS with Branch Select */}
                            <div className="flex gap-2">
                                {/* Branch Filter */}
                                <div className="flex items-center bg-blue-900/50 p-0.5 rounded-lg border border-blue-700/50 backdrop-blur-sm px-2">
                                    <FilterIcon className="w-3 h-3 text-blue-200 ml-1"/>
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="bg-transparent text-[10px] text-white font-bold outline-none border-none cursor-pointer"
                                    >
                                        <option value="all" className="text-black">كل الفروع</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.name} className="text-black">{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex bg-blue-900/50 p-0.5 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                                    <button 
                                        onClick={() => setTimeRange('6m')} 
                                        className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${timeRange === '6m' ? 'bg-white text-blue-900 shadow-sm scale-105' : 'text-blue-200 hover:text-white'}`}
                                    >
                                        6 أشهر
                                    </button>
                                    <button 
                                        onClick={() => setTimeRange('1y')} 
                                        className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${timeRange === '1y' ? 'bg-white text-blue-900 shadow-sm scale-105' : 'text-blue-200 hover:text-white'}`}
                                    >
                                        سنة
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Chart Container */}
                        <div className="flex-1 w-full bg-slate-200 rounded-xl border border-slate-300 p-2 shadow-inner min-h-0 relative z-10">
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>

                    {/* Branch Sales - With Labels on Arc & Professional Center Text */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-2xl shadow-xl border-2 border-blue-700/50 p-3 flex flex-col relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                 <div className="w-2 h-7 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50"></div> مبيعات الفروع
                            </h3>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 gap-2 relative z-10">
                            <div className="flex-1 bg-slate-200 rounded-xl border border-slate-300 p-2 shadow-inner flex items-center justify-center relative min-h-[140px]">
                                 <div className="w-full h-full relative">
                                    <canvas ref={branchChartRef} className="relative z-10"></canvas>
                                 </div>
                            </div>
                        </div>
                    </div>

                    {/* Liquidity - With Center Text */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-2xl shadow-xl border-2 border-blue-700/50 p-3 flex flex-col relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg drop-shadow-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
                                 <div className="w-2 h-7 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div> توزيع السيولة
                            </h3>
                        </div>
                         <div className="flex-1 flex flex-col min-h-0 gap-2 relative z-10">
                            <div className="flex-1 bg-slate-200 rounded-xl border border-slate-300 p-2 shadow-inner flex items-center justify-center relative min-h-[140px]">
                                <div className="w-full h-full relative">
                                    <canvas ref={liquidityChartRef} className="relative z-10"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AlternativeDashboard;

