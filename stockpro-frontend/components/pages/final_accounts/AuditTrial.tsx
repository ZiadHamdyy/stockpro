import React, { useState, useMemo, useCallback } from 'react';
import { useAuditTrial } from '../../hook/useAuditTrial';
import PermissionWrapper from '../../common/PermissionWrapper';
import {
  Resources,
  Actions,
  buildPermission,
} from '../../../enums/permissions.enum';
import { calculateCompanyInventoryValuation } from '../../../utils/inventoryValuation';
import { useGetItemsQuery } from '../../store/slices/items/itemsApi';
import { useGetSalesInvoicesQuery } from '../../store/slices/salesInvoice/salesInvoiceApiSlice';
import { useGetSalesReturnsQuery } from '../../store/slices/salesReturn/salesReturnApiSlice';
import { useGetPurchaseInvoicesQuery } from '../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice';
import { useGetPurchaseReturnsQuery } from '../../store/slices/purchaseReturn/purchaseReturnApiSlice';
import { useGetStoreReceiptVouchersQuery } from '../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi';
import { useGetStoreIssueVouchersQuery } from '../../store/slices/storeIssueVoucher/storeIssueVoucherApi';
import { useGetStoreTransferVouchersQuery } from '../../store/slices/storeTransferVoucher/storeTransferVoucherApi';
import { useGetStoresQuery, useGetAllStoreItemsQuery } from '../../store/slices/store/storeApi';
import { useGetFinancialSettingsQuery } from '../../store/slices/financialSettings/financialSettingsApi';
import { ValuationMethod } from '../../pages/settings/financial-system/types';

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

  // Fetch data for inventory calculation
  const { data: apiItems = [] } = useGetItemsQuery(undefined);
  const { data: apiSalesInvoices = [] } = useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [] } = useGetSalesReturnsQuery(undefined);
  const { data: apiPurchaseInvoices = [] } = useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [] } = useGetPurchaseReturnsQuery(undefined);
  const { data: storeReceiptVouchers = [] } = useGetStoreReceiptVouchersQuery(undefined);
  const { data: storeIssueVouchers = [] } = useGetStoreIssueVouchersQuery(undefined);
  const { data: storeTransferVouchers = [] } = useGetStoreTransferVouchersQuery(undefined);
  const { data: stores = [] } = useGetStoresQuery(undefined);
  const { data: allStoreItems = [] } = useGetAllStoreItemsQuery();
  const { data: financialSettings } = useGetFinancialSettingsQuery();

  // Map inventory valuation method to valuation method string
  const inventoryValuationMethod = useMemo(() => {
    if (!financialSettings?.inventoryValuationMethod) {
      return "averageCost"; // Default
    }
    
    if (financialSettings.inventoryValuationMethod === ValuationMethod.WEIGHTED_AVERAGE) {
      return "averageCost";
    }
    
    if (financialSettings.inventoryValuationMethod === ValuationMethod.FIFO || 
        financialSettings.inventoryValuationMethod === ValuationMethod.LAST_PURCHASE_PRICE) {
      return "purchasePrice";
    }
    
    return "averageCost"; // Default fallback
  }, [financialSettings?.inventoryValuationMethod]);

  // Helper to normalize date to YYYY-MM-DD
  const normalizeDate = useMemo(() => {
    return (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }
      } catch {
        // ignore
      }
      return "";
    };
  }, []);

  // Safely convert any numeric-like value to a finite number
  const toNumber = useCallback((value: any): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  // Aggregate opening balances from all StoreItems across all stores/branches
  const aggregatedOpeningBalances = useMemo(() => {
    const balanceMap: Record<string, number> = {};
    
    (allStoreItems as any[]).forEach((storeItem) => {
      const itemCode = storeItem.item?.code;
      if (itemCode) {
        balanceMap[itemCode] = (balanceMap[itemCode] || 0) + toNumber(storeItem.openingBalance || 0);
      }
    });
    
    return balanceMap;
  }, [allStoreItems, toNumber]);

  // Transform items to filter out services
  const transformedItems = useMemo(() => {
    return (apiItems as any[])
      .filter((item) => {
        const itemType = (item.type || item.itemType || "").toUpperCase();
        return itemType !== "SERVICE";
      })
      .map((item) => ({
        ...item,
        unit: item.unit?.name || "",
        group: item.group?.name || "",
      }));
  }, [apiItems]);

  // Transform transactions for inventory calculation
  const transformedSalesInvoices = useMemo(() => {
    return (apiSalesInvoices as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiSalesInvoices]);

  const transformedSalesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiSalesReturns]);

  const transformedPurchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiPurchaseInvoices]);

  const transformedPurchaseReturns = useMemo(() => {
    return (apiPurchaseReturns as any[]).map((invoice) => ({
      ...invoice,
      branchName: invoice.branch?.name || "",
      items: invoice.items.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.qty,
        price: item.price,
        taxAmount: item.taxAmount,
        total: item.total,
      })),
    }));
  }, [apiPurchaseReturns]);

  const transformedStoreReceiptVouchers = useMemo(() => {
    return (storeReceiptVouchers as any[]).map((voucher) => ({
      ...voucher,
      branch: voucher.store?.branch?.name || "",
      items: voucher.items.map((item) => ({
        ...item,
        id: item.item?.code || item.itemId,
        name: item.item?.name || "",
        unit: item.item?.unit?.name || "",
        qty: item.quantity,
      })),
    }));
  }, [storeReceiptVouchers]);

  const transformedStoreIssueVouchers = useMemo(() => {
    return (storeIssueVouchers as any[]).map((voucher) => ({
      ...voucher,
      branch: voucher.store?.branch?.name || "",
      items: voucher.items.map((item) => ({
        ...item,
        id: item.item?.code || item.itemId,
        name: item.item?.name || "",
        unit: item.item?.unit?.name || "",
        qty: item.quantity,
      })),
    }));
  }, [storeIssueVouchers]);

  const transformedStoreTransferVouchers = useMemo(() => {
    return (storeTransferVouchers as any[])
      .filter((v) => v.status === 'ACCEPTED')
      .map((voucher) => ({
        ...voucher,
        fromStore: voucher.fromStore?.name || "",
        toStore: voucher.toStore?.name || "",
        items: voucher.items.map((item) => ({
          ...item,
          id: item.item?.code || item.itemId,
          name: item.item?.name || "",
          unit: item.item?.unit?.name || "",
          qty: item.quantity,
        })),
      }));
  }, [storeTransferVouchers]);

  // Helper function to get last purchase price before or on a reference date
  const getLastPurchasePriceBeforeDate = useCallback((itemCode: string, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const relevantInvoices = transformedPurchaseInvoices
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.date) || normalizeDate(a.invoiceDate) || "";
        const dateB = normalizeDate(b.date) || normalizeDate(b.invoiceDate) || "";
        return dateB.localeCompare(dateA); // Descending order
      });

    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.price) {
          return invItem.price;
        }
      }
    }

    return null;
  }, [transformedPurchaseInvoices, normalizeDate]);

  // Helper function to calculate weighted average cost
  const calculateWeightedAverageCost = useCallback((item: any, referenceDate: string): number | null => {
    const normalizedReferenceDate = normalizeDate(referenceDate);
    if (!normalizedReferenceDate) return null;

    const itemCode = item.code;
    const openingBalance = aggregatedOpeningBalances[itemCode] || 0;
    const initialPurchasePrice = toNumber(item.initialPurchasePrice ?? item.purchasePrice ?? 0);

    const relevantInvoices = transformedPurchaseInvoices
      .filter((inv) => {
        const txDate = normalizeDate(inv.date) || normalizeDate(inv.invoiceDate);
        return txDate && txDate <= normalizedReferenceDate;
      });

    let totalCost = openingBalance > 0 ? openingBalance * initialPurchasePrice : 0;
    let totalQty = openingBalance;

    for (const inv of relevantInvoices) {
      for (const invItem of inv.items) {
        if (invItem.id === itemCode && invItem.total && invItem.qty) {
          totalCost += toNumber(invItem.total);
          totalQty += toNumber(invItem.qty);
        }
      }
    }

    if (totalQty === 0) {
      return initialPurchasePrice > 0 ? initialPurchasePrice : null;
    }
    
    return totalCost / totalQty;
  }, [transformedPurchaseInvoices, normalizeDate, toNumber, aggregatedOpeningBalances]);

  // Calculate inventory value using shared utility
  const calculatedInventoryValue = useMemo(() => {
    const { totalValue } = calculateCompanyInventoryValuation({
      items: transformedItems,
      aggregatedOpeningBalances,
      purchaseInvoices: transformedPurchaseInvoices,
      salesInvoices: transformedSalesInvoices,
      purchaseReturns: transformedPurchaseReturns,
      salesReturns: transformedSalesReturns,
      storeReceiptVouchers: transformedStoreReceiptVouchers,
      storeIssueVouchers: transformedStoreIssueVouchers,
      storeTransferVouchers: transformedStoreTransferVouchers,
      stores,
      endDate: toDate,
      valuationMethod: inventoryValuationMethod,
      normalizeDate,
      toNumber,
      getLastPurchasePriceBeforeDate,
      calculateWeightedAverageCost,
    });
    return totalValue;
  }, [
    transformedItems,
    toDate,
    transformedSalesInvoices,
    transformedSalesReturns,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    transformedStoreReceiptVouchers,
    transformedStoreIssueVouchers,
    transformedStoreTransferVouchers,
    stores,
    normalizeDate,
    toNumber,
    getLastPurchasePriceBeforeDate,
    calculateWeightedAverageCost,
    inventoryValuationMethod,
    aggregatedOpeningBalances,
  ]);

  // Process and verify entries with correct calculations
  // Based on backend logic:
  // - Assets/Expenses: closingDebit = openingDebit + periodDebit - periodCredit (if negative, becomes closingCredit)
  // - Liabilities/Equity/Revenue: closingCredit = openingCredit + periodCredit - periodDebit (if negative, becomes closingDebit)
  // For inventory account (1301 / مخزون البضاعة), override closing balance with calculated inventory value
  const processedData = useMemo(() => {
    return (auditTrialData?.entries || []).map((entry) => {
      // Check if this is the inventory account
      const isInventoryAccount = entry.accountCode === '1301' || entry.accountName === 'مخزون البضاعة';
      
      let calculatedClosingDebit = 0;
      let calculatedClosingCredit = 0;
      
      if (isInventoryAccount) {
        // Override inventory account closing balance with calculated inventory value
        // Inventory is an asset, so positive value goes to debit, negative to credit
        if (calculatedInventoryValue > 0) {
          calculatedClosingDebit = calculatedInventoryValue;
          calculatedClosingCredit = 0;
        } else {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = Math.abs(calculatedInventoryValue);
        }
      } else if (entry.category === 'Assets' || entry.category === 'Expenses') {
        // Assets and Expenses: closingDebit = openingDebit + periodDebit - periodCredit
        const closingDebit = entry.openingBalanceDebit + entry.periodDebit - entry.periodCredit;
        if (closingDebit > 0) {
          calculatedClosingDebit = closingDebit;
          calculatedClosingCredit = 0;
        } else {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = Math.abs(closingDebit);
        }
      } else {
        // Liabilities, Equity, Revenue: closingCredit = openingCredit + periodCredit - periodDebit
        const closingCredit = entry.openingBalanceCredit + entry.periodCredit - entry.periodDebit;
        if (closingCredit > 0) {
          calculatedClosingDebit = 0;
          calculatedClosingCredit = closingCredit;
        } else {
          calculatedClosingDebit = Math.abs(closingCredit);
          calculatedClosingCredit = 0;
        }
      }
      
      // Transform opening balance: calculate net balance and split positive to مدين, negative to دائن
      const netOpening = entry.openingBalanceDebit - entry.openingBalanceCredit;
      const transformedOpeningDebit = netOpening > 0 ? netOpening : 0;
      const transformedOpeningCredit = netOpening < 0 ? Math.abs(netOpening) : 0;
      
      // Transform closing balance: calculate net balance and split positive to مدين, negative to دائن
      const netClosing = calculatedClosingDebit - calculatedClosingCredit;
      const transformedClosingDebit = netClosing > 0 ? netClosing : 0;
      const transformedClosingCredit = netClosing < 0 ? Math.abs(netClosing) : 0;
      
      // Return transformed values
      return {
        ...entry,
        openingBalanceDebit: transformedOpeningDebit,
        openingBalanceCredit: transformedOpeningCredit,
        // periodDebit and periodCredit remain unchanged (already represent totals during the period)
        closingBalanceDebit: transformedClosingDebit,
        closingBalanceCredit: transformedClosingCredit,
      };
    });
  }, [auditTrialData?.entries, calculatedInventoryValue]);

  const data = processedData;

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

  // Verify trial balance: total closing debit should equal total closing credit
  const closingBalanceDifference = Math.abs(summary.totalClosingDebit - summary.totalClosingCredit);
  const isClosingBalanced = closingBalanceDifference < 0.01;
  
  // Verify opening balance: total opening debit should equal total opening credit
  const openingBalanceDifference = Math.abs(summary.totalOpeningDebit - summary.totalOpeningCredit);
  const isOpeningBalanced = openingBalanceDifference < 0.01;
  
  // Verify period movements: total period debit should equal total period credit
  const periodBalanceDifference = Math.abs(summary.totalPeriodDebit - summary.totalPeriodCredit);
  const isPeriodBalanced = periodBalanceDifference < 0.01;
  
  // Overall balance check: all three should balance for a proper trial balance
  const isFullyBalanced = isOpeningBalanced && isPeriodBalanced && isClosingBalanced;
  
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
               <h3 className="text-2xl font-black text-slate-700 underline decoration-[#002366] underline-offset-4 decoration-2">ميزان المراجعة التحليلي للفترة المحددة</h3>
               <div className="text-[11px] font-bold text-slate-400 flex justify-center md:justify-end gap-3 uppercase">
                  <span>الفترة من: {fromDate} إلى: {toDate}</span>
                  <span>•</span>
                  <span>تاريخ التقرير: {reportDate}</span>
                  <span>•</span>
                  <span>العملة: {currency}</span>
               </div>
            </div>
          </div>
          
          {/* Trial Balance Table - Integrated with Company Info */}
          <div className="bg-white border-2 border-slate-300 shadow-2xl overflow-hidden rounded-b-[2rem] print:shadow-none print:border-slate-400 print:overflow-visible">
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
                        {item.openingBalanceDebit > 0 ? item.openingBalanceDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-700 group-hover:text-white shadow-[3px_0_0_white]">
                        {item.openingBalanceCredit > 0 ? item.openingBalanceCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-800 bg-blue-50/10 group-hover:bg-transparent group-hover:text-white">
                        {item.periodDebit > 0 ? item.periodDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center border-l-[3px] border-white text-rose-800 bg-rose-50/10 group-hover:bg-transparent group-hover:text-white shadow-[3px_0_0_white]">
                        {item.periodCredit > 0 ? item.periodCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      
                      <td className="px-3 py-1.5 text-center border-l border-slate-300/30 text-blue-900 bg-blue-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceDebit > 0 ? item.closingBalanceDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-900 bg-rose-100/20 group-hover:bg-transparent group-hover:text-white">
                        {item.closingBalanceCredit > 0 ? item.closingBalanceCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot>
                <tr className="bg-[#001a4d] text-white border-t-4 border-white">
                  <td colSpan={2} className="px-6 py-4 text-base font-black text-left pr-8 border-l border-white/10 uppercase italic">إجماليات الميزان النهائية</td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">
                    {summary.totalOpeningDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">
                    {summary.totalOpeningCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-sm font-black text-blue-300">
                    {summary.totalPeriodDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l-[3px] border-white/10 text-sm font-black text-rose-300">
                    {summary.totalPeriodCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center border-l border-white/10 text-lg font-black text-blue-200 bg-blue-950 underline decoration-double">
                    {summary.totalClosingDebit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-4 text-center text-lg font-black text-rose-200 bg-rose-950 underline decoration-double">
                    {summary.totalClosingCredit.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Verification Status Bar */}
          <div className="mt-8 flex flex-col gap-4">
            {/* Main Balance Status */}
            <div className="flex justify-center">
              <div className={`w-full max-w-4xl flex items-center justify-between px-10 py-5 border-2 rounded-2xl bg-white shadow-lg ${isFullyBalanced ? 'border-emerald-500' : 'border-rose-500'}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md ${isFullyBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}>
                    <i className={`fas ${isFullyBalanced ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">
                      {isFullyBalanced ? 'ميزان المراجعة متوازن بالكامل' : 'يوجد فارق في التوازن المالي'}
                    </h4>
                    <p className="text-xs font-bold text-slate-400">تنبيه آلي من النظام المحاسبي للتدقيق المالي</p>
                  </div>
                </div>
                
                {!isFullyBalanced && (
                  <div className="bg-rose-50 px-6 py-2.5 rounded-xl border-2 border-rose-100 flex flex-col items-center">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">قيمة الفارق الإجمالي</span>
                    <span className="text-2xl font-black text-rose-600 font-mono italic">
                      {closingBalanceDifference.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Detailed Balance Breakdown */}
            {!isFullyBalanced && (
              <div className="flex justify-center">
                <div className="w-full max-w-4xl bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className={`p-3 rounded-lg border-2 ${isOpeningBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">الأرصدة الافتتاحية</div>
                      <div className={`font-bold ${isOpeningBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isOpeningBalanced ? '✓ متوازن' : `✗ فارق: ${openingBalanceDifference.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${isPeriodBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">حركات الفترة</div>
                      <div className={`font-bold ${isPeriodBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPeriodBalanced ? '✓ متوازن' : `✗ فارق: ${periodBalanceDifference.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border-2 ${isClosingBalanced ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                      <div className="font-black text-xs text-slate-600 mb-1">الأرصدة الختامية</div>
                      <div className={`font-bold ${isClosingBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isClosingBalanced ? '✓ متوازن' : `✗ فارق: ${closingBalanceDifference.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            table { 
              border: 2px solid #000 !important; 
              page-break-inside: auto !important;
              border-collapse: collapse !important;
            }
            thead { 
              display: table-header-group !important; 
            }
            tfoot { 
              display: table-footer-group !important; 
            }
            tbody tr { 
              page-break-inside: avoid !important; 
              page-break-after: auto !important;
            }
            tfoot tr { 
              page-break-inside: avoid !important; 
            }
            th { background-color: #002366 !important; color: white !important; -webkit-print-color-adjust: exact; padding: 4px !important; border-color: #fff !important; }
            td { padding: 3px 6px !important; border-bottom: 1px solid #ddd !important; }
            tr.bg-slate-200\/80 { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
            .rounded-t-\[2rem\], .rounded-b-\[2rem\] { border-radius: 0 !important; }
            .border-b-2 { border-bottom-width: 2px !important; border-color: #000 !important; }
            .border-l-\[3px\] { border-left-width: 4px !important; border-color: #fff !important; }
            .shadow-\[3px_0_0_white\] { box-shadow: 4px 0 0 white !important; }
            .overflow-hidden { overflow: visible !important; }
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
