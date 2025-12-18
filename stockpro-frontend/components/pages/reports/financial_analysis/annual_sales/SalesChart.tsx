import React, { useEffect, useRef } from 'react';
import { SalesRecord, Branch } from '../types';

declare var Chart: any;

interface SalesChartProps {
  data: SalesRecord[];
  branches: Branch[];
  selectedBranches: string[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, branches, selectedBranches }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumSignificantDigits: 3,
      notation: "compact"
    }).format(value);
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) chartInstance.current.destroy();

        const visibleBranches = branches.filter(b => selectedBranches.includes(b.id));
        const labels = data.map(record => record.monthName);
        
        const datasets = visibleBranches.map(branch => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, branch.color + '80'); // 50% opacity
          gradient.addColorStop(1, branch.color + '10'); // 10% opacity

          return {
            label: branch.name,
            data: data.map(record => record.data[branch.id] || 0),
            borderColor: branch.color,
            backgroundColor: gradient,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#fff',
            pointBorderColor: branch.color,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 4
          };
        });

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { 
                position: 'top', 
                labels: { 
                  font: { family: 'Cairo', size: 14 }, 
                  usePointStyle: true,
                  padding: 20
                } 
              },
              tooltip: { 
                titleFont: { family: 'Cairo' }, 
                bodyFont: { family: 'Cairo' },
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                  label: function(context: any) {
                    return context.dataset.label + ': ' + 
                      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(context.parsed.y);
                  }
                }
              }
            },
            scales: { 
              y: { 
                beginAtZero: true, 
                grid: { 
                  color: '#334155', 
                  borderDash: [3, 3] 
                },
                border: { display: false },
                ticks: {
                  font: { family: 'ui-sans-serif, system-ui, sans-serif', size: 12 },
                  color: '#94a3b8',
                  callback: function(value: any) {
                    return formatCurrency(value);
                  }
                }
              },
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  font: { family: 'Cairo', size: 13, weight: '500' },
                  color: '#94a3b8'
                }
              }
            }
          }
        });
      }
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data, branches, selectedBranches]);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 h-[450px] flex flex-col print:bg-white print:border-slate-200 print:shadow-none">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-xl font-bold text-white flex items-center gap-3 print:text-black">
          <span className="w-1.5 h-6 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
          منحنى تطور المبيعات
        </h3>
      </div>
     
      <div className="flex-1 w-full min-h-0" dir="ltr"> 
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};
