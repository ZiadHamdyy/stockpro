import React, { useEffect, useRef } from 'react';
import { UsersIcon, BoxIcon, ReceiptIcon, ShoppingCartIcon } from '../icons';

declare var Chart: any;

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient }) => (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-xl shadow-lg text-white`}>
        <div className="flex justify-between items-center">
             <div className="opacity-80">
                {icon}
            </div>
            <div className="text-left">
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
        </div>
    </div>
);


const Dashboard: React.FC<{ title: string }> = ({ title }) => {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const doughnutChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ bar?: any; doughnut?: any }>({});

  useEffect(() => {
    // Bar Chart for Monthly Performance
    if (barChartRef.current) {
      const barCtx = barChartRef.current.getContext('2d');
      if (barCtx) {
        if (chartInstances.current.bar) chartInstances.current.bar.destroy();
        
        const salesData = [120, 150, 180, 220, 190, 250, 280, 300, 260, 310, 340, 320];
        const purchasesData = [80, 90, 110, 130, 120, 140, 160, 170, 150, 180, 200, 190];

        chartInstances.current.bar = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            datasets: [
              {
                label: 'المبيعات (ألف)',
                data: salesData,
                backgroundColor: 'rgba(30, 64, 175, 0.7)',
                borderColor: 'rgba(30, 64, 175, 1)',
                borderWidth: 1,
                borderRadius: 4,
              },
              {
                label: 'المشتريات (ألف)',
                data: purchasesData,
                backgroundColor: 'rgba(22, 163, 74, 0.7)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 1,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { font: { family: 'Cairo' } } },
              tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } }
            },
            scales: { y: { beginAtZero: true, ticks: { callback: (value: number) => value + ' ألف' } } },
          },
        });
      }
    }

    // Doughnut Chart for Sales by Category
    if (doughnutChartRef.current) {
        const doughnutCtx = doughnutChartRef.current.getContext('2d');
        if (doughnutCtx) {
            if (chartInstances.current.doughnut) chartInstances.current.doughnut.destroy();

            chartInstances.current.doughnut = new Chart(doughnutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['إلكترونيات', 'أثاث', 'مستلزمات مكتبية', 'اكسسوارات'],
                    datasets: [{
                        label: 'المبيعات حسب الفئة',
                        data: [450, 250, 180, 120],
                        backgroundColor: ['#1E40AF', '#16a34a', '#f59e0b', '#6b7280'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } },
                        tooltip: { titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } }
                    }
                }
            });
        }
    }

    return () => {
      if (chartInstances.current.bar) chartInstances.current.bar.destroy();
      if (chartInstances.current.doughnut) chartInstances.current.doughnut.destroy();
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-brand-dark">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="اجمالي المبيعات" 
            value="1.2M SAR" 
            icon={<ShoppingCartIcon className="w-12 h-12" />} 
            gradient="from-blue-500 to-brand-blue" 
        />
        <StatCard 
            title="اجمالي المشتريات" 
            value="876K SAR" 
            icon={<ReceiptIcon className="w-12 h-12" />} 
            gradient="from-lime-500 to-green-600"
        />
        <StatCard 
            title="عدد الأصناف" 
            value="5,400" 
            icon={<BoxIcon className="w-12 h-12" />} 
            gradient="from-yellow-400 to-amber-500"
        />
        <StatCard 
            title="عدد العملاء" 
            value="1,250" 
            icon={<UsersIcon className="w-12 h-12" />}
            gradient="from-gray-600 to-brand-dark"
        />
      </div>
       <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-brand-dark">الأداء الشهري (مبيعات ومشتريات)</h2>
            <div className="relative h-96">
                <canvas ref={barChartRef}></canvas>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
             <h2 className="text-xl font-bold mb-4 text-brand-dark">المبيعات حسب الفئة</h2>
             <div className="relative h-96">
                <canvas ref={doughnutChartRef}></canvas>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;