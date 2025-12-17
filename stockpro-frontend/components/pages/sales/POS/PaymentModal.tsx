import React, { useState, useEffect } from 'react';
import type { InvoiceItem } from '../../../../types';
import { 
  XIcon, 
  PrintIcon, 
  CreditCardIcon, 
  BanknoteIcon, 
  PhoneIcon,
  TrashIcon,
  CheckIcon,
  WalletIcon,
  PlusIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
} from '../../../icons';
import { formatNumber } from '../../../../utils/formatting';

// Simple icon components for missing icons
const DeleteIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
    <line x1="18" y1="9" x2="12" y2="15"></line>
    <line x1="12" y1="9" x2="18" y2="15"></line>
  </svg>
);

const CoinsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 6v12M6 12h12"></path>
  </svg>
);

interface Bank {
  id: string | number;
  name: string;
}

type PaymentMethodType = 'CASH' | 'MADA' | 'VISA' | 'APPLEPAY' | 'STCPAY';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  tax: number;
  cartItems: InvoiceItem[];
  onComplete: (payments: { method: PaymentMethodType, amount: number }[]) => void;
  banks?: Bank[];
}

interface PaymentEntry {
  method: PaymentMethodType;
  amount: number;
}

const PaymentMethod = {
  CASH: 'CASH' as PaymentMethodType,
  MADA: 'MADA' as PaymentMethodType,
  VISA: 'VISA' as PaymentMethodType,
  APPLEPAY: 'APPLEPAY' as PaymentMethodType,
  STCPAY: 'STCPAY' as PaymentMethodType,
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, total, subtotal, tax, cartItems, onComplete, banks = []
}) => {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Calculations
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, parseFloat((Math.abs(total) - totalPaid).toFixed(2)));
  const change = totalPaid > Math.abs(total) ? totalPaid - Math.abs(total) : 0;
  const isFullyPaid = totalPaid >= Math.abs(total) - 0.01;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentInput('');
      setPayments([]);
      setIsProcessing(false);
      setShowReceipt(false);
      setTransactionId(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
    }
  }, [isOpen]);

  // Numpad Logic
  const handleNumClick = (num: string) => {
    setCurrentInput(prev => {
      if (prev.includes('.') && num === '.') return prev;
      if (prev.length > 8) return prev;
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const handleClearInput = () => {
    setCurrentInput('');
  };

  // Add Payment Logic
  const handleAddPayment = (method: PaymentMethodType) => {
    if (isFullyPaid && method !== PaymentMethod.CASH) return; 

    let amountToAdd = 0;
    const inputVal = parseFloat(currentInput);

    if (currentInput && !isNaN(inputVal)) {
      amountToAdd = inputVal;
    } else {
      amountToAdd = remaining;
    }

    if (amountToAdd <= 0) return;

    if (method !== PaymentMethod.CASH && amountToAdd > remaining) {
      amountToAdd = remaining;
    }

    setPayments(prev => [...prev, { method, amount: amountToAdd }]);
    setCurrentInput('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessPayment = () => {
    if (!isFullyPaid) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowReceipt(true);
    }, 1000);
  };

  const handleFinalize = () => {
    onComplete(payments);
  };

  // --- KEYBOARD SUPPORT EFFECT ---
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.startsWith('F')) return;

      if (showReceipt) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          handleFinalize();
        }
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleNumClick(e.key);
      }
      else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleNumClick('.');
      }
      else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
      else if (e.key === 'Delete') {
        e.preventDefault();
        handleClearInput();
      }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (isFullyPaid && !currentInput) {
          handleProcessPayment();
        } else {
          handleAddPayment(PaymentMethod.CASH);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showReceipt, isFullyPaid, currentInput, payments, remaining]);

  // Helper to get method name
  const getMethodName = (m: PaymentMethodType) => {
    switch(m) {
      case PaymentMethod.CASH: return 'نقدي';
      case PaymentMethod.MADA: return 'مدى';
      case PaymentMethod.VISA: return 'بطاقة ائتمان';
      case PaymentMethod.APPLEPAY: return 'Apple Pay';
      case PaymentMethod.STCPAY: return 'STC Pay';
      default: return m;
    }
  };

  const getMethodIcon = (m: PaymentMethodType) => {
    switch(m) {
      case PaymentMethod.CASH: return <BanknoteIcon className="w-5 h-5" />;
      case PaymentMethod.APPLEPAY: 
      case PaymentMethod.STCPAY: return <PhoneIcon className="w-5 h-5" />;
      default: return <CreditCardIcon className="w-5 h-5" />;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-royal-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 font-sans">
      
      {/* Receipt for Printing */}
      <div id="printable-receipt" className="hidden">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">POS ROYAL</h1>
          <p>فاتورة ضريبية مبسطة</p>
          <p>رقم: #{transactionId}</p>
          <p>{new Date().toLocaleString('ar-SA')}</p>
        </div>
        <div className="w-full text-left border-t border-b border-black py-2">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>{formatNumber(Math.abs(item.total))}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-2">
          <span>المجموع</span>
          <span>{formatNumber(Math.abs(total))}</span>
        </div>
        <div className="mt-2 border-t pt-2">
          {payments.map((p, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span>{getMethodName(p.method)}</span>
              <span>{formatNumber(p.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-2 border-t pt-2">
          <span>المدفوع</span>
          <span>{formatNumber(totalPaid)}</span>
        </div>
        {change > 0 && (
          <div className="flex justify-between font-bold">
            <span>الباقي</span>
            <span>{formatNumber(change)}</span>
          </div>
        )}
      </div>

      {/* Main UI */}
      {!showReceipt ? (
        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-royal-300">
          
          {/* Left Side: Input & Display */}
          <div className="flex-1 p-6 flex flex-col gap-4 border-l border-royal-200 bg-white">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-2xl font-black text-royal-900 flex items-center gap-2">
                <CoinsIcon className="w-6 h-6 text-gold-500" />
                تحصيل الدفعات
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-500 rounded-full text-royal-400 transition">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Big Display Screen - Dynamic Feedback */}
            <div className={`
              p-5 rounded-2xl shadow-lg mb-2 relative overflow-hidden flex flex-col justify-between h-40 border-b-4 transition-all duration-300
              ${change > 0 
                ? 'bg-emerald-800 border-emerald-500' 
                : 'bg-royal-900 border-gold-500'}
            `}>
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col text-white">
                  <span className="text-white/70 text-xs font-bold uppercase">المطلوب (الإجمالي)</span>
                  <span className="text-2xl font-bold">{formatNumber(Math.abs(total))}</span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-bold uppercase ${change > 0 ? 'text-emerald-200' : 'text-red-300'}`}>
                    {change > 0 ? 'الباقي للعميل (Change)' : 'المتبقي للدفع'}
                  </span>
                  <span className={`text-5xl font-mono font-bold tracking-wider ${change > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {change > 0 ? formatNumber(change) : formatNumber(remaining)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-end z-10 mt-2">
                <div className="text-white/50 text-xs">
                  {currentInput ? 'المبلغ المدخل...' : (remaining > 0 ? 'اضغط Enter لإضافة المبلغ كاش' : 'اكتمل الدفع')}
                </div>
                <div className="text-5xl font-mono font-bold tracking-widest text-gold-400">
                  {currentInput 
                    ? currentInput 
                    : (remaining > 0 ? <span className="opacity-30 text-2xl align-middle">{formatNumber(remaining)}</span> : <span className="opacity-30 text-2xl align-middle">0.00</span>)
                  }
                </div>
              </div>
            </div>

            {/* Payments List */}
            <div className="flex-1 bg-royal-50 rounded-xl border border-royal-200 overflow-hidden flex flex-col">
              <div className="bg-royal-200 p-2 text-xs font-bold text-royal-700 flex justify-between px-4">
                <span>المدفوعات المسجلة</span>
                <span>{formatNumber(totalPaid)} / {formatNumber(Math.abs(total))}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between border-r-4 border-royal-600 animate-fade-in-right">
                    <div className="flex items-center gap-2 text-royal-800 font-bold">
                      {getMethodIcon(p.method)}
                      <span>{getMethodName(p.method)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-lg font-bold">{formatNumber(p.amount)}</span>
                      <button onClick={() => handleRemovePayment(idx)} className="text-red-400 hover:text-red-600 p-1">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="h-full flex items-center justify-center text-royal-300 text-sm">لم يتم إضافة دفعات بعد</div>
                )}
              </div>
            </div>

            {/* Numpad */}
            <div className="h-48 grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-2">
                {[5, 10, 50, 100, 500].map(amt => (
                  <button key={amt} onClick={() => setCurrentInput(amt.toString())} className="flex-1 bg-royal-100 text-royal-800 font-bold rounded-lg hover:bg-royal-200 transition-colors shadow-sm text-lg">{amt}</button>
                ))}
              </div>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6,7,8,9, '.', 0].map(n => (
                  <button key={n} onClick={() => handleNumClick(n.toString())} className="bg-white text-royal-900 text-3xl font-bold rounded-lg border border-royal-200 hover:bg-royal-50 shadow-sm transition-colors active:bg-royal-200">{n}</button>
                ))}
                <button onClick={handleBackspace} onDoubleClick={handleClearInput} className="bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm active:bg-red-200"><DeleteIcon className="w-8 h-8" /></button>
              </div>
            </div>
          </div>

          {/* Right Side: Methods */}
          <div className="w-full md:w-80 bg-royal-800 p-4 flex flex-col gap-3">
            <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2 mb-2">
              <WalletIcon className="w-4 h-4 text-gold-400" />
              اختر طريقة الدفع
            </h3>
            
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              
              {/* CASH BUTTON */}
              <button 
                onClick={() => handleAddPayment(PaymentMethod.CASH)}
                className="w-full p-4 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 bg-green-600 text-white"
                title="اختصار: Enter"
              >
                <BanknoteIcon className="w-7 h-7" />
                <div className="text-right flex-1">
                  <div className="font-bold text-lg">نقدي (CASH)</div>
                  <div className="text-[10px] opacity-80">أو اضغط Enter</div>
                </div>
                <ChevronRightIcon className="w-5 h-5 opacity-50" />
              </button>

              {/* OTHER METHODS */}
              {[
                { m: PaymentMethod.MADA, label: 'شبكة / مدى', sub: 'MADA', icon: CreditCardIcon, color: 'bg-blue-600' },
                { m: PaymentMethod.VISA, label: 'فيزا / ماستر', sub: 'CREDIT', icon: CreditCardIcon, color: 'bg-indigo-600' },
                { m: PaymentMethod.APPLEPAY, label: 'Apple Pay', sub: 'NFC', icon: PhoneIcon, color: 'bg-gray-700' },
              ].map((opt) => (
                <button 
                  key={opt.m}
                  onClick={() => handleAddPayment(opt.m)}
                  disabled={isFullyPaid}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95
                    ${isFullyPaid ? 'opacity-40 cursor-not-allowed grayscale bg-gray-600' : `${opt.color} text-white`}
                  `}
                >
                  <opt.icon className="w-6 h-6" />
                  <div className="text-right flex-1">
                    <div className="font-bold text-sm">{opt.label}</div>
                    <div className="text-[10px] opacity-80">{opt.sub}</div>
                  </div>
                  <PlusIcon className="w-4 h-4 opacity-50" />
                </button>
              ))}

              <button 
                disabled 
                className="w-full p-3 rounded-xl flex items-center gap-3 bg-white/10 text-white/50 border border-white/10 cursor-not-allowed"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                <div className="text-right flex-1">
                  <div className="font-bold text-sm">تمارا / تابي</div>
                  <div className="text-[10px]">قريباً</div>
                </div>
              </button>

            </div>

            <button
              onClick={handleProcessPayment}
              disabled={!isFullyPaid || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 mt-auto border-2 border-royal-900 ${
                !isFullyPaid 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gold-500 text-royal-900 hover:bg-gold-400'
              }`}
            >
              {isProcessing ? (
                <span className="animate-spin w-6 h-6 border-2 border-royal-900 border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <CheckIcon className="w-6 h-6" />
                  <span>إتمام وطباعة ({formatNumber(totalPaid)})</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        /* Success Screen */
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-fade-in-up border-4 border-royal-900">
          <div className="w-24 h-24 bg-gold-100 rounded-full flex items-center justify-center mx-auto text-gold-600 shadow-inner">
            <CheckIcon className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-royal-900">تم الحفظ بنجاح</h2>
            <p className="text-gray-500 mt-2 font-mono">#{transactionId}</p>
          </div>
          
          <div className="bg-royal-50 p-4 rounded-xl text-left space-y-2 text-sm border border-royal-100">
            <div className="flex justify-between border-b pb-2 mb-2">
              <span className="text-royal-500">الإجمالي المطلوب</span>
              <span className="font-bold text-lg">{formatNumber(Math.abs(total))}</span>
            </div>
            {payments.map((p, i) => (
              <div key={i} className="flex justify-between font-bold text-royal-800">
                <span>{getMethodName(p.method)}</span>
                <span>{formatNumber(p.amount)}</span>
              </div>
            ))}
            
            {change > 0 && (
              <div className="bg-green-100 p-3 rounded-lg flex justify-between items-center text-green-800 font-bold mt-2 border border-green-200 shadow-sm">
                <span>الباقي للعميل (Change)</span>
                <span className="text-2xl">{formatNumber(change)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-3 bg-royal-100 text-royal-900 rounded-xl font-bold hover:bg-royal-200 transition flex items-center justify-center gap-2"
            >
              <PrintIcon className="w-5 h-5" />
              <span>طباعة</span>
            </button>
            <button 
              onClick={handleFinalize}
              className="flex-1 py-3 bg-royal-900 text-white rounded-xl font-bold hover:bg-royal-800 transition"
            >
              فاتورة جديدة (Enter)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;
