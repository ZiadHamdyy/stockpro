import React from 'react';
import { XIcon, UsersIcon, TruckIcon } from '../icons';
import { formatMoney } from '../../utils/formatting';

interface CreditEntityBalanceBarProps {
  entityName: string;
  currentBalance: number;
  theme: 'blue' | 'green';
  entityType?: 'customer' | 'supplier';
  onClose: () => void;
}

const CreditEntityBalanceBar: React.FC<CreditEntityBalanceBarProps> = ({
  entityName,
  currentBalance,
  theme,
  entityType = 'customer',
  onClose,
}) => {
  if (!entityName) return null;

  const isGreenTheme = theme === 'green';
  const gradientColors = isGreenTheme 
    ? 'from-[#065f46] to-[#10b981]' 
    : 'from-[#1e3a8a] to-[#2563eb]';
  const borderColor = isGreenTheme ? 'border-green-400' : 'border-blue-400';
  const iconBgColor = isGreenTheme ? 'bg-green-500/80' : 'bg-blue-500/80';
  const textColor = isGreenTheme ? 'text-green-100' : 'text-blue-100';
  const textColorSecondary = isGreenTheme ? 'text-green-200' : 'text-blue-200';
  const shadowColor = isGreenTheme 
    ? 'shadow-[0_-10px_40px_rgba(5,95,70,0.2)]' 
    : 'shadow-[0_-10px_40px_rgba(30,58,138,0.2)]';

  const getIcon = () => {
    if (entityType === 'supplier') {
      return <TruckIcon className="w-6 h-6 text-white" />;
    }
    return <UsersIcon className="w-6 h-6 text-white" />;
  };

  const getTypeLabel = () => {
    return entityType === 'supplier' ? 'المورد' : 'العميل';
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 animate-slide-up ${shadowColor}`}>
      {/* Background with Gradient */}
      <div className={`bg-gradient-to-r ${gradientColors} text-white border-t-4 ${borderColor} relative overflow-hidden`}>
        
        {/* Decorative Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', 
            backgroundSize: '16px 16px' 
          }}
        />

        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-6 relative z-10">
          
          {/* Identity Block */}
          <div className="flex items-center gap-4 min-w-[240px] bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-sm">
            <div className={`p-2 ${iconBgColor} rounded-lg shadow-inner`}>
              {getIcon()}
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] ${textColor} font-bold uppercase tracking-wider mb-0.5`}>
                {getTypeLabel()}
              </span>
              <h3 className="text-base font-bold text-white truncate max-w-[200px] leading-tight drop-shadow-md">
                {entityName}
              </h3>
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center group cursor-default">
              <span className={`text-[10px] ${textColor} font-bold mb-1 opacity-80`}>
                الرصيد الحالي
              </span>
              <div className="flex items-baseline gap-2 bg-black/20 px-4 py-1.5 rounded-lg border border-white/5">
                <span 
                  className={`text-2xl font-black font-mono tracking-tight ${
                    currentBalance < 0 
                      ? 'text-red-300' 
                      : currentBalance > 0 
                      ? 'text-emerald-300' 
                      : 'text-emerald-300'
                  }`}
                >
                  {formatMoney(currentBalance)}
                </span>
                <span className={`text-[10px] ${textColorSecondary} font-bold`}>SAR</span>
              </div>
              <span 
                className={`text-[9px] px-2 py-0.5 mt-1 rounded-full font-bold shadow-sm ${
                  currentBalance > 0 
                    ? 'bg-red-500/80 text-white' 
                    : currentBalance < 0 
                    ? 'bg-emerald-500/80 text-white' 
                    : 'bg-gray-500/50 text-gray-200'
                }`}
              >
                {currentBalance > 0 ? 'مدين (عليه)' : currentBalance < 0 ? 'دائن (له)' : 'متزن'}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 shadow-sm border border-white/10"
            title="إخفاء الشريط"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditEntityBalanceBar;

