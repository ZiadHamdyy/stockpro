import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetItemsQuery } from "../../../store/slices/items/itemsApi";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetStoresQuery } from "../../../store/slices/store/storeApi";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetStoreReceiptVouchersQuery } from "../../../store/slices/storeReceiptVoucher/storeReceiptVoucherApi";
import { useGetStoreIssueVouchersQuery } from "../../../store/slices/storeIssueVoucher/storeIssueVoucherApi";
import { useGetStoreTransferVouchersQuery } from "../../../store/slices/storeTransferVoucher/storeTransferVoucherApi";
import { getCurrentYearRange } from "../dateUtils";

interface ItemMovementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  onNavigate: (
    pageKey: string,
    pageLabel: string,
    recordId: string | number,
  ) => void;
  currentUser: User | null;
}

const ItemMovementReport: React.FC<ItemMovementReportProps> = ({
  title,
  companyInfo,
  onNavigate,
  currentUser,
}) => {
  // Branch filter state - default to current user's branch or "all"
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    currentUser?.branchId || "all"
  );
  
  // Get store for selected branch
  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { data: stores = [], isLoading: storesLoading } =
    useGetStoresQuery(undefined);
  
  const selectedStore = selectedBranchId === "all" 
    ? stores.find((store) => store.branchId === currentUser?.branchId)
    : stores.find((store) => store.branchId === selectedBranchId);
  
  // API hooks - get items with store-specific balances
  const { data: apiItems = [], isLoading: itemsLoading } =
    useGetItemsQuery(selectedStore ? { storeId: selectedStore.id } : undefined);
  const { data: salesInvoices = [], isLoading: salesInvoicesLoading } =
    useGetSalesInvoicesQuery(undefined);
  const { data: salesReturns = [], isLoading: salesReturnsLoading } =
    useGetSalesReturnsQuery(undefined);
  const { data: purchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: purchaseReturns = [], isLoading: purchaseReturnsLoading } =
    useGetPurchaseReturnsQuery(undefined);
  const {
    data: storeReceiptVouchers = [],
    isLoading: storeReceiptVouchersLoading,
  } = useGetStoreReceiptVouchersQuery(undefined);
  const {
    data: storeIssueVouchers = [],
    isLoading: storeIssueVouchersLoading,
  } = useGetStoreIssueVouchersQuery(undefined);
  const {
    data: storeTransferVouchers = [],
    isLoading: storeTransferVouchersLoading,
  } = useGetStoreTransferVouchersQuery(undefined);

  // Transform API data to match expected format
  const items = useMemo(() => {
    return (apiItems as any[]).map((item) => ({
      ...item,
      unit: item.unit?.name || "",
      group: item.group?.name || "",
    }));
  }, [apiItems]);

  const transformedSalesInvoices = useMemo(() => {
    return (salesInvoices as any[]).map((invoice) => ({
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
  }, [salesInvoices]);

  const transformedSalesReturns = useMemo(() => {
    return (salesReturns as any[]).map((invoice) => ({
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
  }, [salesReturns]);

  const transformedPurchaseInvoices = useMemo(() => {
    return (purchaseInvoices as any[]).map((invoice) => ({
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
  }, [purchaseInvoices]);

  const transformedPurchaseReturns = useMemo(() => {
    return (purchaseReturns as any[]).map((invoice) => ({
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
  }, [purchaseReturns]);

  const transformedStoreReceiptVouchers = useMemo(() => {
    // Filter out system-generated vouchers (marked with [نظام] in notes)
    return (storeReceiptVouchers as any[])
      .filter((v) => {
        const notes = v.notes || "";
        return !notes.includes("[نظام]");
      })
      .map((voucher) => ({
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
    // Filter out system-generated vouchers (marked with [نظام] in notes)
    return (storeIssueVouchers as any[])
      .filter((v) => {
        const notes = v.notes || "";
        return !notes.includes("[نظام]");
      })
      .map((voucher) => ({
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
    return (storeTransferVouchers as any[]).map((voucher) => ({
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

  const isLoading =
    itemsLoading ||
    branchesLoading ||
    storesLoading ||
    salesInvoicesLoading ||
    salesReturnsLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    storeReceiptVouchersLoading ||
    storeIssueVouchersLoading ||
    storeTransferVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items.length > 0 ? items[0].id.toString() : null,
  );
  const [itemSearchTerm, setItemSearchTerm] = useState("");

  const [reportData, setReportData] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  const filteredSelectItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(itemSearchTerm.toLowerCase()),
  );

  const selectedItem = useMemo(
    () => items.find((i) => i.id.toString() === selectedItemId),
    [items, selectedItemId],
  );
  const selectedItemName = selectedItem?.name || "غير محدد";

  const handleViewReport = useCallback(() => {
    if (!selectedItem || isLoading) {
      setReportData([]);
      setOpeningBalance(0);
      return;
    }

    // Helper function to normalize dates to YYYY-MM-DD format
    const normalizeDate = (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        // Extract just the date part (first 10 characters)
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().substring(0, 10);
      }
      return "";
    };

    const itemCode = selectedItem.code;
    const selectedBranchName = selectedBranchId === "all" 
      ? "all"
      : branches.find(b => b.id === selectedBranchId)?.name || "";
    
    const filterByBranch = (tx: any) =>
      selectedBranchId === "all" ||
      tx.branch === selectedBranchName ||
      tx.branchName === selectedBranchName ||
      tx.branchId === selectedBranchId;

    // Normalize filter dates
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);

    // --- Correct Opening Balance Calculation ---
    // Use StoreItem's openingBalance as base, or 0 if not available
    let opening = (selectedItem as any).openingBalance ?? 0;

    const adjustBalance = (
      txList: any[],
      factor: number,
      isInvoice: boolean,
    ) => {
      txList.forEach((tx: any) => {
        const branchMatches =
          selectedBranchId === "all" ||
          (isInvoice
            ? tx.branchName === selectedBranchName || tx.branchId === selectedBranchId
            : tx.branch === selectedBranchName || tx.branchId === selectedBranchId);
        const txDate = normalizeDate(tx.date);
        if (branchMatches && txDate < normalizedStartDate) {
          tx.items.forEach((item: any) => {
            if (item.id === itemCode) {
              opening += item.qty * factor;
            }
          });
        }
      });
    };

    adjustBalance(transformedPurchaseInvoices, 1, true);
    adjustBalance(transformedSalesReturns, 1, true);
    adjustBalance(transformedStoreReceiptVouchers, 1, false);
    adjustBalance(transformedSalesInvoices, -1, true);
    adjustBalance(transformedPurchaseReturns, -1, true);
    adjustBalance(transformedStoreIssueVouchers, -1, false);

    transformedStoreTransferVouchers.forEach((v) => {
      const vDate = normalizeDate(v.date);
      if (vDate < normalizedStartDate) {
        const fromStore = stores.find((s) => s.name === v.fromStore);
        const toStore = stores.find((s) => s.name === v.toStore);
        v.items.forEach((i) => {
          if (i.id === itemCode) {
            if (selectedBranchId === "all") {
              // Transfers are neutral for total stock
            } else {
              if (fromStore?.branchId === selectedBranchId) opening -= i.qty;
              if (toStore?.branchId === selectedBranchId) opening += i.qty;
            }
          }
        });
      }
    });

    setOpeningBalance(opening);

    // --- Report Data Calculation for the period ---
    type Transaction = {
      date: string;
      createdAt: string; // Add createdAt for sorting
      branch: string;
      type: string;
      ref: string;
      code: string;
      inward: number;
      outward: number;
      link: { page: string; label: string } | null;
    };
    const transactions: Transaction[] = [];

    const processTx = (
      tx: any,
      type: string,
      factor: number,
      linkInfo: { page: string; label: string },
      isInvoice: boolean,
    ) => {
      const branchMatches =
        selectedBranchId === "all" ||
        (isInvoice
          ? tx.branchName === selectedBranchName || tx.branchId === selectedBranchId
          : tx.branch === selectedBranchName || tx.branchId === selectedBranchId);
      const txDate = normalizeDate(tx.date);
      if (branchMatches && txDate >= normalizedStartDate && txDate <= normalizedEndDate) {
        const branchName = isInvoice ? tx.branchName : tx.branch;
        // For sales/purchase invoices and returns, use 'code' field
        // For warehouse vouchers, use 'voucherNumber' field
        const displayCode = tx.code || tx.voucherNumber || tx.id;
        // Use createdAt for sorting, fallback to date if not available
        const createdAt = tx.createdAt || tx.date;
        tx.items.forEach((item: any) => {
          if (item.id === itemCode) {
            transactions.push({
              date: tx.date,
              createdAt: createdAt,
              branch: branchName || "",
              type: type,
              ref: tx.id,
              code: displayCode,
              inward: factor > 0 ? item.qty : 0,
              outward: factor < 0 ? item.qty : 0,
              link: linkInfo,
            });
          }
        });
      }
    };

    // Collect all transactions first
    transformedPurchaseInvoices.forEach((inv) =>
      processTx(
        inv,
        "فاتورة مشتريات",
        1,
        { page: "purchase_invoice", label: "فاتورة مشتريات" },
        true,
      ),
    );
    transformedSalesReturns.forEach((inv) =>
      processTx(
        inv,
        "مرتجع مبيعات",
        1,
        { page: "sales_return", label: "مرتجع مبيعات" },
        true,
      ),
    );
    transformedStoreReceiptVouchers.forEach((v) =>
      processTx(
        v,
        "إذن إضافة مخزن",
        1,
        { page: "store_receipt_voucher", label: "إذن إضافة مخزن" },
        false,
      ),
    );

    // Sales invoices directly affect stock (no vouchers created)
    transformedSalesInvoices.forEach((inv) =>
      processTx(
        inv,
        "فاتورة مبيعات",
        -1,
        { page: "sales_invoice", label: "فاتورة مبيعات" },
        true,
      ),
    );
    transformedPurchaseReturns.forEach((inv) =>
      processTx(
        inv,
        "مرتجع مشتريات",
        -1,
        { page: "purchase_return", label: "مرتجع مشتريات" },
        true,
      ),
    );
    transformedStoreIssueVouchers.forEach((v) =>
      processTx(
        v,
        "إذن صرف مخزن",
        -1,
        { page: "store_issue_voucher", label: "إذن صرف مخزن" },
        false,
      ),
    );

    transformedStoreTransferVouchers.forEach((v) => {
      const vDate = normalizeDate(v.date);
      if (vDate >= normalizedStartDate && vDate <= normalizedEndDate) {
        const fromStore = stores.find((s) => s.name === v.fromStore);
        const toStore = stores.find((s) => s.name === v.toStore);
        const displayCode = v.voucherNumber || v.id;
        // Use createdAt for sorting, fallback to date if not available
        const createdAt = v.createdAt || v.date;
        v.items.forEach((item: any) => {
          if (item.id === itemCode) {
            if (
              selectedBranchId === "all" ||
              fromStore?.branchId === selectedBranchId
            ) {
              transactions.push({
                date: v.date,
                createdAt: createdAt,
                branch: fromStore?.branch?.name || "",
                type: `تحويل من ${v.fromStore}`,
                ref: v.id,
                code: displayCode,
                inward: 0,
                outward: item.qty,
                link: { page: "store_transfer", label: "تحويل مخزني" },
              });
            }
            if (
              selectedBranchId === "all" ||
              toStore?.branchId === selectedBranchId
            ) {
              transactions.push({
                date: v.date,
                createdAt: createdAt,
                branch: toStore?.branch?.name || "",
                type: `تحويل إلى ${v.toStore}`,
                ref: v.id,
                code: displayCode,
                inward: item.qty,
                outward: 0,
                link: { page: "store_transfer", label: "تحويل مخزني" },
              });
            }
          }
        });
      }
    });

    // Sort all transactions by date field from oldest to newest (ascending order)
    transactions.sort((a, b) => {
      // Sort by date field (transaction date)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      // If dates are equal, use ref as secondary sort to maintain consistent order
      if (dateA === dateB) {
        return String(a.ref).localeCompare(String(b.ref));
      }
      
      // Sort ascending: older dates first (oldest to newest)
      return dateA - dateB;
    });

    let balance = opening;
    const finalData = transactions.map((t) => {
      balance = balance + t.inward - t.outward;
      return { ...t, balance };
    });
    setReportData(finalData);
  }, [
    selectedItem,
    startDate,
    endDate,
    selectedBranchId,
    transformedSalesInvoices,
    transformedPurchaseInvoices,
    transformedSalesReturns,
    transformedPurchaseReturns,
    transformedStoreReceiptVouchers,
    transformedStoreIssueVouchers,
    transformedStoreTransferVouchers,
    stores,
    isLoading,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totalInward = reportData.reduce((sum, item) => sum + item.inward, 0);
  const totalOutward = reportData.reduce((sum, item) => sum + item.outward, 0);
  const finalBalance = openingBalance + totalInward - totalOutward;

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

  const handlePrint = () => {
    const reportContent = document.getElementById("printable-area");
    if (!reportContent) return;

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow?.document.write("<html><head><title>طباعة التقرير</title>");
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; font-size: 14px; }
                .no-print, .no-print * { display: none !important; visibility: hidden !important; margin: 0 !important; padding: 0 !important; }
                table { font-size: 13px; }
                th { font-size: 13px; font-weight: bold; }
                td { font-size: 13px; }
                .print-only.hidden { display: block !important; }
                .print-only { display: block !important; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                    .print-only.hidden { display: block !important; }
                    .print-only { display: block !important; }
                    .print\\:inline { display: inline !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px !important; }
                    th { font-size: 13px !important; font-weight: bold !important; }
                    td { font-size: 13px !important; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-dark { color: #1F2937 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-red-600 { color: #DC2626 !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
                    .justify-end { justify-content: flex-end !important; }
                }
            </style>
        `);
    printWindow?.document.write("</head><body>");
    printWindow?.document.write(reportContent.innerHTML);
    printWindow?.document.write("</body></html>");
    printWindow?.document.close();
    printWindow?.focus();
    setTimeout(() => {
      printWindow?.print();
      printWindow?.close();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} />
        <div className="px-6 py-4 text-base print-only border-t-2 border-b-2 mt-2 mb-4 bg-gray-50 hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-blue">الصنف:</span> {selectedItemName}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranchId === "all" ? "جميع الفروع" : branches.find(b => b.id === selectedBranchId)?.name || ""}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap no-print">
            <div className="relative">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث..."
                className={inputStyle + " w-40 pr-10"}
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
              />
            </div>
            <select
              className={inputStyle + " w-64"}
              value={selectedItemId || ""}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">اختر الصنف...</option>
              {filteredSelectItems.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >{`${item.code} - ${item.name}`}</option>
              ))}
            </select>
            <select
              className={inputStyle}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="all">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className={inputStyle}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
            <input
              type="date"
              className={inputStyle}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <button
              onClick={handleViewReport}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <div className="no-print flex items-center gap-2">
            <button
              title="تصدير Excel"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
            <button
              title="تصدير PDF"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handlePrint}
              title="طباعة"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-36">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  نوع الحركة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  وارد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  صادر
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td colSpan={6} className="px-6 py-3">
                  رصيد أول المدة
                </td>
                <td className={`px-6 py-3 ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-36">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4">{item.branch}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.type}
                  </td>
                  <td className="px-6 py-4">
                    {item.link ? (
                      <button
                        onClick={() =>
                          onNavigate(
                            item.link.page,
                            `${item.link.label} #${item.code}`,
                            item.ref,
                          )
                        }
                        className="text-brand-blue hover:underline font-semibold no-print"
                      >
                        {item.code}
                      </button>
                    ) : (
                      item.code
                    )}
                    <span className="print:inline hidden">{item.code}</span>
                  </td>
                  <td className="px-6 py-4 text-green-600">
                    {formatNumber(item.inward)}
                  </td>
                  <td className="px-6 py-4 text-red-600">
                    {formatNumber(item.outward)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold text-white">
                <td colSpan={4} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right text-white">
                  {formatNumber(totalInward)}
                </td>
                <td className="px-6 py-3 text-right text-white">
                  {formatNumber(totalOutward)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(finalBalance)}`}>
                  {formatNumber(finalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemMovementReport;
