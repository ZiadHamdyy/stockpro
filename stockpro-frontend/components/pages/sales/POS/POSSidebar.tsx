import React from 'react';
import { 
  PlusIcon,
  DatabaseIcon,
  GlobeIcon,
  MoreVerticalIcon,
  PauseIcon,
  RefreshCcwIcon,
  PrintIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  SearchIcon,
  XCircleIcon,
} from '../../../icons';

interface SidebarProps {
  onFunctionClick: (key: string) => void;
}

// Define theme types for buttons
type ColorTheme = 'green' | 'blue' | 'indigo' | 'orange' | 'red' | 'slate' | 'teal' | 'cyan' | 'rose' | 'violet';

interface ButtonConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  theme: ColorTheme;
}

const FunctionButton: React.FC<{ 
  config: ButtonConfig;
  onClick: () => void;
}> = ({ config, onClick }) => {
  
  // Royal Blue Theme Adaptations - Vivid against the new Comfortable Blue (royal-700)
  const colorStyles: Record<ColorTheme, { iconText: string, iconBg: string, hoverBorder: string }> = {
    green:  { iconText: 'text-emerald-300', iconBg: 'bg-emerald-500/20', hoverBorder: 'group-hover:border-emerald-400' },
    blue:   { iconText: 'text-blue-300',    iconBg: 'bg-blue-500/20',    hoverBorder: 'group-hover:border-blue-400' },
    indigo: { iconText: 'text-indigo-300',  iconBg: 'bg-indigo-500/20',  hoverBorder: 'group-hover:border-indigo-400' },
    orange: { iconText: 'text-orange-300',  iconBg: 'bg-orange-500/20',  hoverBorder: 'group-hover:border-orange-400' },
    red:    { iconText: 'text-red-300',     iconBg: 'bg-red-500/20',     hoverBorder: 'group-hover:border-red-400' },
    slate:  { iconText: 'text-slate-300',   iconBg: 'bg-slate-500/20',   hoverBorder: 'group-hover:border-slate-300' },
    teal:   { iconText: 'text-teal-300',    iconBg: 'bg-teal-500/20',    hoverBorder: 'group-hover:border-teal-400' },
    cyan:   { iconText: 'text-cyan-300',    iconBg: 'bg-cyan-500/20',    hoverBorder: 'group-hover:border-cyan-400' },
    rose:   { iconText: 'text-rose-300',    iconBg: 'bg-rose-500/20',    hoverBorder: 'group-hover:border-rose-400' },
    violet: { iconText: 'text-violet-300',  iconBg: 'bg-violet-500/20',  hoverBorder: 'group-hover:border-violet-400' },
  };

  const style = colorStyles[config.theme];

  return (
    <button 
      onClick={onClick}
      className={`group relative w-full flex items-center gap-4 px-4 bg-brand-blue transition-all h-[calc(100%/12)] border-b border-white/5 hover:bg-blue-700 active:bg-black/10 duration-200 overflow-hidden`}
    >
      {/* Icon Container - Always Colored */}
      <div className={`p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${style.iconBg} ${style.iconText} group-hover:scale-110 shadow-sm ring-1 ring-white/10`}>
        {config.icon}
      </div>
      
      {/* Label - Beside Icon */}
      <span className={`text-sm font-bold text-white leading-tight transition-colors group-hover:text-gold-400 group-hover:drop-shadow-sm text-right flex-1 truncate tracking-wide`}>
        {config.label}
      </span>
      
      {/* F-Key Badge */}
      <span className="absolute top-1 left-1 text-[10px] font-mono text-blue-300 opacity-60 group-hover:opacity-100 group-hover:text-gold-400 font-bold px-1">
        {config.key}
      </span>

      {/* Side Active Indicator Bar */}
      <div className={`absolute right-0 top-0 bottom-0 w-[4px] bg-transparent transition-colors ${style.hoverBorder}`}></div>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ onFunctionClick }) => {
  const buttons: ButtonConfig[] = [
    { key: 'F3', label: 'فاتورة جديدة', icon: <PlusIcon className="w-6 h-6" />, theme: 'green' },
    { key: 'F4', label: 'دفع نقدي', icon: <DatabaseIcon className="w-6 h-6" />, theme: 'blue' },
    { key: 'F5', label: 'دفع شبكة', icon: <GlobeIcon className="w-6 h-6" />, theme: 'indigo' },
    { key: 'F6', label: 'عمليات أخرى', icon: <MoreVerticalIcon className="w-6 h-6" />, theme: 'slate' },
    { key: 'F7', label: 'تعليق الفاتورة', icon: <PauseIcon className="w-6 h-6" />, theme: 'orange' },
    { key: 'F2', label: 'استعادة', icon: <RefreshCcwIcon className="w-6 h-6" />, theme: 'cyan' },
    { key: 'F8', label: 'طباعة إيصال', icon: <PrintIcon className="w-6 h-6" />, theme: 'slate' },
    { key: 'F9', label: 'حذف صنف', icon: <TrashIcon className="w-6 h-6" />, theme: 'red' },
    { key: 'F10', label: 'مرتجع مبيعات', icon: <ArrowLeftIcon className="w-6 h-6" />, theme: 'rose' },
    { key: 'F11', label: 'اعتماد نهائي', icon: <CheckCircleIcon className="w-6 h-6" />, theme: 'teal' },
    { key: 'F1', label: 'بحث سريع', icon: <SearchIcon className="w-6 h-6" />, theme: 'violet' },
    { key: 'F12', label: 'إغلاق النظام', icon: <XCircleIcon className="w-6 h-6" />, theme: 'red' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-brand-blue shadow-xl p-2">
      {buttons.map((btn) => (
        <FunctionButton 
          key={btn.key}
          config={btn}
          onClick={() => onFunctionClick(btn.key)}
        />
      ))}
    </div>
  );
};

export default Sidebar;
