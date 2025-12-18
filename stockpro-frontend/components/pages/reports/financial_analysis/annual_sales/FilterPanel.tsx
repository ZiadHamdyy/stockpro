import React from 'react';
import { Branch } from '../types';
import { FilterIcon, CheckIcon } from '../../../../icons';

interface FilterPanelProps {
  branches: Branch[];
  selectedBranches: string[];
  onToggleBranch: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  branches,
  selectedBranches,
  onToggleBranch,
  onSelectAll,
  onClearAll,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 filter-panel">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-[#0f172a] font-bold text-lg">
          <div className="bg-slate-100 p-1.5 rounded-lg">
             <FilterIcon className="w-5 h-5 text-slate-600" />
          </div>
          <span>تصفية الفروع</span>
        </div>
        <div className="flex gap-2 text-sm">
          <button 
            onClick={onSelectAll}
            className="text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            تحديد الكل
          </button>
          <span className="text-slate-300 self-center">|</span>
          <button 
            onClick={onClearAll}
            className="text-slate-500 hover:text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            إلغاء التحديد
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {branches.map((branch) => {
          const isSelected = selectedBranches.includes(branch.id);
          return (
            <button
              key={branch.id}
              onClick={() => onToggleBranch(branch.id)}
              className={`
                flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
                ${isSelected 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md transform scale-105' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}
              `}
            >
              <span 
                className={`w-3 h-3 rounded-full shadow-sm ring-2 ring-white`}
                style={{ backgroundColor: branch.color }} 
              />
              {branch.name}
              {isSelected && <CheckIcon className="w-4 h-4 text-emerald-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};