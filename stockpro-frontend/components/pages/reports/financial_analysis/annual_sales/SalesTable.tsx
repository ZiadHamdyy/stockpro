import React from 'react';
import { SalesRecord, Branch } from '../types';
import { DownloadIcon } from '../../../../icons';

interface SalesTableProps {
  data: SalesRecord[];
  branches: Branch[];
  selectedBranches: string[];
}

export const SalesTable: React.FC<SalesTableProps> = ({ data, branches, selectedBranches }) => {
  const visibleBranches = branches.filter(b => selectedBranches.includes(b.id));

  // Use en-US locale for English digits (0-9)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const branchTotals: Record<string, number> = {};
  visibleBranches.forEach(b => branchTotals[b.id] = 0);
  
  data.forEach(record => {
    visibleBranches.forEach(b => {
      branchTotals[b.id] += (record.data[b.id] || 0);
    });
  });

  return (
    <>
      <style>{`
        @page {
          @bottom-center {
            content: counter(page) " / " counter(pages);
            font-family: "Cairo", sans-serif;
            font-size: 12px;
            color: #1F2937;
          }
        }
        @media print {
          body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
          .no-print, .no-print * { display: none !important; visibility: hidden !important; }
          thead { display: table-header-group; }
          tfoot { display: table-row-group !important; }
          table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
          th { font-size: 13px !important; font-weight: bold !important; padding: 6px 8px !important; }
          td { font-size: 13px !important; padding: 6px 8px !important; }
          tbody tr:first-child { background: #FFFFFF !important; }
          tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
          tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
          tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          .bg-\\[\\#1e293b\\] { background-color: #1e293b !important; }
          .bg-\\[\\#0f172a\\] { background-color: #0f172a !important; }
          .bg-\\[\\#020617\\] { background-color: #020617 !important; }
          .text-white { color: white !important; }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-300 overflow-hidden flex flex-col h-full print-card print:shadow-none">
      <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-white print:p-4">
        <h3 className="text-xl font-bold text-[#0f172a] flex items-center gap-3 print:text-lg">
          <span className="w-1.5 h-6 bg-emerald-600 rounded-full"></span>
          جدول البيانات التفصيلي
        </h3>
        <button className="text-sm flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-300 no-print">
          <DownloadIcon className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right border-collapse print:text-xs">
          <thead className="bg-[#1e293b] text-white font-bold print:text-xs">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap min-w-[100px] border border-slate-600 text-slate-200 print:px-4 print:py-2">
                الشهر
              </th>
              {visibleBranches.map(branch => (
                <th
                  key={branch.id}
                  className="px-6 py-4 whitespace-nowrap font-bold border border-slate-600 print:px-4 print:py-2"
                  style={{ color: '#fff' }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span>{branch.name}</span>
                    <span className="h-1 w-8 rounded-full" style={{ backgroundColor: branch.color }}></span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 whitespace-nowrap bg-slate-900 text-white font-extrabold text-center border border-slate-600 print:px-4 print:py-2">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {data.map((record, index) => {
              const rowTotal = visibleBranches.reduce((sum, b) => sum + (record.data[b.id] || 0), 0);
              return (
                <tr 
                  key={record.monthIndex} 
                  className={`transition-colors print:text-xs ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-200'
                  } hover:bg-indigo-100`}
                >
                  <td className="px-6 py-4 font-bold text-slate-800 border border-slate-300 print:px-4 print:py-2">
                    {record.monthName}
                  </td>
                  {visibleBranches.map(branch => (
                    <td
                      key={branch.id}
                      className="px-6 py-4 text-slate-700 font-semibold tabular-nums font-mono tracking-tight border border-slate-300 print:px-4 print:py-2"
                    >
                      {formatCurrency(record.data[branch.id] || 0)}
                    </td>
                  ))}
                  <td
                    className={`px-6 py-4 font-bold text-[#0f172a] tabular-nums text-center border border-slate-300 font-mono tracking-tight print:px-4 print:py-2 ${
                      index % 2 === 0 ? 'bg-slate-100' : 'bg-slate-300'
                    }`}
                  >
                    {formatCurrency(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#0f172a] text-white font-bold print:bg-slate-200 print:text-black print:border-t-2 print:border-black print:text-xs">
            <tr>
              <td className="px-6 py-5 border border-slate-700 print:px-4 print:py-3">الإجمالي السنوي</td>
              {visibleBranches.map(branch => (
                <td
                  key={branch.id}
                  className="px-6 py-5 tabular-nums text-emerald-300 print:text-black font-mono border border-slate-700 print:px-4 print:py-3"
                >
                  {formatCurrency(branchTotals[branch.id])}
                </td>
              ))}
              <td className="px-6 py-5 tabular-nums text-white text-base bg-[#020617] text-center print:text-black print:bg-slate-300 font-mono border border-slate-700 print:px-4 print:py-3">
                 {formatCurrency(Object.values(branchTotals).reduce((a, b) => a + b, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {visibleBranches.length === 0 && (
        <div className="p-12 text-center text-slate-400 font-medium">
          الرجاء اختيار فرع واحد على الأقل لعرض البيانات
        </div>
      )}
    </div>
    </>
  );
};