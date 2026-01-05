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
            font-size: 10px;
            color: #1F2937;
          }
          size: A4;
          margin: 0.5cm 0.5cm 1cm 0.5cm;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
            font-size: 12px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, .no-print * { 
            display: none !important; 
            visibility: hidden !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          thead { 
            display: table-header-group !important; 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tfoot { 
            display: table-footer-group !important; 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table { 
            width: 100% !important; 
            max-width: 100% !important;
            border-collapse: collapse !important; 
            font-size: 11px !important;
            table-layout: fixed !important;
            page-break-inside: auto !important;
          }
          th { 
            font-size: 11px !important; 
            font-weight: bold !important; 
            padding: 12px 6px !important;
            height: auto !important;
            vertical-align: middle !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          td { 
            font-size: 11px !important; 
            padding: 12px 6px !important;
            height: auto !important;
            min-height: 40px !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          tbody tr { 
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: auto !important;
            min-height: 35px !important;
          }
          tbody tr:first-child { background: #FFFFFF !important; }
          tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
          tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
          .bg-\\[\\#1e293b\\] { background-color: #1E40AF !important; }
          .bg-\\[\\#0f172a\\] { background-color: #1E40AF !important; }
          .bg-\\[\\#020617\\] { background-color: #1E40AF !important; }
          .bg-\\[\\#1E40AF\\] { background-color: #1E40AF !important; }
          .text-white { color: white !important; }
          .print-card { 
            margin: 0 !important; 
            padding: 0 !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .print-card > div:first-child { 
            padding: 8px 12px !important; 
            margin-bottom: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .print-card > div:last-child {
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Ensure table container uses full height */
          .overflow-x-auto {
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
          }
          /* Make sure table fills available space */
          html, body {
            height: auto !important;
            width: 100% !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-300 overflow-hidden flex flex-col h-full print-card print:shadow-none print:mt-0 print:rounded-none print:border-0">
      <div className="p-6 border-b border-slate-300 flex justify-between items-center bg-white print:hidden no-print">
        <div></div>
        <button className="text-sm flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-300">
          <DownloadIcon className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>
      
      <div className="overflow-x-auto print:overflow-visible print:w-full">
        <table className="w-full text-sm text-right border-collapse print:text-[11px]">
          <thead className="bg-[#1E40AF] text-white font-bold print:text-[11px] print:sticky print:top-0">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap min-w-[100px] border border-blue-700 text-slate-200 font-bold print:px-2 print:py-3 print:text-[11px]" style={{ width: visibleBranches.length > 0 ? `${100 / (visibleBranches.length + 2)}%` : '15%' }}>
                الشهر
              </th>
              {visibleBranches.map(branch => (
                <th
                  key={branch.id}
                  className="px-6 py-4 whitespace-nowrap font-bold border border-blue-700 print:px-2 print:py-3 print:text-[11px]"
                  style={{ color: '#fff', width: `${100 / (visibleBranches.length + 2)}%` }}
                >
                  <div className="flex flex-col items-start gap-1 print:gap-0 print:items-center">
                    <span className="print:text-[11px] font-bold">{branch.name}</span>
                    <span className="h-1 w-8 rounded-full print:hidden" style={{ backgroundColor: branch.color }}></span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 whitespace-nowrap bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-center border border-indigo-700 print:px-2 print:py-3 print:text-[11px]" style={{ width: visibleBranches.length > 0 ? `${100 / (visibleBranches.length + 2)}%` : '15%' }}>
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
                  className={`transition-colors print:text-[11px] print:min-h-[35px] ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-200'
                  } hover:bg-indigo-100 print:hover:bg-inherit`}
                >
                  <td className="px-6 py-4 font-bold text-slate-800 border border-slate-300 print:px-2 print:py-3 print:text-[11px]">
                    {record.monthName}
                  </td>
                  {visibleBranches.map(branch => (
                    <td
                      key={branch.id}
                      className="px-6 py-4 text-slate-700 font-bold tabular-nums font-mono tracking-tight border border-slate-300 print:px-2 print:py-3 print:text-[11px] print:text-center"
                    >
                      {formatCurrency(record.data[branch.id] || 0)}
                    </td>
                  ))}
                  <td
                    className={`px-6 py-4 font-bold text-indigo-900 tabular-nums text-center border border-slate-300 font-mono tracking-tight print:px-2 print:py-3 print:text-[11px] ${
                      index % 2 === 0 ? 'bg-indigo-50' : 'bg-indigo-100'
                    }`}
                  >
                    {formatCurrency(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="hidden print:table-footer-group">
            <tr className="bg-[#1E40AF] text-white font-bold">
              <td className="px-6 py-4 border border-blue-700 text-white font-bold print:px-2 print:py-3 print:text-[11px]">الإجمالي السنوي</td>
              {visibleBranches.map(branch => (
                <td
                  key={branch.id}
                  className="px-6 py-4 tabular-nums font-mono border border-blue-700 text-white font-bold print:px-2 print:py-3 print:text-[11px] print:text-center"
                >
                  {formatCurrency(branchTotals[branch.id])}
                </td>
              ))}
              <td className="px-6 py-4 tabular-nums text-center font-mono border border-indigo-700 bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold print:px-2 print:py-3 print:text-[11px]">
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