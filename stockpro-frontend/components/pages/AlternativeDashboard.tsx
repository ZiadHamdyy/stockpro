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
            className="group relative bg-slate-200 hover:bg-slate-300 rounded-lg p-2 shadow-sm border border-slate-300 flex flex-col items-center justify-center gap-1 h-20 active:scale-95 transition-all duration-300 hover:shadow-lg hover:border-slate-400 w-full"
        >
            <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/50 group-hover:ring-white`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
            </div>
            <span className="text-xs font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors text-center leading-tight whitespace-nowrap">{title}</span>
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
        <div className="bg-slate-200 rounded-lg p-2.5 shadow-sm border border-slate-300 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col justify-between hover:border-slate-400 hover:shadow-lg">
            <div className={`absolute top-0 right-0 w-1 h-full ${accentColor}`}></div>
            <div className="flex justify-between items-center mb-1 pl-1">
                <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">{title}</span>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{value}</h3>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${accentColor.replace('bg-', 'text-').replace('500', '50') + ' bg-opacity-20'}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: `w-4 h-4 ${accentColor.replace('bg-', 'text-')}` })}
                </div>
            </div>
            {subValue && (
                <div className="flex items-center gap-1 pl-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${isPositive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'}`}>
                        {isPositive ? <TrendingUpIcon className="w-2.5 h-2.5"/> : <TrendingDownIcon className="w-2.5 h-2.5"/>}
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
    const { data: salesInvoices = [], isLoading: salesInvoicesLoading } = useGetSalesInvoicesQuery();
    const { data: purchaseInvoices = [], isLoading: purchaseInvoicesLoading } = useGetPurchaseInvoicesQuery();
    const { data: expensePaymentVouchers = [], isLoading: expensesLoading } = useGetExpensePaymentVouchersQuery();
    const { data: safes = [], isLoading: safesLoading } = useGetSafesQuery();
    const { data: banks = [], isLoading: banksLoading } = useGetBanksQuery();
    const { data: branches = [], isLoading: branchesLoading } = useGetBranchesQuery();
    
    // Get current year range for balance sheet
    const yearRange = getCurrentYearRange();
    const { data: balanceSheet, isLoading: balanceSheetLoading } = useGetBalanceSheetQuery({
        startDate: yearRange.start,
        endDate: yearRange.end,
    });
    
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const branchChartRef = useRef<HTMLCanvasElement>(null); 
    const liquidityChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ bar?: any; branch?: any; liquidity?: any }>({});
    
    // Filters State
    const [timeRange, setTimeRange] = useState<'6m' | '1y'>('6m');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [barMetric, setBarMetric] = useState<'sales' | 'profit' | 'both'>('sales');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- Stats Calculation ---
    const stats = useMemo(() => {
        // Calculate total sales from sales invoices
        const totalSales = salesInvoices.reduce((sum, inv) => sum + (inv.net || 0), 0);
        
        // Calculate total purchases from purchase invoices
        const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.net || 0), 0);
        
        // Calculate total expenses from payment vouchers with expense entityType
        const totalExpenses = expensePaymentVouchers
            .filter(v => {
                const entityType = (v.entityType || '').toLowerCase();
                return entityType === 'expense' || entityType === 'expense-type';
            })
            .reduce((sum, v) => sum + (v.amount || 0), 0);
        
        // Calculate receivables (credit sales)
        const receivables = salesInvoices
            .filter(i => i.paymentMethod === 'credit')
            .reduce((sum, i) => sum + (i.net || 0), 0);
        
        // Calculate payables (credit purchases)
        const payables = purchaseInvoices
            .filter(i => i.paymentMethod === 'credit')
            .reduce((sum, i) => sum + (i.net || 0), 0);
        
        // Calculate cash balance from safes (use currentBalance if available)
        const cashBalance = safes.reduce((sum, s) => {
            const balance = (s as any).currentBalance !== undefined 
                ? (s as any).currentBalance 
                : s.openingBalance || 0;
            return sum + balance;
        }, 0);
        
        // Calculate bank balance (use currentBalance if available, otherwise openingBalance)
        const bankBalance = banks.reduce((sum, b) => {
            const balance = (b as any).currentBalance !== undefined 
                ? (b as any).currentBalance 
                : b.openingBalance || 0;
            return sum + balance;
        }, 0);
        
        // Get inventory value from balance sheet
        const inventoryValue = balanceSheet?.inventory || 0;
        
        // Calculate total liquidity
        const totalLiquidity = cashBalance + bankBalance + inventoryValue + receivables;

        // Calculate branch stats from sales invoices grouped by branch
        const branchStats = branches.map(branch => {
            // Filter sales invoices by branchId or branch name
            const branchSales = salesInvoices
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
            cashBalance, 
            bankBalance, 
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
        if (barChartRef.current && salesInvoices.length > 0 && purchaseInvoices.length > 0) {
            const ctx = barChartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstances.current.bar) chartInstances.current.bar.destroy();
                
                // Get current date for filtering
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-11
                
                // Determine months to show
                const monthsToShow = timeRange === '6m' ? 6 : 12;
                const startMonth = timeRange === '6m' ? Math.max(0, currentMonth - 5) : 0;
                
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
                
                // Initialize monthly data
                const monthlyData = Array.from({ length: monthsToShow }, (_, i) => {
                    const monthIndex = (startMonth + i) % 12;
                    const year = timeRange === '6m' && monthIndex > currentMonth ? currentYear - 1 : currentYear;
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
                            const dataIndex = monthsDiff;
                            if (dataIndex < monthlyData.length) {
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
                            const dataIndex = monthsDiff;
                            if (dataIndex < monthlyData.length) {
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
                // Calculate profit (sales - purchases)
                const profitData = monthlyData.map(d => d.sales - d.purchases);

                const datasets = [];
                
                // 3D Gradient for Sales Bars
                const salesGradient = ctx.createLinearGradient(0, 0, 0, 400);
                salesGradient.addColorStop(0, '#3b82f6'); // Lighter Blue top
                salesGradient.addColorStop(1, '#1e3a8a'); // Darker Blue bottom

                if (barMetric === 'sales' || barMetric === 'both') {
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
                }

                if (barMetric === 'profit' || barMetric === 'both') {
                    datasets.push({
                        type: 'line',
                        label: 'الربح',
                        data: profitData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#f59e0b',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        order: 1,
                        fill: true
                    });
                }

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
    }, [timeRange, barMetric, selectedBranch, salesInvoices, purchaseInvoices, branches]);

    // --- Chart 2: Branch Sales (With Labels & Percentage On Segments) ---
    useEffect(() => {
        if (branchChartRef.current) {
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

                        ctx.font = 'bold 10px Cairo';
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
                            if (endAngle - startAngle > 0.2) {
                                ctx.save();
                                // Shadow for text readability
                                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                                ctx.shadowBlur = 4;
                                
                                // Draw Percentage
                                ctx.font = 'bold 11px Cairo';
                                ctx.fillText(percentage, textX, textY);
                                
                                // Draw Label below
                                ctx.font = '9px Cairo';
                                ctx.fillText(label.split(' ')[1] || label, textX, textY + 12);
                                
                                ctx.restore();
                            }
                        });
                    }
                };

                chartInstances.current.branch = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                            borderWidth: 0,
                            hoverOffset: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%', 
                        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } } }
                    },
                    plugins: [centerTextPlugin]
                });
            }
        }
    }, [stats]);

    // --- Chart 3: Liquidity (Center Text) ---
    useEffect(() => {
        if (liquidityChartRef.current) {
            const ctx = liquidityChartRef.current.getContext('2d');
            if (ctx) {
                if (chartInstances.current.liquidity) chartInstances.current.liquidity.destroy();
                
                const labels = ['نقدية', 'بنوك', 'مخزون', 'مديونيات'];
                const dataValues = [stats.cashBalance, stats.bankBalance, stats.inventoryValue, stats.receivables];
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

                chartInstances.current.liquidity = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dataValues,
                            backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
                            borderWidth: 0,
                            hoverOffset: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%', 
                        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } } }
                    },
                    plugins: [centerTextPluginLiquidity]
                });
            }
        }
    }, [stats]);

    // Cleanup charts on unmount
    useEffect(() => {
        return () => {
            if (chartInstances.current.bar) chartInstances.current.bar.destroy();
            if (chartInstances.current.branch) chartInstances.current.branch.destroy();
            if (chartInstances.current.liquidity) chartInstances.current.liquidity.destroy();
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
        <div className="flex flex-col h-full overflow-y-auto font-sans text-slate-800 bg-slate-200">
            
            {/* 1. TOP HEADER SECTION */}
            <div className="shrink-0 p-3 pb-1 z-20 relative">
                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-blue-800 h-[85px] flex items-center transition-all">
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-900 via-[#1e40af] to-blue-800">
                         <div className="absolute inset-0 opacity-[0.1]" 
                             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }}>
                        </div>
                    </div>

                    <div className="relative z-10 w-full px-6 grid grid-cols-3 gap-4 items-center text-white">
                        {/* Right: Info */}
                        <div className="flex flex-col items-start border-l border-white/20 pl-6 h-full justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1 bg-blue-500/20 rounded-lg backdrop-blur-sm border border-blue-400/30">
                                     <ActivityIcon className="w-4 h-4 text-blue-300" />
                                </div>
                                <h2 className="text-base font-bold truncate text-white tracking-wide">{company?.name || "الشركة"}</h2>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-black/20 rounded-full border border-white/10">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                <p className="text-blue-100 text-[9px] font-bold tracking-wider">النظام متصل</p>
                            </div>
                        </div>

                        {/* Center: Logo */}
                        <div className="flex justify-center group relative cursor-default">
                            <div className="absolute -inset-10 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            
                            <div className="relative flex items-baseline transform group-hover:scale-105 transition-transform duration-500 ease-out">
                                <h1 className="text-5xl font-black tracking-widest drop-shadow-2xl font-sans text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-50 to-blue-200">
                                    Stock
                                </h1>
                                <span className="text-5xl font-black text-amber-400 animate-pulse mx-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">.</span>
                                <h1 className="text-5xl font-black tracking-widest drop-shadow-2xl font-sans text-blue-200 group-hover:text-white transition-colors duration-300">
                                    Pro
                                </h1>
                            </div>
                        </div>

                        {/* Left: Clock */}
                        <div className="flex justify-end">
                            <div className="bg-slate-100/95 border-2 border-slate-300 rounded-xl px-4 py-1.5 flex items-center gap-3 shadow-lg min-w-[240px] justify-between group hover:border-blue-400 transition-all duration-300">
                                <div className="text-right flex flex-col justify-center">
                                    <span className="block text-slate-600 text-sm font-bold tracking-widest mb-0.5 uppercase group-hover:text-blue-600 transition-colors">
                                        {getFormattedDate()}
                                    </span>
                                    <div className="flex items-baseline gap-1 dir-ltr">
                                        <span className="font-mono text-2xl font-black text-slate-800 tracking-wider leading-none">
                                            {getFormattedTime().split(' ')[0]} 
                                        </span>
                                        <span className="text-sm font-bold text-slate-500 uppercase ml-1">{getFormattedTime().split(' ')[1]}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-200 p-2 rounded-lg shadow-inner border border-slate-300">
                                    <ClockIcon className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT WRAPPER */}
            <div className="flex-1 bg-slate-200 p-3 pt-2 flex flex-col gap-3 overflow-y-auto relative z-10 mx-1 mb-1">
                
                {/* 2. COMPACT MIDDLE ROW: Cards & Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 shrink-0">
                    
                    {/* Actions Panel */}
                    <div className="bg-[#1e40af] p-3 rounded-2xl border-2 border-blue-800 shadow-lg flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1 bg-white/20 rounded text-white shadow backdrop-blur-sm"><ShoppingCartIcon className="w-3 h-3"/></div>
                            <h3 className="text-white font-extrabold text-xl tracking-wide">الوصول السريع</h3>
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
                    <div className="bg-[#1e40af] p-3 rounded-2xl border-2 border-blue-800 shadow-lg flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="p-1 bg-white/20 rounded text-white shadow backdrop-blur-sm"><ActivityIcon className="w-3 h-3"/></div>
                            <h3 className="text-white font-extrabold text-xl tracking-wide">الأداء السنوي</h3>
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
                    <div className="lg:col-span-6 bg-[#1e40af] rounded-2xl shadow-lg border-2 border-blue-800 p-3 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg">
                                <div className="w-1.5 h-6 bg-blue-400 rounded-full"></div> الأداء المالي التاريخي
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
                                <div className="flex bg-blue-900/50 p-0.5 rounded-lg border border-blue-700/50 backdrop-blur-sm">
                                    <button onClick={() => setBarMetric('sales')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${barMetric === 'sales' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}>مبيعات</button>
                                    <button onClick={() => setBarMetric('profit')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${barMetric === 'profit' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}>أرباح</button>
                                    <button onClick={() => setBarMetric('both')} className={`px-2 py-1 text-[10px] rounded-md font-bold transition-all ${barMetric === 'both' ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-200 hover:text-white'}`}>الكل</button>
                                </div>
                            </div>
                        </div>
                        {/* Chart Container */}
                        <div className="flex-1 w-full bg-slate-200 rounded-xl border border-slate-300 p-2 shadow-inner min-h-0 relative z-10">
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>

                    {/* Branch Sales - With Labels on Arc & Professional Center Text */}
                    <div className="lg:col-span-3 bg-[#1e40af] rounded-2xl shadow-lg border-2 border-blue-800 p-3 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg">
                                 <div className="w-1.5 h-6 bg-indigo-400 rounded-full"></div> مبيعات الفروع
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
                    <div className="lg:col-span-3 bg-[#1e40af] rounded-2xl shadow-lg border-2 border-blue-800 p-3 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-2 shrink-0 relative z-10">
                            <h3 className="font-extrabold text-white flex items-center gap-2 text-lg">
                                 <div className="w-1.5 h-6 bg-emerald-400 rounded-full"></div> توزيع السيولة
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

