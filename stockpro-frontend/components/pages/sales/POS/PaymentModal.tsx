import React, { useState, useEffect, useCallback } from 'react';
import type { InvoiceItem, User, Safe } from '../../../../types';
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

type PaymentMode = 'safe' | 'bank' | 'split';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  tax: number;
  cartItems: InvoiceItem[];
  onComplete: (paymentData: {
    paymentMode: PaymentMode;
    paymentTargetType: 'safe' | 'bank' | null;
    paymentTargetId: string | null;
    isSplitPayment: boolean;
    splitCashAmount?: number;
    splitBankAmount?: number;
    splitSafeId?: string | null;
    splitBankId?: string | null;
    bankTransactionType?: 'POS' | 'TRANSFER';
  }) => void;
  banks?: Bank[];
  currentUser: User | null;
  safes?: Safe[];
  filteredSafes?: Safe[];
}

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if ((user as any).branchId) return (user as any).branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, 
  onClose, 
  total, 
  subtotal, 
  tax, 
  cartItems, 
  onComplete, 
  banks = [],
  currentUser,
  safes = [],
  filteredSafes = [],
}) => {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('safe');
  const [selectedSafeId, setSelectedSafeId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [bankTransactionType, setBankTransactionType] = useState<'POS' | 'TRANSFER'>('POS');
  const [splitCashAmount, setSplitCashAmount] = useState(0);
  const [splitBankAmount, setSplitBankAmount] = useState(0);
  const [splitSafeId, setSplitSafeId] = useState<string | null>(null);
  const [splitBankId, setSplitBankId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [splitAssignTarget, setSplitAssignTarget] = useState<'cash' | 'bank' | null>(null);

  // Calculations
  const totalAmount = Math.abs(total);
  const remaining = totalAmount;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCurrentInput('');
      setIsProcessing(false);
      setShowReceipt(false);
      setTransactionId(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));
      setPaymentMode('safe');
      setBankTransactionType('POS');
      
      // Auto-select first safe for safe mode
      if (filteredSafes.length > 0) {
        setSelectedSafeId(filteredSafes[0].id);
      }
      
      // Auto-select first bank for bank mode
      if (banks.length > 0) {
        setSelectedBankId(banks[0].id?.toString() || null);
      }
      
      // Initialize split payment
      setSplitCashAmount(0);
      setSplitBankAmount(0);
      setSplitAssignTarget(null);
      if (filteredSafes.length > 0) {
        setSplitSafeId(filteredSafes[0].id);
      }
      if (banks.length > 0) {
        setSplitBankId(banks[0].id?.toString() || null);
      }
    }
  }, [isOpen, filteredSafes, banks, totalAmount]);

  // Auto-select safe/bank when switching modes
  useEffect(() => {
    if (paymentMode === 'safe' && !selectedSafeId && filteredSafes.length > 0) {
      setSelectedSafeId(filteredSafes[0].id);
    }
    if (paymentMode === 'bank' && !selectedBankId && banks.length > 0) {
      setSelectedBankId(banks[0].id?.toString() || null);
    }
    if (paymentMode === 'split') {
      if (!splitSafeId && filteredSafes.length > 0) {
        setSplitSafeId(filteredSafes[0].id);
      }
      if (!splitBankId && banks.length > 0) {
        setSplitBankId(banks[0].id?.toString() || null);
      }
      setSplitCashAmount(0);
      setSplitBankAmount(0);
      setSplitAssignTarget(null);
    }
  }, [paymentMode, selectedSafeId, selectedBankId, splitSafeId, splitBankId, filteredSafes, banks, totalAmount]);

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

  // Handle split amount changes
  const handleSplitAmountChange = (type: "cash" | "bank", value: string) => {
    const val = parseFloat(value) || 0;
    if (type === "cash") {
      setSplitCashAmount(val);
      setSplitBankAmount(Math.max(0, parseFloat((totalAmount - val).toFixed(2))));
    } else {
      setSplitBankAmount(val);
      setSplitCashAmount(Math.max(0, parseFloat((totalAmount - val).toFixed(2))));
    }
  };

  // Assign current input to safe or bank in split mode
  const handleAssignToSafe = useCallback(() => {
    if (paymentMode === 'split' && currentInput) {
      const amount = parseFloat(currentInput) || 0;
      if (amount <= 0) return;
      
      // Set the cash amount to the entered amount
      const newCashAmount = Math.min(amount, totalAmount);
      // Automatically set the remaining amount to bank
      const newBankAmount = Math.max(0, totalAmount - newCashAmount);
      
      setSplitCashAmount(newCashAmount);
      setSplitBankAmount(newBankAmount);
      setCurrentInput('');
      setSplitAssignTarget(null);
    }
  }, [paymentMode, currentInput, totalAmount]);

  const handleAssignToBank = useCallback(() => {
    if (paymentMode === 'split' && currentInput) {
      const amount = parseFloat(currentInput) || 0;
      if (amount <= 0) return;
      
      // Set the bank amount to the entered amount
      const newBankAmount = Math.min(amount, totalAmount);
      // Automatically set the remaining amount to cash
      const newCashAmount = Math.max(0, totalAmount - newBankAmount);
      
      setSplitBankAmount(newBankAmount);
      setSplitCashAmount(newCashAmount);
      setCurrentInput('');
      setSplitAssignTarget(null);
    }
  }, [paymentMode, currentInput, totalAmount]);

  // Process payment
  const handleProcessPayment = () => {
    // Validate based on payment mode
    if (paymentMode === 'safe' && !selectedSafeId) {
      return;
    }
    if (paymentMode === 'bank' && !selectedBankId) {
      return;
    }
    if (paymentMode === 'split') {
      if (!splitSafeId || !splitBankId) {
        return;
      }
      const totalSplit = splitCashAmount + splitBankAmount;
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        return;
      }
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowReceipt(true);
    }, 1000);
  };

  const handleFinalize = () => {
    // Build payment data structure
    const paymentData: {
      paymentMode: PaymentMode;
      paymentTargetType: 'safe' | 'bank' | null;
      paymentTargetId: string | null;
      isSplitPayment: boolean;
      splitCashAmount?: number;
      splitBankAmount?: number;
      splitSafeId?: string | null;
      splitBankId?: string | null;
      bankTransactionType?: 'POS' | 'TRANSFER';
    } = {
      paymentMode,
      paymentTargetType: paymentMode === 'split' ? null : (paymentMode === 'safe' ? 'safe' : 'bank'),
      paymentTargetId: paymentMode === 'split' ? null : (paymentMode === 'safe' ? selectedSafeId : selectedBankId),
      isSplitPayment: paymentMode === 'split',
    };

    if (paymentMode === 'split') {
      paymentData.splitCashAmount = splitCashAmount;
      paymentData.splitBankAmount = splitBankAmount;
      paymentData.splitSafeId = splitSafeId;
      paymentData.splitBankId = splitBankId;
      paymentData.bankTransactionType = bankTransactionType;
    } else if (paymentMode === 'bank') {
      paymentData.bankTransactionType = bankTransactionType;
    }

    onComplete(paymentData);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReceipt) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          handleFinalize();
        }
        return;
      }

      // F4: Safe mode
      if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMode('safe');
        return;
      }

      // F5: Bank mode
      if (e.key === 'F5') {
        e.preventDefault();
        setPaymentMode('bank');
        return;
      }

      // F6: Split mode
      if (e.key === 'F6') {
        e.preventDefault();
        setPaymentMode('split');
        return;
      }

      // F7: Assign to safe (in split mode)
      if (e.key === 'F7' && paymentMode === 'split') {
        e.preventDefault();
        handleAssignToSafe();
        return;
      }

      // F8: Assign to bank (in split mode)
      if (e.key === 'F8' && paymentMode === 'split') {
        e.preventDefault();
        handleAssignToBank();
        return;
      }

      // Numpad input
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
        handleProcessPayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showReceipt, paymentMode, selectedSafeId, selectedBankId, splitSafeId, splitBankId, splitCashAmount, splitBankAmount, totalAmount, currentInput, handleAssignToSafe, handleAssignToBank]);

  // Get selected safe/bank names
  const selectedSafe = filteredSafes.find(s => s.id === selectedSafeId);
  const selectedBank = banks.find(b => b.id?.toString() === selectedBankId);
  const splitSafe = filteredSafes.find(s => s.id === splitSafeId);
  const splitBank = banks.find(b => b.id?.toString() === splitBankId);

  // Check if payment is ready
  const isPaymentReady = 
    (paymentMode === 'safe' && selectedSafeId) ||
    (paymentMode === 'bank' && selectedBankId) ||
    (paymentMode === 'split' && splitSafeId && splitBankId && Math.abs((splitCashAmount + splitBankAmount) - totalAmount) < 0.01);

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
          <span>{formatNumber(totalAmount)}</span>
        </div>
        {paymentMode === 'split' && (
          <div className="mt-2 border-t pt-2">
            <div className="flex justify-between text-xs">
              <span>نقدي - {splitSafe?.name}</span>
              <span>{formatNumber(splitCashAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>بنك - {splitBank?.name}</span>
              <span>{formatNumber(splitBankAmount)}</span>
            </div>
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
                <span className="text-sm font-normal text-royal-600">
                  ({paymentMode === 'safe' ? 'خزنة' : paymentMode === 'bank' ? 'بنك' : 'مقسوم'})
                </span>
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-500 rounded-full text-royal-400 transition">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Big Display Screen */}
            <div className="p-5 rounded-2xl shadow-lg mb-2 relative overflow-hidden flex flex-col justify-between h-40 border-b-4 bg-royal-900 border-gold-500 transition-all duration-300">
              {paymentMode === 'split' ? (
                // Split Payment Display - Full details
                <>
                  <div className="flex justify-between items-start z-10">
                    <div className="flex flex-col text-white">
                      <span className="text-white/70 text-xs font-bold uppercase">المطلوب (الإجمالي)</span>
                      <span className="text-2xl font-bold">{formatNumber(totalAmount)}</span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold uppercase text-white">
                        المبلغ المدخل
                      </span>
                      <span className="text-5xl font-mono font-bold tracking-wider text-white">
                        {currentInput || '0.00'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gold-500/30">
                    <div className="flex flex-col">
                      <span className="text-white/70 text-xs font-bold uppercase">النقدي (الخزنة)</span>
                      <span className="text-3xl font-bold text-green-400">{formatNumber(splitCashAmount)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white/70 text-xs font-bold uppercase">البنكي</span>
                      <span className="text-3xl font-bold text-blue-400">{formatNumber(splitBankAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-white/50 text-xs">
                      {currentInput ? 'اضغط F7 للخزنة أو F8 للبنك' : 
                       (splitCashAmount + splitBankAmount) >= totalAmount - 0.01 ? 'اكتمل الدفع - اضغط Enter' : 
                       'المتبقي: ' + formatNumber(Math.max(0, totalAmount - splitCashAmount - splitBankAmount))}
                    </div>
                    <div className="text-white/50 text-xs">
                      المجموع: {formatNumber(splitCashAmount + splitBankAmount)} / {formatNumber(totalAmount)}
                    </div>
                  </div>
                </>
              ) : (
                // Bank/Safe Payment Display - Simple, only show total
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center text-white">
                    <span className="text-white/70 text-xs font-bold uppercase mb-2">المطلوب (الإجمالي)</span>
                    <span className="text-6xl font-mono font-bold tracking-wider">{formatNumber(totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Mode Selection UI */}
            <div className="flex-1 bg-royal-50 rounded-xl border border-royal-200 overflow-hidden flex flex-col">
              <div className="bg-royal-200 p-2 text-xs font-bold text-royal-700 flex justify-between px-4">
                <span>
                  {paymentMode === 'safe' ? 'الخزنة المختارة' : 
                   paymentMode === 'bank' ? 'البنك المختار' : 
                   'تجزئة الدفع'}
                </span>
                <span>{formatNumber(totalAmount)}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {paymentMode === 'safe' && (
                  <div className="space-y-2">
                    {selectedSafe && (
                      <div className="bg-white p-3 rounded-lg shadow-sm border-r-4 border-green-500">
                        <div className="flex items-center gap-2 text-royal-800 font-bold">
                          <BanknoteIcon className="w-5 h-5 text-green-600" />
                          <span>{selectedSafe.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {paymentMode === 'bank' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        اختر البنك:
                      </label>
                      <select
                        value={selectedBankId || ""}
                        onChange={(e) => setSelectedBankId(e.target.value || null)}
                        className="flex-1 bg-white border-2 border-royal-600 rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-royal-500 py-2 px-3 font-semibold"
                      >
                        <option value="">اختر البنك...</option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.id?.toString() || ""}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedBank && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          طريقة التحويل:
                        </label>
                        <div className="relative bg-royal-100 border-2 border-royal-600 rounded-md p-1 flex items-center flex-1">
                          <button
                            onClick={() => setBankTransactionType("POS")}
                            className={`w-1/2 py-2 rounded text-sm font-semibold ${
                              bankTransactionType === "POS"
                                ? "bg-royal-600 text-white shadow"
                                : "text-gray-600"
                            } transition-all duration-200`}
                          >
                            نقاط بيع
                          </button>
                          <button
                            onClick={() => setBankTransactionType("TRANSFER")}
                            className={`w-1/2 py-2 rounded text-sm font-semibold ${
                              bankTransactionType === "TRANSFER"
                                ? "bg-royal-600 text-white shadow"
                                : "text-gray-600"
                            } transition-all duration-200`}
                          >
                            تحويل
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMode === 'split' && (
                  <div className="w-full animate-fade-in-down origin-top">
                    <div className="flex flex-col gap-3">
                      {/* Bank Selection */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          اختر البنك:
                        </label>
                        <select
                          className="flex-1 bg-white border-2 border-royal-600 rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-royal-500 py-2 px-3 font-semibold"
                          value={splitBankId || ""}
                          onChange={(e) =>
                            setSplitBankId(e.target.value ? e.target.value : null)
                          }
                        >
                          <option value="">اختر البنك...</option>
                          {banks.map((b) => (
                            <option key={b.id} value={b.id?.toString() || ""}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Transaction Type and Safe */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          طريقة التحويل:
                        </label>
                        <div className="relative bg-royal-100 border-2 border-royal-600 rounded-md p-1 flex items-center flex-1">
                          <button
                            onClick={() => setBankTransactionType("POS")}
                            className={`w-1/2 py-2 rounded text-sm font-semibold ${
                              bankTransactionType === "POS"
                                ? "bg-royal-600 text-white shadow"
                                : "text-gray-600"
                            } transition-all duration-200`}
                          >
                            نقاط بيع
                          </button>
                          <button
                            onClick={() => setBankTransactionType("TRANSFER")}
                            className={`w-1/2 py-2 rounded text-sm font-semibold ${
                              bankTransactionType === "TRANSFER"
                                ? "bg-royal-600 text-white shadow"
                                : "text-gray-600"
                            } transition-all duration-200`}
                          >
                            تحويل
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            الخزنة:
                          </span>
                          <div className="bg-white border-2 border-royal-600 rounded-md shadow-sm px-3 py-2 font-semibold text-gray-900 min-w-[120px] text-center">
                            {splitSafe?.name || 'الخزنة الافتراضية'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Numpad - Only shown in split mode */}
            {paymentMode === 'split' && (
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
            )}
          </div>

          {/* Right Side: Payment Mode Buttons */}
          <div className="w-full md:w-80 bg-royal-800 p-4 flex flex-col gap-3">
            <h3 className="text-white font-bold text-sm uppercase flex items-center gap-2 mb-2">
              <WalletIcon className="w-4 h-4 text-gold-400" />
              اختر طريقة الدفع
            </h3>
            
            <div className="space-y-2 flex-1 pr-1">
              
              {/* SAFE BUTTON */}
              <button 
                onClick={() => setPaymentMode('safe')}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 ${
                  paymentMode === 'safe' 
                    ? 'bg-green-600 text-white border-2 border-gold-400' 
                    : 'bg-green-700/50 text-white/80'
                }`}
                title="اختصار: F4"
              >
                <BanknoteIcon className="w-7 h-7" />
                <div className="text-right flex-1">
                  <div className="font-bold text-lg">نقدي - خزنة (F4)</div>
                  <div className="text-[10px] opacity-80">الدفع للخزنة</div>
                </div>
                <ChevronRightIcon className="w-5 h-5 opacity-50" />
              </button>

              {/* BANK BUTTON */}
              <button 
                onClick={() => setPaymentMode('bank')}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 ${
                  paymentMode === 'bank' 
                    ? 'bg-blue-600 text-white border-2 border-gold-400' 
                    : 'bg-blue-700/50 text-white/80'
                }`}
                title="اختصار: F5"
              >
                <CreditCardIcon className="w-7 h-7" />
                <div className="text-right flex-1">
                  <div className="font-bold text-lg">بنك (F5)</div>
                  <div className="text-[10px] opacity-80">الدفع عبر البنك</div>
                </div>
                <ChevronRightIcon className="w-5 h-5 opacity-50" />
              </button>

              {/* SPLIT BUTTON */}
              <button 
                onClick={() => setPaymentMode('split')}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 ${
                  paymentMode === 'split' 
                    ? 'bg-purple-600 text-white border-2 border-gold-400' 
                    : 'bg-purple-700/50 text-white/80'
                }`}
                title="اختصار: F6"
              >
                <WalletIcon className="w-7 h-7" />
                <div className="text-right flex-1">
                  <div className="font-bold text-lg">تجزئة (F6)</div>
                  <div className="text-[10px] opacity-80">نقدي + بنك</div>
                </div>
                <ChevronRightIcon className="w-5 h-5 opacity-50" />
              </button>

              {/* Split Mode Assignment Buttons */}
              {paymentMode === 'split' && (
                <>
                  <button 
                    onClick={handleAssignToSafe}
                    disabled={!currentInput}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 ${
                      !currentInput
                        ? 'opacity-40 cursor-not-allowed bg-green-700/30 text-white/50'
                        : 'bg-green-600 text-white'
                    }`}
                    title="اختصار: F7"
                  >
                    <BanknoteIcon className="w-6 h-6" />
                    <div className="text-right flex-1">
                      <div className="font-bold text-sm">إضافة للخزنة (F7)</div>
                      <div className="text-[10px] opacity-80">المبلغ المدخل</div>
                    </div>
                    <PlusIcon className="w-4 h-4 opacity-50" />
                  </button>

                  <button 
                    onClick={handleAssignToBank}
                    disabled={!currentInput}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border border-transparent hover:scale-[1.02] shadow-md active:scale-95 ${
                      !currentInput
                        ? 'opacity-40 cursor-not-allowed bg-blue-700/30 text-white/50'
                        : 'bg-blue-600 text-white'
                    }`}
                    title="اختصار: F8"
                  >
                    <CreditCardIcon className="w-6 h-6" />
                    <div className="text-right flex-1">
                      <div className="font-bold text-sm">إضافة للبنك (F8)</div>
                      <div className="text-[10px] opacity-80">المبلغ المدخل</div>
                    </div>
                    <PlusIcon className="w-4 h-4 opacity-50" />
                  </button>
                </>
              )}

            </div>

            <button
              onClick={handleProcessPayment}
              disabled={!isPaymentReady || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 mt-auto border-2 border-royal-900 ${
                !isPaymentReady 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gold-500 text-royal-900 hover:bg-gold-400'
              }`}
            >
              {isProcessing ? (
                <span className="animate-spin w-6 h-6 border-2 border-royal-900 border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <CheckIcon className="w-6 h-6" />
                  <span>إتمام وطباعة (Enter)</span>
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
              <span className="font-bold text-lg">{formatNumber(totalAmount)}</span>
            </div>
            {paymentMode === 'split' ? (
              <>
                <div className="flex justify-between font-bold text-royal-800">
                  <span>نقدي - {splitSafe?.name}</span>
                  <span>{formatNumber(splitCashAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-royal-800">
                  <span>بنك - {splitBank?.name}</span>
                  <span>{formatNumber(splitBankAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-bold text-royal-800">
                <span>{paymentMode === 'safe' ? `خزنة - ${selectedSafe?.name}` : `بنك - ${selectedBank?.name}`}</span>
                <span>{formatNumber(totalAmount)}</span>
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