import React from 'react';
import { UsersIcon, TruckIcon, ActivityIcon, TrendingUpIcon, FileTextIcon, CheckCircleIcon, XIcon } from '../icons';
import { formatNumber } from '../../utils/formatting';

export type EntityBottomBarType = 
  | 'customer'
  | 'supplier'
  | 'current_account'
  | 'receivable_account'
  | 'payable_account'
  | 'revenue'
  | 'expense'
  | 'vat';

interface EntityBottomBarProps {
  type: EntityBottomBarType;
  balance: number;
  lastInvoice?: { amount: number; date: string };
  lastReceipt?: { amount: number; date: string };
  entityName: string;
  onClose: () => void;
  mode?: 'payment' | 'receipt'; // 'payment' decrements balance, 'receipt' increments balance
  currentAmount?: number; // Current voucher amount to adjust balance
}

const EntityBottomBar: React.FC<EntityBottomBarProps> = ({ 
  type, 
  balance, 
  lastInvoice, 
  lastReceipt, 
  entityName, 
  onClose,
  mode,
  currentAmount = 0
}) => {
  if (!entityName) return null;

  const isCustomer = type === 'customer';
  
  // Adjust balance based on mode: payment decrements, receipt increments
  const adjustedBalance = mode === 'payment' 
    ? balance - (currentAmount || 0)
    : mode === 'receipt'
    ? balance + (currentAmount || 0)
    : balance;
  
  // Icon Selection
  const getIcon = () => {
    switch (type) {
      case 'customer': return <UsersIcon className="w-6 h-6 text-white" />;
      case 'supplier': return <TruckIcon className="w-6 h-6 text-white" />;
      case 'current_account': return <ActivityIcon className="w-6 h-6 text-white" />;
      case 'receivable_account': return <ActivityIcon className="w-6 h-6 text-white" />;
      case 'payable_account': return <ActivityIcon className="w-6 h-6 text-white" />;
      case 'revenue': return <TrendingUpIcon className="w-6 h-6 text-white" />;
      case 'expense': return <TrendingUpIcon className="w-6 h-6 text-white" />;
      default: return <UsersIcon className="w-6 h-6 text-white" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'customer': return 'العميل';
      case 'supplier': return 'المورد';
      case 'current_account': return 'الحساب الجاري';
      case 'receivable_account': return 'الحساب المدين';
      case 'payable_account': return 'الحساب الدائن';
      case 'revenue': return 'بند الإيراد';
      case 'expense': return 'بند المصروف';
      default: return 'الجهة';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up shadow-[0_-10px_40px_rgba(30,58,138,0.2)]">
      {/* Pure Brand Blue Background with Subtle Gradient and Texture */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white border-t-4 border-blue-400 relative overflow-hidden">
        
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        </div>

        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-6 relative z-10">
          
          {/* 1. Identity Block - Glass Effect */}
          <div className="flex items-center gap-4 min-w-[240px] bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm transition-transform hover:scale-105 duration-300">
            <div className="p-2 bg-blue-500/80 rounded-lg shadow-inner">
              {getIcon()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider mb-0.5">{getTypeLabel()}</span>
              <h3 className="text-base font-bold text-white truncate max-w-[200px] leading-tight drop-shadow-md">{entityName}</h3>
            </div>
          </div>

          {/* 2. Stats Grid - Horizontal Layout */}
          <div className="flex-1 flex items-center justify-center gap-8 overflow-x-auto hide-scrollbar">
            
            {/* Balance Block (Primary) */}
            <div className="flex flex-col items-center group cursor-default">
              <span className="text-[10px] text-blue-100 font-bold mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {type === 'revenue' ? 'إجمالي المحصل (السنة)' : 'الرصيد الحالي'}
              </span>
              <div className="flex items-baseline gap-2 bg-black/20 px-4 py-1.5 rounded-lg border border-white/5 transition-all group-hover:bg-black/30 group-hover:shadow-lg">
                <span className={`text-2xl font-black font-mono tracking-tight ${adjustedBalance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                  {formatNumber(Math.abs(adjustedBalance))}
                </span>
                <span className="text-[10px] text-blue-200 font-bold">SAR</span>
              </div>
              {type !== 'revenue' && (
                <span className={`text-[9px] px-2 py-0.5 mt-1 rounded-full font-bold shadow-sm ${adjustedBalance > 0 ? 'bg-red-500/80 text-white' : adjustedBalance < 0 ? 'bg-emerald-500/80 text-white' : 'bg-gray-500/50 text-gray-200'}`}>
                  {adjustedBalance > 0 ? 'مدين (عليه)' : adjustedBalance < 0 ? 'دائن (له)' : 'متزن'}
                </span>
              )}
            </div>

            {/* Divider */}
            {(lastInvoice || lastReceipt) && <div className="w-px h-10 bg-white/20 hidden md:block"></div>}

            {/* Last Invoice Block (Only for Customers) */}
            {isCustomer && lastInvoice && (
              <div className="hidden md:flex flex-col items-center group cursor-default transition-transform hover:-translate-y-0.5 duration-300">
                <span className="text-[10px] text-blue-100 font-medium mb-1 flex items-center gap-1">
                  <FileTextIcon className="w-3 h-3 opacity-70"/> آخر فاتورة
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-white">{formatNumber(lastInvoice.amount)}</span>
                </div>
                <span className="text-[10px] text-blue-200 font-mono bg-blue-800/40 px-1.5 rounded mt-0.5">{lastInvoice.date}</span>
              </div>
            )}

            {/* Divider */}
            {isCustomer && lastInvoice && lastReceipt && <div className="w-px h-8 bg-white/20 hidden md:block opacity-50"></div>}

            {/* Last Receipt Block */}
            {lastReceipt && (
              <div className="hidden md:flex flex-col items-center group cursor-default transition-transform hover:-translate-y-0.5 duration-300">
                <span className="text-[10px] text-blue-100 font-medium mb-1 flex items-center gap-1">
                  <CheckCircleIcon className="w-3 h-3 text-emerald-300"/> {type === 'revenue' ? 'آخر عملية' : 'آخر سداد'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-emerald-200 group-hover:text-white transition-colors">{formatNumber(lastReceipt.amount)}</span>
                </div>
                <span className="text-[10px] text-blue-200 font-mono bg-blue-800/40 px-1.5 rounded mt-0.5">{lastReceipt.date}</span>
              </div>
            )}
          </div>

          {/* 3. Close Action */}
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 shadow-sm border border-white/10"
            title="إخفاء الشريط"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } `}</style>
    </div>
  );
};

export default EntityBottomBar;
