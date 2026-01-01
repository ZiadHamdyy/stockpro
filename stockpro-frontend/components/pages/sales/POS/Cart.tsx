import React, { useRef, useEffect } from 'react';
import type { InvoiceItem } from '../../../../types';
import { formatNumber } from '../../../../utils/formatting';
import { tafqeet } from '../../../../utils/tafqeet';
import { DatabaseIcon, TrashIcon, PrintIcon } from '../../../icons';

// Simple icon components for AI features
const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const BrainCircuitIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3.2 3.2 0 0 0 .164-.546c.628-.5 1.2-1.1 1.6-1.8a3.2 3.2 0 0 0 .164-.546 4 4 0 0 0 2.526-5.77 4 4 0 0 0-.556-6.588A4 4 0 0 0 12 5Z"></path>
    <path d="M8 12h.01M16 12h.01M11 8h.01M13 16h.01"></path>
  </svg>
);
import PermissionWrapper from '../../../common/PermissionWrapper';
import { Resources, Actions, buildPermission } from '../../../../enums/permissions.enum';

interface CartProps {
  cartItems: InvoiceItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
  onRemoveItem: (id: string) => void;
  onAnalyze: () => void;
  subtotal: number;
  tax: number;
  total: number;
  isAnalyzing: boolean;
  aiInsight: any;
  discount: number;
  vatRate: number;
  currency?: string;
  onOpenPayment?: () => void;
  isViewingSavedInvoice?: boolean;
  onPrint?: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onAnalyze,
  subtotal,
  tax,
  total,
  isAnalyzing,
  aiInsight,
  discount,
  vatRate,
  currency = 'SAR',
  onOpenPayment,
  isViewingSavedInvoice = false,
  onPrint,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const bodyElement = bodyScrollRef.current;
    const headerElement = headerScrollRef.current;

    if (!bodyElement || !headerElement) return;

    let isSyncing = false;

    const handleBodyScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      headerElement.scrollLeft = bodyElement.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const handleHeaderScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      bodyElement.scrollLeft = headerElement.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    bodyElement.addEventListener('scroll', handleBodyScroll, { passive: true });
    headerElement.addEventListener('scroll', handleHeaderScroll, { passive: true });

