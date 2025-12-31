import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from "../../../common/PermissionWrapper";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetItemsQuery, useGetItemGroupsQuery, type ItemGroup } from "../../../store/slices/items/itemsApi";
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
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";
import { useUserPermissions } from "../../../hook/usePermissions";

// Helper function to get user's branch ID
const getUserBranchId = (user: User | null): string | null => {
  if (!user) return null;
  if (user.branchId) return user.branchId;
  const branch = (user as any)?.branch;
  if (typeof branch === "string") return branch;
  if (branch && typeof branch === "object") return branch.id || null;
  return null;
};

interface ItemBalanceReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const ItemBalanceReport: React.FC<ItemBalanceReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  const { hasPermission } = useUserPermissions();
  
  // Check if user has SEARCH permission to view all branches
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.ITEM_BALANCE_REPORT, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Get store for selected branch
  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  
  // Get current user's branch ID
  const userBranchId = useMemo(() => getUserBranchId(currentUser), [currentUser]);
  
  // Branch filter state - default based on permission
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    // Compute initial value based on permission check
    const hasSearchPermission = hasPermission(
      buildPermission(Resources.ITEM_BALANCE_REPORT, Actions.SEARCH),
    );
    return hasSearchPermission 
      ? (userBranchId || "all") 
      : (userBranchId || "");
  });
  
  // Item group filter state - default to "all"
  const [selectedItemGroupId, setSelectedItemGroupId] = useState<string>("all");
  
  // Sync selectedBranchId when permission changes or branches load
  useEffect(() => {
    if (!canSearchAllBranches && branches.length > 0 && userBranchId) {
      // Verify the user's branch exists in branches list
      const userBranchExists = branches.some(b => b.id === userBranchId);
      if (userBranchExists && selectedBranchId !== userBranchId) {
        setSelectedBranchId(userBranchId);
      }
    } else if (!canSearchAllBranches && !userBranchId && selectedBranchId !== "") {
      setSelectedBranchId("");
    }
  }, [canSearchAllBranches, userBranchId, selectedBranchId, branches]);
  const { data: stores = [], isLoading: storesLoading } =
    useGetStoresQuery(undefined);
  const { data: itemGroups = [], isLoading: itemGroupsLoading } =
    useGetItemGroupsQuery(undefined);
  const typedItemGroups = (itemGroups as ItemGroup[]);
  
  const selectedStore = selectedBranchId === "all" 
    ? stores.find((store) => store.branchId === userBranchId)
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
    return (apiItems as any[])
      .filter((item) => item.type !== 'SERVICE') // Exclude SERVICE items
      .map((item) => ({
        ...item,
        unit: item.unit?.name || "",
        group: item.group?.name || "",
        groupId: item.groupId || item.group?.id || "",
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

  const isLoading =
    itemsLoading ||
    branchesLoading ||
    storesLoading ||
    itemGroupsLoading ||
    salesInvoicesLoading ||
    salesReturnsLoading ||
    purchaseInvoicesLoading ||
    purchaseReturnsLoading ||
    storeReceiptVouchersLoading ||
    storeIssueVouchersLoading ||
    storeTransferVouchersLoading;
  const [reportData, setReportData] = useState<any[]>([]);
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const handleViewReport = useCallback(() => {
    if (isLoading) return;

    const balanceData = items.map((item) => {
      // Use StoreItem's openingBalance as base, or 0 if not available
      let openingBalance = (item as any).openingBalance ?? 0;
      let totalIncoming = 0;
      let totalOutgoing = 0;

      const selectedBranchName = selectedBranchId === "all" 
        ? "all"
        : branches.find(b => b.id === selectedBranchId)?.name || "";
      
      const filterByBranch = (tx: any) =>
        selectedBranchId === "all" ||
        tx.branch === selectedBranchName ||
        tx.branchName === selectedBranchName ||
        tx.branchId === selectedBranchId;

      const getDateString = (date: any): string => {
        if (!date) return "";
        if (typeof date === "string") {
          return date.substring(0, 10); // Get YYYY-MM-DD format
        }
        if (date instanceof Date) {
          return date.toISOString().substring(0, 10);
        }
        return "";
      };

      const filterByDate = (tx: any) => {
        const txDate = getDateString(tx.date);
        if (!txDate) return false;
        return txDate >= startDate && txDate <= endDate;
      };

      const isBeforeStartDate = (tx: any) => {
        const txDate = getDateString(tx.date);
        if (!txDate) return false;
        return txDate < startDate;
      };

      // Calculate opening balance (transactions before start date)
      // Includes: Purchase Invoices, Sales Returns, Add Warehouse (Store Receipt), Transfer to Outstanding Warehouse
      transformedPurchaseInvoices.filter(filterByBranch).filter(isBeforeStartDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) openingBalance += i.qty;
        }),
      );
      transformedSalesReturns.filter(filterByBranch).filter(isBeforeStartDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) openingBalance += i.qty;
        }),
      );
      transformedStoreReceiptVouchers.filter(filterByBranch).filter(isBeforeStartDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) openingBalance += i.qty;
        }),
      );
      // Outgoing transactions before start date (reduce opening balance)
      // Includes: Sales Invoices, Purchase Returns, Warehouse Issue (Store Issue), Branch Warehouse Transfer
      transformedSalesInvoices.filter(filterByBranch).filter(isBeforeStartDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) openingBalance -= i.qty;
        }),
      );
      transformedPurchaseReturns.filter(filterByBranch).filter(isBeforeStartDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) openingBalance -= i.qty;
        }),
      );
      transformedStoreIssueVouchers.filter(filterByBranch).filter(isBeforeStartDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) openingBalance -= i.qty;
        }),
      );

      // Store transfers before start date
      // Only process transfers when reporting for a single branch (not "all branches")
      // When all branches are selected, transfers are ignored as they don't affect total inventory
      // Branch Warehouse Transfer: counts as outgoing when transfer is FROM the selected branch
      // Transfer to Outstanding Warehouse: counts as incoming when transfer is TO the selected branch
      if (selectedBranchId !== "all") {
        transformedStoreTransferVouchers.filter(isBeforeStartDate).forEach((v) => {
          const fromStore = stores.find((s) => s.name === v.fromStore);
          const toStore = stores.find((s) => s.name === v.toStore);
          v.items.forEach((i) => {
            if (i.id === item.code) {
              if (fromStore?.branchId === selectedBranchId) openingBalance -= i.qty;
              if (toStore?.branchId === selectedBranchId) openingBalance += i.qty;
            }
          });
        });
      }

      // Calculate total incoming (within date range)
      // Includes: Purchase Invoices, Sales Returns, Add Warehouse (Store Receipt), Transfer to Outstanding Warehouse
      transformedPurchaseInvoices.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) totalIncoming += i.qty;
        }),
      );
      transformedSalesReturns.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) totalIncoming += i.qty;
        }),
      );
      transformedStoreReceiptVouchers.filter(filterByBranch).filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) totalIncoming += i.qty;
        }),
      );

      // Calculate total outgoing (within date range)
      // Includes: Sales Invoices, Purchase Returns, Warehouse Issue (Store Issue), Branch Warehouse Transfer
      transformedSalesInvoices.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) totalOutgoing += i.qty;
        }),
      );
      transformedPurchaseReturns.filter(filterByBranch).filter(filterByDate).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) totalOutgoing += i.qty;
        }),
      );
      transformedStoreIssueVouchers.filter(filterByBranch).filter(filterByDate).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) totalOutgoing += i.qty;
        }),
      );

      // Store transfers within date range
      // Only process transfers when reporting for a single branch (not "all branches")
      // When all branches are selected, transfers are ignored as they don't affect total inventory
      // Branch Warehouse Transfer: counts as outgoing when transfer is FROM the selected branch
      // Transfer to Outstanding Warehouse: counts as incoming when transfer is TO the selected branch
      if (selectedBranchId !== "all") {
        transformedStoreTransferVouchers.filter(filterByDate).forEach((v) => {
          const fromStore = stores.find((s) => s.name === v.fromStore);
          const toStore = stores.find((s) => s.name === v.toStore);
          v.items.forEach((i) => {
            if (i.id === item.code) {
              if (fromStore?.branchId === selectedBranchId) totalOutgoing += i.qty;
              if (toStore?.branchId === selectedBranchId) totalIncoming += i.qty;
            }
          });
        });
      }

      const currentBalance = openingBalance + totalIncoming - totalOutgoing;

      return {
        ...item,
        openingBalance,
        totalIncoming,
        totalOutgoing,
        balance: currentBalance,
      };
    })
    .filter((item) => {
      // Filter by item group
      if (selectedItemGroupId === "all") return true;
      return (item as any).groupId === selectedItemGroupId;
    });
    setReportData(balanceData);
  }, [
    items,
    selectedBranchId,
    startDate,
    endDate,
    transformedSalesInvoices,
    transformedSalesReturns,
    transformedPurchaseInvoices,
    transformedPurchaseReturns,
    transformedStoreReceiptVouchers,
    transformedStoreIssueVouchers,
    transformedStoreTransferVouchers,
    stores,
    isLoading,
    selectedItemGroupId,
    branches,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

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
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .bg-green-100 { background-color: #D1FAE5 !important; }
                    .bg-red-100 { background-color: #FEE2E2 !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .text-green-600 { color: #059669 !important; }
                    .text-red-600 { color: #DC2626 !important; }
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
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">الفرع:</span> {selectedBranchId === "all" ? "جميع الفروع" : branches.find(b => b.id === selectedBranchId)?.name || ""}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">مجموعة الأصناف:</span> {selectedItemGroupId === "all" ? "جميع المجموعات" : typedItemGroups.find(g => g.id === selectedItemGroupId)?.name || ""}
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
            <label className="font-semibold">الفرع:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={!canSearchAllBranches}
            >
              {canSearchAllBranches && <option value="all">جميع الفروع</option>}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
              {!canSearchAllBranches && !branches.find(b => b.id === selectedBranchId) && userBranchId && (
                <option value={userBranchId}>
                  {branches.find(b => b.id === userBranchId)?.name || "الفرع الحالي"}
                </option>
              )}
            </select>
            <label className="font-semibold">مجموعة الأصناف:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={selectedItemGroupId}
              onChange={(e) => setSelectedItemGroupId(e.target.value)}
            >
              <option value="all">جميع المجموعات</option>
              {typedItemGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">من:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <label className="font-semibold">إلى:</label>
            <input
              type="date"
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
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
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.ITEM_BALANCE_REPORT,
              Actions.PRINT,
            )}
            fallback={
              <div className="no-print flex items-center gap-2">
                <button
                  title="تصدير Excel"
                  disabled
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <ExcelIcon className="w-6 h-6" />
                </button>
                <button
                  title="تصدير PDF"
                  disabled
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PdfIcon className="w-6 h-6" />
                </button>
                <button
                  title="طباعة"
                  disabled
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PrintIcon className="w-6 h-6" />
                </button>
              </div>
            }
          >
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
          </PermissionWrapper>
        </div>

        <div className="overflow-x-auto border-2 border-brand-blue rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-64">
                  اسم الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  مجموعة الأصناف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الوحدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رصيد أول المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي وارد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي صادر
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد الحالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-4 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-80">
                    {item.name}
                  </td>
                  <td className="px-6 py-4">{item.group}</td>
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.openingBalance)}`}>
                    {formatNumber(item.openingBalance)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.totalIncoming)}`}>
                    {formatNumber(item.totalIncoming)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.totalOutgoing)}`}>
                    {formatNumber(item.totalOutgoing)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemBalanceReport;
