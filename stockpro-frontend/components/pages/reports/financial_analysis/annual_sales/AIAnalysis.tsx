import React from 'react';
import { SparklesIcon, Loader2Icon, AlertCircleIcon } from '../../../../icons';
import { AnalysisStatus } from '../types';

interface AIAnalysisProps {
  status: AnalysisStatus;
  result: string;
  onAnalyze: () => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ status, result, onAnalyze }) => {
  // If idle in print mode, hide completely
  if (status === 'idle' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) {
     return null;
  }

  return (
    <div className={`
      bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden ai-result-container
      ${status === 'idle' ? 'print:hidden' : ''}
    `}>
      {/* Background Decor - Hidden in Print */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full -translate-x-20 -translate-y-20 blur-3xl no-print"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500 opacity-5 rounded-full translate-x-20 translate-y-20 blur-3xl no-print"></div>
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1 print:text-black">
            <SparklesIcon className="w-5 h-5 text-yellow-400 print:text-black" />
            تحليل الأداء الذكي
          </h2>
          <p className="text-indigo-200 text-sm opacity-80 print:hidden">مدعوم بواسطة Gemini 2.5 Flash</p>
        </div>
        
        {status !== 'loading' && (
          <button
            onClick={onAnalyze}
            className="bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ai-actions shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95 no-print"
          >
            {status === 'idle' ? 'تحليل البيانات الآن' : 'تحديث التحليل'}
            <SparklesIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative z-10 min-h-[60px]">
        {status === 'idle' && (
          <div className="text-center py-8 text-indigo-200/60 border-2 border-dashed border-indigo-500/30 rounded-xl bg-black/20 no-print">
            اضغط على زر التحليل لتوليد تقرير ذكي واستخراج الرؤى الاستراتيجية
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 no-print">
            <Loader2Icon className="w-8 h-8 animate-spin text-yellow-400" />
            <span className="text-indigo-200 animate-pulse font-medium">جاري معالجة البيانات واستخراج الرؤى...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-200 flex items-center gap-3 no-print">
            <AlertCircleIcon className="w-5 h-5" />
            <span>حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.</span>
          </div>
        )}

        {status === 'success' && result && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-indigo-50 leading-loose whitespace-pre-line animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-inner print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
            {result}
          </div>
        )}
      </div>
    </div>
  );
};