    return () => {
      bodyElement.removeEventListener('scroll', handleBodyScroll);
      headerElement.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  useEffect(() => {
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollTop = bodyScrollRef.current.scrollHeight;
    }
  }, [cartItems.length]);

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* AI Bar */}
      {aiInsight ? (
        <div className="bg-indigo-50 border-b border-indigo-100 p-2 flex items-center justify-between text-xs animate-fade-in shadow-inner">
          <div className="flex items-center gap-2 text-indigo-800">
            <BrainCircuitIcon className="w-4 h-4" />
            <span className="font-bold">اقتراح ذكي:</span>
            <span>{aiInsight.suggestion}</span>
          </div>
          {aiInsight.missingEssentials?.length > 0 && (
            <div className="flex gap-1">
              {aiInsight.missingEssentials.map((item: string, idx: number) => (
                <span key={idx} className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-indigo-200">{item}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border-b border-blue-200 p-1 flex justify-center">
            <button onClick={onAnalyze} disabled={isAnalyzing || cartItems.length === 0} className="text-[10px] flex items-center gap-1 text-brand-blue hover:text-blue-900 transition">
            <SparklesIcon className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>تحليل الفاتورة بالذكاء الاصطناعي</span>
          </button>
        </div>
      )}

      {/* Table Container with Horizontal Scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table Header - BIGGER AND BOLDER as requested - Scrollable horizontally */}
        <div 
          ref={headerScrollRef}
          className="bg-brand-blue text-white py-4 pr-1 shadow-md border-b-4 border-gold-500 overflow-x-auto overflow-y-hidden no-scrollbar"
          onScroll={(e) => {
            if (bodyScrollRef.current) {
              bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <div className="grid text-center items-center divide-x divide-blue-500 divide-x-reverse tracking-wide text-xl font-extrabold min-h-[56px]" style={{ gridTemplateColumns: 'minmax(60px, 0.5fr) minmax(120px, 1fr) minmax(200px, 2fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(80px, 0.8fr) minmax(120px, 1fr) minmax(60px, 0.5fr)' }}>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">م</div>
            <div className="whitespace-nowrap px-3 h-full flex items-center justify-center text-white font-extrabold">رقم الصنف</div>
            <div className="whitespace-nowrap px-4 h-full flex items-center justify-center text-white font-extrabold">الصنف</div>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">الوحدة</div>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">الكمية</div>
            <div className="whitespace-nowrap px-3 h-full flex items-center justify-center text-white font-extrabold">السعر</div>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">الخصم</div>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">الضريبة</div>
            <div className="whitespace-nowrap px-3 h-full flex items-center justify-center text-white font-extrabold">الإجمالي</div>
            <div className="whitespace-nowrap px-2 h-full flex items-center justify-center text-white font-extrabold">حذف</div>
          </div>
        </div>

        {/* Scrollable Table Body Container */}
        <div 
          ref={bodyScrollRef}
          className="flex-1 overflow-y-auto overflow-x-auto bg-white relative"
          onScroll={(e) => {
            if (headerScrollRef.current) {
              headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
        >
          <div className="min-h-full relative">
            {cartItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300 pointer-events-none">
                <div className="text-6xl mb-2 opacity-30 grayscale">🛒</div>
                <p className="font-bold text-blue-400">قائمة الفاتورة فارغة</p>
              </div>
            )}
        
        {cartItems.map((item, index) => {
          const itemTax = Number(item.taxAmount) || 0;
          const net = Number(item.total) || 0;
          
          return (
            <div key={item.id} className="grid text-center items-stretch border-b border-blue-100 text-sm cursor-pointer group hover:bg-gold-50 bg-white divide-x divide-blue-200 divide-x-reverse h-12 transition-colors font-bold text-blue-900" style={{ gridTemplateColumns: 'minmax(60px, 0.5fr) minmax(120px, 1fr) minmax(200px, 2fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(80px, 0.8fr) minmax(120px, 1fr) minmax(60px, 0.5fr)' }}>
              <div className="font-mono text-blue-500 font-bold h-full flex items-center justify-center bg-transparent opacity-70 text-xs whitespace-nowrap px-2">{index + 1}</div>
              <div className="font-mono text-blue-800 font-black h-full flex items-center justify-center text-sm whitespace-nowrap px-3">{item.id.padStart(6, '0')}</div>
              <div className="text-right pr-2 font-bold text-blue-950 h-full flex items-center justify-start text-sm whitespace-nowrap px-4">{item.name}</div>
              <div className="text-brand-blue h-full flex items-center justify-center font-bold text-xs whitespace-nowrap px-2">{item.unit || 'حبة'}</div>
              <div className="p-1 h-full flex items-center justify-center whitespace-nowrap">
                <PermissionWrapper
                  requiredPermission={buildPermission(
                    Resources.SALES_INVOICE,
                    Actions.UPDATE
                  )}
                  fallback={
                    <input 
                      type="number" 
                      value={Math.abs(item.qty)}
                      disabled
                      className="w-full h-8 text-center border border-blue-300 rounded bg-gray-100 opacity-50 cursor-not-allowed font-black text-lg text-blue-900"
                    />
                  }
                >
                  <input 
                    type="number" 
                    value={Math.abs(item.qty)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) - item.qty)}
                    className="w-full h-8 text-center border border-blue-300 rounded focus:ring-2 focus:ring-brand-blue outline-none bg-white font-black text-lg text-blue-900 shadow-sm"
                  />
                </PermissionWrapper>
              </div>
              <div className="p-1 h-full flex items-center justify-center whitespace-nowrap">
                <PermissionWrapper
                  requiredPermission={buildPermission(
                    Resources.SALES_INVOICE,
                    Actions.UPDATE
                  )}
                  fallback={
                    <div className="font-mono font-bold text-brand-blue h-full flex items-center justify-center whitespace-nowrap px-3 w-full">{formatNumber(Math.abs(item.price))}</div>
                  }
                >
                  <input 
                    type="number" 
                    value={Math.abs(item.price)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      onUpdatePrice(item.id, newPrice);
                    }}
                    className="w-full h-8 text-center border border-blue-300 rounded focus:ring-2 focus:ring-brand-blue outline-none bg-white font-mono font-bold text-lg text-brand-blue shadow-sm"
                    step="0.01"
                    min="0"
                  />
                </PermissionWrapper>
              </div>
              <div className="text-red-500 font-mono h-full flex items-center justify-center opacity-70 whitespace-nowrap px-2">0.00</div>
              <div className="text-blue-500 font-mono h-full flex items-center justify-center text-xs whitespace-nowrap px-2">{formatNumber(itemTax)}</div>
              <div className="font-black text-blue-900 font-mono group-hover:bg-gold-200/50 h-full flex items-center justify-center text-base whitespace-nowrap px-3">{formatNumber(net)}</div>
              <div className="h-full flex items-center justify-center whitespace-nowrap px-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors group-hover:bg-red-100"
                  title="حذف الصنف"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
          </div>
        </div>
      </div>

      {/* Footer Totals */}
      <div className="bg-blue-50 border-t-2 border-blue-200 p-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          {isViewingSavedInvoice ? (
            <button 
              onClick={onPrint}
              className="group relative flex items-center gap-4 p-3 bg-brand-blue transition-all h-[calc(100%/12)] border-b border-white/5 hover:bg-blue-700 active:bg-black/10 duration-200 overflow-hidden rounded-lg"
            >
              {/* Icon Container - Always Colored */}
              <div className="p-2 rounded-lg flex items-center justify-center transition-all duration-200 bg-blue-500/20 text-blue-300 group-hover:scale-110 shadow-sm ring-1 ring-white/10">
                <PrintIcon className="w-6 h-6" />
              </div>
              
              {/* Label - Beside Icon */}
              <span className="text-sm font-bold text-white leading-tight transition-colors group-hover:text-gold-400 group-hover:drop-shadow-sm text-right flex-1 truncate tracking-wide">
                طباعة
              </span>

              {/* Side Active Indicator Bar */}
              <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-transparent transition-colors group-hover:border-blue-400"></div>
            </button>
          ) : (
            <button 
              onClick={onOpenPayment}
              className="group relative flex items-center gap-4 p-3 bg-brand-blue transition-all h-[calc(100%/12)] border-b border-white/5 hover:bg-blue-700 active:bg-black/10 duration-200 overflow-hidden rounded-lg"
            >
              {/* Icon Container - Always Colored */}
              <div className="p-2 rounded-lg flex items-center justify-center transition-all duration-200 bg-blue-500/20 text-blue-300 group-hover:scale-110 shadow-sm ring-1 ring-white/10">
                <DatabaseIcon className="w-6 h-6" />
              </div>
              
              {/* Label - Beside Icon */}
              <span className="text-sm font-bold text-white leading-tight transition-colors group-hover:text-gold-400 group-hover:drop-shadow-sm text-right flex-1 truncate tracking-wide">
                دفع نقدي
              </span>
              
              {/* F-Key Badge */}
              <span className="absolute top-1 left-1 text-[10px] font-mono text-blue-300 opacity-60 group-hover:opacity-100 group-hover:text-gold-400 font-bold px-1">
                F4
              </span>

              {/* Side Active Indicator Bar */}
              <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-transparent transition-colors group-hover:border-blue-400"></div>
            </button>
          )}
          
          <div className="flex-1 bg-white border border-blue-300 rounded p-1 flex justify-between items-center shadow-sm">
            <span className="font-bold text-blue-800 px-2 flex-1 text-center text-xs leading-tight">{tafqeet(Math.abs(total), currency)}</span>
          </div>

          <div className="flex gap-2 bg-blue-200 p-1.5 rounded-lg border border-blue-300 shadow-inner">
          <div className="text-center bg-white rounded border border-blue-300 overflow-hidden min-w-[90px]">
              <div className="text-[10px] text-blue-500 font-bold bg-blue-50 border-b border-blue-200">السعر قبل الضريبة</div>
              <div className="font-mono text-blue-800 font-bold py-1 text-sm">{formatNumber(subtotal - discount)}</div>
            </div>
            <div className="text-center bg-white rounded border border-blue-300 overflow-hidden min-w-[90px]">
              <div className="text-[10px] text-blue-500 font-bold bg-blue-50 border-b border-blue-200">الخصم</div>
              <div className="font-mono text-red-600 font-bold py-1 text-sm">{formatNumber(discount)}</div>
            </div>
            
            <div className="text-center bg-white rounded border border-blue-300 overflow-hidden min-w-[90px]">
              <div className="text-[10px] text-blue-500 font-bold bg-blue-50 border-b border-blue-200">الضريبة</div>
              <div className="font-mono text-blue-800 font-bold py-1 text-sm">{formatNumber(tax)}</div>
            </div>
            {/* Total Box - Updated colors */}
            <div className="text-center bg-brand-blue rounded border-2 border-blue-900 overflow-hidden min-w-[140px] shadow-lg transform scale-105 origin-right">
              <div className="text-[10px] text-blue-100 font-bold bg-blue-900 border-b border-blue-700">الإجمالي النهائي</div>
              <div className="font-mono text-white text-2xl font-black py-0.5 tracking-wide text-gold-400">{formatNumber(Math.abs(total))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
