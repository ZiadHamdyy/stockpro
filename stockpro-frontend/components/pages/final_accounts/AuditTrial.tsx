import React, { useState, useMemo } from 'react';
import { useAuditTrial } from '../../hook/useAuditTrial';
import PermissionWrapper from '../../common/PermissionWrapper';
import {
  Resources,
  Actions,
  buildPermission,
} from '../../../enums/permissions.enum';

interface TrialBalanceEntry {
  id: string;
  accountCode: string;
  accountName: string;
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  openingBalanceDebit: number;
  openingBalanceCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingBalanceDebit: number;
  closingBalanceCredit: number;
}

interface FinancialSummary {
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
}

const AuditTrial: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(`${currentYear}-12-31`);
  const [reportDate] = useState(new Date().toISOString().split('T')[0]);

  const {
    data: auditTrialData,
    companyInfo,
    isLoading,
    error,
  } = useAuditTrial(fromDate, toDate);

  const data = auditTrialData?.entries || [];

  const summary = useMemo((): FinancialSummary => {
    return data.reduce((acc, curr) => ({
      totalOpeningDebit: acc.totalOpeningDebit + curr.openingBalanceDebit,
      totalOpeningCredit: acc.totalOpeningCredit + curr.openingBalanceCredit,
      totalPeriodDebit: acc.totalPeriodDebit + curr.periodDebit,
      totalPeriodCredit: acc.totalPeriodCredit + curr.periodCredit,
      totalClosingDebit: acc.totalClosingDebit + curr.closingBalanceDebit,
      totalClosingCredit: acc.totalClosingCredit + curr.closingBalanceCredit,
    }), {
      totalOpeningDebit: 0, totalOpeningCredit: 0,
      totalPeriodDebit: 0, totalPeriodCredit: 0,
      totalClosingDebit: 0, totalClosingCredit: 0
    });
  }, [data]);

  const isClosingBalanced = Math.abs(summary.totalClosingDebit - summary.totalClosingCredit) < 0.01;
  const currency = auditTrialData?.currency || companyInfo?.currency || 'SAR';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002366] mx-auto mb-4"></div>
          <p className="text-[#002366] font-bold">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">حدث خطأ أثناء تحميل البيانات</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#002366] text-white rounded-md hover:bg-blue-900"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper
      requiredPermission={buildPermission(Resources.AUDIT_TRAIL, Actions.READ)}
      fallback={
        <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-bold">ليس لديك صلاحية لعرض هذه الصفحة</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-[#f1f5f9] text-[#1e293b] pb-20 font-sans leading-relaxed selection:bg-blue-100">
        {/* Navigation Header - Hidden in Print */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm print:hidden">
          <div className="max-w-[1450px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#002366] rounded-lg flex items-center justify-center text-white shadow-md">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h1 className="text-xl font-black text-[#002366]">نظام التقارير المالية الذكي</h1>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-2 shadow-inner">
                 <div className="px-3 py-1 flex flex-col">
                   <span className="text-[9px] font-black text-slate-400">الفترة من</span>
                   <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs font-black text-[#002366] outline-none" />
                 </div>
                 <div className="w-px bg-slate-300 h-5 self-center"></div>
                 <div className="px-3 py-1 flex flex-col">
                   <span className="text-[9px] font-black text-slate-400">إلى</span>
                   <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs font-black text-[#002366] outline-none" />
                 </div>
              </div>
               <button onClick={() => window.print()} className="bg-[#002366] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md font-bold text-sm">
                  <i className="fas fa-print"></i>
                  <span>طباعة التقرير</span>
                </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1450px] mx-auto px-8 mt-6">
          
          {/* Company Info Frame - Now strictly positioned above the table */}
          <div className="bg-white border-x-2 border-t-2 border-slate-300 rounded-t-[2rem] p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative">
            <div className="flex gap-6 items-center">
              <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center">
                 <i className="fas fa-building text-3xl text-[#002366]"></i>
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#002366]">{companyInfo?.name || 'شركة'}</h2>
                <div className="flex gap-4 text-xs font-bold text-slate-500 mt-1">
                  {companyInfo?.taxNumber && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded">الرقم الضريبي: {companyInfo.taxNumber}</span>
                  )}
                  {companyInfo?.address && <span>{companyInfo.address}</span>}
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-1">
               <h3 className="text-lg font-black text-slate-700 underline decoration-[#002366] underline-offset-4 decoration-2">ميزان المراجعة التحليلي للفترة المحددة</h3>
               <div className="text-[11px] font-bold text-slate-400 flex justify-center md:justify-end gap-3 uppercase">
                  <span>تاريخ التقرير: {reportDate}</span>
                  <span>•</span>
                  <span>العملة: {currency}</span>
               </div>
            </div>
          </div>
          
          {/* Trial Balance Table - Integrated with Company Info */}
          <div className="bg-white border-2 border-slate-300 shadow-2xl overflow-hidden rounded-b-[2rem] print:shadow-none print:border-slate-400">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#002366] text-white">
                  <th rowSpan={2} className="px-4 py-3 text-xs font-black border-l border-white/10 w-24">كود الحساب</th>
                  <th rowSpan={2} className="px-6 py-3 text-sm font-black border-l border-white/20">اسم الحساب (البيان)</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b border-l border-white/20 bg-[#001a4d]">الأرصدة الافتتاحية</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b border-l border-white/20 bg-[#00143a]">حركات الفترة</th>
                  <th colSpan={2} className="px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b bg-[#000d26]">الأرصدة الختامية</th>
                </tr>
                <tr className="bg-[#002366] text-[10px] font-black border-b-2 border-white/30">
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-300">مدين (+)</th>
                  <th className="px-2 py-2 text-center border-l border-white/30 text-rose-300 shadow-[inset_-3px_0_0_white]">دائن (-)</th>
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-300">مدين (+)</th>
                  <th className="px-2 py-2 text-center border-l border-white/30 text-rose-300 shadow-[inset_-3px_0_0_white]">دائن (-)</th>
                  <th className="px-2 py-2 text-center border-l border-white/10 text-blue-200">مدين (+)</th>
                  <th className="px-2 py-2 text-center text-rose-200">دائن (-)</th>
                </tr>
              </thead>
              
              <tbody className="text-[13px] font-bold">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      لا توجد بيانات للعرض
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={`
                        group transition-all duration-75
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-200/80'} 
                        hover:bg-blue-600 hover:text-white
                      `}
                    >
                      <td className="px-4 py-1.5 font-mono text-slate-500 border-l border-slate-300/30 group-hover:text-blue-100">{item.accountCode}</td>
                      <td className="px-6 py-1.5 text-slate-800 border-l border-slate-300/30 group-hover:text-white">{item.accountName}</td>
                      
                      {/* Financial Data Columns */}
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-700 group-hover:text-white">
                        {item.openingBalanceDebit > 0 ? item.openingBalanceDebit.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-700 group-hover:text-white shadow-[3px_0_0_white]">
                        {item.openingBalanceCredit > 0 ? item.openingBalanceCredit.toLocaleString() : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-800 bg-blue-50/10 group-hover:bg-transparent group-hover:text-white">
                        {item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-800 bg-rose-50/10 group-hover:bg-transparent group-hover:text-white shadow-[3px_0_0_white]">
                        {item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-900 bg-blue-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceDebit > 0 ? item.closingBalanceDebit.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-900 bg-rose-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceCredit > 0 ? item.closingBalanceCredit.toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr className="bg-[#001a4d] text-white border-t-4 border-white">
                  <td colSpan={2} className="px-6 py-4 text-base font-black text-left pr-8 border-l border-white/10 uppercase italic">إجماليات الميزان النهائية</td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">{summary.totalOpeningDebit.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">{summary.totalOpeningCredit.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">{summary.totalPeriodDebit.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">{summary.totalPeriodCredit.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-lg font-black text-blue-200 bg-blue-950 underline decoration-double">{summary.totalClosingDebit.toLocaleString()}</td>
                  <td className="px-3 py-4 text-center text-lg font-black text-rose-200 bg-rose-950 underline decoration-double">{summary.totalClosingCredit.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Simplified Status Bar */}
          <div className="mt-8 flex justify-center">
             <div className={`w-full max-w-4xl flex items-center justify-between px-10 py-5 border-2 rounded-2xl bg-white shadow-lg ${isClosingBalanced ? 'border-emerald-500' : 'border-rose-500'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md ${isClosingBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}>
                    <i className={`fas ${isClosingBalanced ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{isClosingBalanced ? 'ميزان المراجعة متوازن' : 'يوجد فارق في التوازن المالي'}</h4>
                    <p className="text-xs font-bold text-slate-400">تنبيه آلي من النظام المحاسبي للتدقيق المالي</p>
                  </div>
                </div>
                
                {!isClosingBalanced && (
                  <div className="bg-rose-50 px-6 py-2.5 rounded-xl border-2 border-rose-100 flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">قيمة الفارق</span>
                    <span className="text-2xl font-black text-rose-600 font-mono italic">{Math.abs(summary.totalClosingDebit - summary.totalClosingCredit).toLocaleString()}</span>
                  </div>
                )}
             </div>
          </div>

        </main>

        <footer className="max-w-[1450px] mx-auto px-8 mt-12 border-t border-slate-300 pt-6 flex justify-between items-center text-slate-400 text-[10px] no-print font-black uppercase tracking-[0.3em]">
          <p>Advanced ERP Systems © {new Date().getFullYear()}</p>
          <div className="flex gap-8">
            <span>Security Protocol: AES-256</span>
            <span>Doc ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            <span>صفحة 1 / 1</span>
          </div>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 0.3cm;
          }
          
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; font-size: 7.5pt; color: black !important; }
            .max-w-\[1450px\] { max-width: 100% !important; margin: 0 !important; }
            header { display: none !important; }
            .shadow-2xl, .shadow-lg, .shadow-sm { box-shadow: none !important; }
            table { border: 2px solid #000 !important; }
            th { background-color: #002366 !important; color: white !important; -webkit-print-color-adjust: exact; padding: 4px !important; border-color: #fff !important; }
            td { padding: 3px 6px !important; border-bottom: 1px solid #ddd !important; }
            tr.bg-slate-200\/80 { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
            .rounded-t-\[2rem\], .rounded-b-\[2rem\] { border-radius: 0 !important; }
            .border-b-2 { border-bottom-width: 2px !important; border-color: #000 !important; }
            .border-l-\[3px\] { border-left-width: 4px !important; border-color: #fff !important; }
            .shadow-\[3px_0_0_white\] { box-shadow: 4px 0 0 white !important; }
          }

          input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
            filter: invert(10%) sepia(90%) saturate(6000%) hue-rotate(220deg);
          }
        `}</style>
      </div>
    </PermissionWrapper>
  );
};

export default AuditTrial;
