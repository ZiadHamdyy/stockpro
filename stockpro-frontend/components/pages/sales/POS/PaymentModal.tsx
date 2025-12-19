import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { InvoiceItem, User, Safe, CompanyInfo, PrintSettings } from '../../../../types';
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
import { loadPrintSettings } from '../../../../utils/printSettingsStorage';
import { useGetCompanyQuery } from '../../../store/slices/companyApiSlice';

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
    createNewInvoice?: boolean;
  }) => void;
  onNewInvoice?: () => void;
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
  onNewInvoice,
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

  // Get company info
  const { data: company } = useGetCompanyQuery();
  const companyInfo: CompanyInfo = useMemo(() => ({
    name: company?.name ?? "",
    activity: company?.activity ?? "",
    address: company?.address ?? "",
    phone: company?.phone ?? "",
    taxNumber: company?.taxNumber ?? "",
    commercialReg: (company as any)?.commercialReg ?? "",
    currency: company?.currency ?? "SAR",
    logo: (company as any)?.logo ?? null,
    capital: (company as any)?.capital ?? 0,
    vatRate: company?.vatRate ?? 0,
    isVatEnabled: company?.isVatEnabled ?? false,
  }), [company]);

  // Load print settings
  const printSettings: PrintSettings = useMemo(() => {
    const loaded = loadPrintSettings();
    return loaded || {
      template: "thermal",
      showLogo: true,
      showTaxNumber: true,
      showAddress: true,
      headerText: "فاتورة ضريبية مبسطة",
      footerText: "شكراً لتعاملكم معنا",
      termsText: "",
    };
  }, []);

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

  const handleFinalize = (createNewInvoice?: boolean) => {
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
      createNewInvoice?: boolean;
    } = {
      paymentMode,
      paymentTargetType: paymentMode === 'split' ? null : (paymentMode === 'safe' ? 'safe' : 'bank'),
      paymentTargetId: paymentMode === 'split' ? null : (paymentMode === 'safe' ? selectedSafeId : selectedBankId),
      isSplitPayment: paymentMode === 'split',
      createNewInvoice,
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

  const handleNewInvoice = () => {
    // Close the modal immediately to prevent it from reopening
    onClose();
    // Finalize the current payment with createNewInvoice flag
    handleFinalize(true);
  };

  // Get selected safe/bank names
  const selectedSafe = filteredSafes.find(s => s.id === selectedSafeId);
  const selectedBank = banks.find(b => b.id?.toString() === selectedBankId);
  const splitSafe = filteredSafes.find(s => s.id === splitSafeId);
  const splitBank = banks.find(b => b.id?.toString() === splitBankId);

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    const thermalReceiptHTML = `
      <html>
      <head>
        <title>إيصال</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: 'Courier New', 'Cairo', monospace; 
            direction: rtl; 
            margin: 0 auto; 
            padding: 5px; 
            font-size: 12px; 
            width: 78mm; 
            -webkit-print-color-adjust: exact;
            box-sizing: border-box;
          }
          * { box-sizing: border-box; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { max-width: 60px; margin-bottom: 5px; filter: grayscale(100%); }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .items-table th { border-bottom: 1px solid #000; text-align: center; font-size: 11px; font-weight: bold; }
          .items-table td { padding: 4px 0; font-size: 11px; }
          .totals { margin-top: 10px; border-top: 2px dashed #000; padding-top: 5px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 10px; font-size: 10px; border-top: 1px solid #000; padding-top: 5px; }
          .payment-breakdown { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .payment-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${printSettings.showLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" class="logo" alt="Logo" />` : ''}
          <div style="font-size: 16px; font-weight: bold;">${companyInfo.name || 'POS ROYAL'}</div>
          ${printSettings.showAddress ? `
            ${companyInfo.address ? `<div>${companyInfo.address}</div>` : ''}
            ${companyInfo.phone ? `<div>${companyInfo.phone}</div>` : ''}
          ` : ''}
          ${printSettings.showTaxNumber && companyInfo.taxNumber ? `<div>الرقم الضريبي: ${companyInfo.taxNumber}</div>` : ''}
        </div>
        <div style="text-align: center; margin-bottom: 10px; font-weight: bold; font-size: 14px; border: 1px solid #000; padding: 5px;">
          ${printSettings.headerText || 'فاتورة ضريبية مبسطة'}
        </div>
        <div class="info-row">
          <span>رقم الفاتورة:</span>
          <span>#${transactionId}</span>
        </div>
        <div class="info-row">
          <span>التاريخ:</span>
          <span>${new Date().toLocaleString('ar-SA')}</span>
        </div>
        <div class="info-row">
          <span>الموظف:</span>
          <span>${currentUser?.name || 'غير محدد'}</span>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: right;">الصنف</th>
              <th style="width: 20px;">ك</th>
              <th>سعر</th>
              <th>مجموع</th>
            </tr>
          </thead>
          <tbody>
            ${cartItems.map((item) => `
              <tr>
                <td style="text-align: right;">${item.name}</td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: center;">${formatNumber(Math.abs(item.price))}</td>
                <td style="text-align: center;">${formatNumber(Math.abs(item.total))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div class="info-row">
            <span>المجموع:</span>
            <span>${formatNumber(subtotal)}</span>
          </div>
          ${tax > 0 && companyInfo.isVatEnabled ? `
            <div class="info-row">
              <span>الضريبة (${companyInfo.vatRate}%):</span>
              <span>${formatNumber(tax)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>الصافي:</span>
            <span>${formatNumber(totalAmount)}</span>
          </div>
        </div>
        ${paymentMode === 'split' ? `
          <div class="payment-breakdown">
            <div class="payment-row">
              <span>نقدي - ${splitSafe?.name || 'الخزنة'}:</span>
              <span>${formatNumber(splitCashAmount)}</span>
            </div>
            <div class="payment-row">
              <span>بنك - ${splitBank?.name || 'البنك'}:</span>
              <span>${formatNumber(splitBankAmount)}</span>
            </div>
          </div>
        ` : ''}
        ${paymentMode === 'safe' ? `
          <div class="payment-breakdown">
            <div class="payment-row">
              <span>طريقة الدفع:</span>
              <span>نقدي - ${selectedSafe?.name || 'الخزنة'}</span>
            </div>
          </div>
        ` : ''}
        ${paymentMode === 'bank' ? `
          <div class="payment-breakdown">
            <div class="payment-row">
              <span>طريقة الدفع:</span>
              <span>بنك - ${selectedBank?.name || 'البنك'}</span>
            </div>
            <div class="payment-row">
              <span>نوع المعاملة:</span>
              <span>${bankTransactionType === 'POS' ? 'نقاط بيع' : 'تحويل'}</span>
            </div>
          </div>
        ` : ''}
        ${printSettings.footerText ? `
          <div class="footer">
            <div>${printSettings.footerText}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(thermalReceiptHTML);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReceipt) {
        // F3: New invoice
        if (e.key === 'F3') {
          e.preventDefault();
          e.stopPropagation();
          handleNewInvoice();
          return;
        }
        // Enter: Print
        if (e.key === 'Enter') {
          e.preventDefault();
          handlePrint();
          return;
        }
        // Escape: Finalize (close and complete)
        if (e.key === 'Escape') {
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
  }, [isOpen, showReceipt, paymentMode, selectedSafeId, selectedBankId, splitSafeId, splitBankId, splitCashAmount, splitBankAmount, totalAmount, currentInput, handleAssignToSafe, handleAssignToBank, printSettings, companyInfo, transactionId, currentUser, cartItems, subtotal, tax, bankTransactionType, filteredSafes, banks, handlePrint, handleFinalize, handleNewInvoice, handleProcessPayment, handleNumClick, handleBackspace, handleClearInput]);

  // Check if payment is ready
  const isPaymentReady = 
    (paymentMode === 'safe' && selectedSafeId) ||
    (paymentMode === 'bank' && selectedBankId) ||
    (paymentMode === 'split' && splitSafeId && splitBankId && Math.abs((splitCashAmount + splitBankAmount) - totalAmount) < 0.01);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-royal-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 font-sans">
      
      {/* Receipt for Printing - Thermal Format */}
      <div id="printable-receipt" className="hidden">
        <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 78mm; margin: 0 auto; padding: 5px; font-size: 12px; font-family: 'Courier New', 'Cairo', monospace; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .logo { max-width: 60px; margin-bottom: 5px; filter: grayscale(100%); }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th { border-bottom: 1px solid #000; text-align: center; font-size: 11px; font-weight: bold; }
            .items-table td { padding: 4px 0; font-size: 11px; }
            .totals { margin-top: 10px; border-top: 2px dashed #000; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 10px; font-size: 10px; border-top: 1px solid #000; padding-top: 5px; }
            .payment-breakdown { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .payment-row { display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 11px; }
          }
        `}</style>
        <div className="header">
          {printSettings.showLogo && companyInfo.logo ? (
            <img src={companyInfo.logo} className="logo" alt="Logo" />
          ) : null}
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{companyInfo.name || 'POS ROYAL'}</div>
          {printSettings.showAddress ? (
            <>
              {companyInfo.address ? <div>{companyInfo.address}</div> : null}
              {companyInfo.phone ? <div>{companyInfo.phone}</div> : null}
            </>
          ) : null}
          {printSettings.showTaxNumber && companyInfo.taxNumber ? (
            <div>الرقم الضريبي: {companyInfo.taxNumber}</div>
          ) : null}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #000', padding: '5px' }}>
          {printSettings.headerText || 'فاتورة ضريبية مبسطة'}
        </div>
        <div className="info-row">
          <span>رقم الفاتورة:</span>
          <span>#{transactionId}</span>
        </div>
        <div className="info-row">
          <span>التاريخ:</span>
          <span>{new Date().toLocaleString('ar-SA')}</span>
        </div>
        <div className="info-row">
          <span>الموظف:</span>
          <span>{currentUser?.name || 'غير محدد'}</span>
        </div>
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>الصنف</th>
              <th style={{ width: '20px' }}>ك</th>
              <th>سعر</th>
              <th>مجموع</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'right' }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td style={{ textAlign: 'center' }}>{formatNumber(Math.abs(item.price))}</td>
                <td style={{ textAlign: 'center' }}>{formatNumber(Math.abs(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div className="info-row">
            <span>المجموع:</span>
            <span>{formatNumber(subtotal)}</span>
          </div>
          {tax > 0 && companyInfo.isVatEnabled ? (
            <div className="info-row">
              <span>الضريبة ({companyInfo.vatRate}%):</span>
              <span>{formatNumber(tax)}</span>
            </div>
          ) : null}
          <div className="total-row">
            <span>الصافي:</span>
            <span>{formatNumber(totalAmount)}</span>
          </div>
        </div>
        {paymentMode === 'split' && (
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>نقدي - {splitSafe?.name || 'الخزنة'}:</span>
              <span>{formatNumber(splitCashAmount)}</span>
            </div>
            <div className="payment-row">
              <span>بنك - {splitBank?.name || 'البنك'}:</span>
              <span>{formatNumber(splitBankAmount)}</span>
            </div>
          </div>
        )}
        {paymentMode === 'safe' && (
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>طريقة الدفع:</span>
              <span>نقدي - {selectedSafe?.name || 'الخزنة'}</span>
            </div>
          </div>
        )}
        {paymentMode === 'bank' && (
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>طريقة الدفع:</span>
              <span>بنك - {selectedBank?.name || 'البنك'}</span>
            </div>
            <div className="payment-row">
              <span>نوع المعاملة:</span>
              <span>{bankTransactionType === 'POS' ? 'نقاط بيع' : 'تحويل'}</span>
            </div>
          </div>
        )}
        {printSettings.footerText ? (
          <div className="footer">
            <div>{printSettings.footerText}</div>
          </div>
        ) : null}
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
              onClick={handlePrint}
              className="flex-1 py-3 bg-royal-100 text-royal-900 rounded-xl font-bold hover:bg-royal-200 transition flex items-center justify-center gap-2"
            >
              <PrintIcon className="w-5 h-5" />
              <span>طباعة (Enter)</span>
            </button>
            <button 
              onClick={handleNewInvoice}
              className="flex-1 py-3 bg-royal-900 text-white rounded-xl font-bold hover:bg-royal-800 transition"
            >
              فاتورة جديدة (F3)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentModal;