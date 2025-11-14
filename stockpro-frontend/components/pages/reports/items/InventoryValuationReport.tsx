import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { CompanyInfo, User } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
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

interface InventoryValuationReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
}

const InventoryValuationReport: React.FC<InventoryValuationReportProps> = ({
  title,
  companyInfo,
  currentUser,
}) => {
  // API hooks
  const { data: apiItems = [], isLoading: itemsLoading } =
    useGetItemsQuery(undefined);
  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { data: stores = [], isLoading: storesLoading } =
    useGetStoresQuery(undefined);
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
  const [reportData, setReportData] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [valuationMethod, setValuationMethod] = useState<
    "purchasePrice" | "salePrice" | "averageCost"
  >("purchasePrice");

  const handleViewReport = useCallback(() => {
    if (isLoading) return;

    const valuationData = items.map((item) => {
      let balance = item.stock; // Opening balance

      const filterByBranch = (tx: any) =>
        selectedBranch === "all" ||
        tx.branch === selectedBranch ||
        tx.branchName === selectedBranch;

      transformedPurchaseInvoices.filter(filterByBranch).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += i.qty;
        }),
      );
      transformedSalesReturns.filter(filterByBranch).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance += i.qty;
        }),
      );
      transformedStoreReceiptVouchers.filter(filterByBranch).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance += i.qty;
        }),
      );

      transformedSalesInvoices.filter(filterByBranch).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= i.qty;
        }),
      );
      transformedPurchaseReturns.filter(filterByBranch).forEach((inv) =>
        inv.items.forEach((i) => {
          if (i.id === item.code) balance -= i.qty;
        }),
      );
      transformedStoreIssueVouchers.filter(filterByBranch).forEach((v) =>
        v.items.forEach((i) => {
          if (i.id === item.code) balance -= i.qty;
        }),
      );

      if (selectedBranch !== "all") {
        transformedStoreTransferVouchers.forEach((v) => {
          const fromStore = stores.find((s) => s.name === v.fromStore);
          const toStore = stores.find((s) => s.name === v.toStore);
          v.items.forEach((i) => {
            if (i.id === item.code) {
              if (fromStore?.branch?.name === selectedBranch) balance -= i.qty;
              if (toStore?.branch?.name === selectedBranch) balance += i.qty;
            }
          });
        });
      }

      let cost = 0;
      switch (valuationMethod) {
        case "salePrice":
          cost = item.salePrice;
          break;
        case "averageCost":
          // NOTE: True weighted average cost requires tracking purchase history.
          // Using last purchase price as a proxy.
          cost = item.purchasePrice;
          break;
        case "purchasePrice":
        default:
          cost = item.purchasePrice;
          break;
      }

      const value = balance * cost;

      return {
        ...item,
        balance,
        cost,
        value,
      };
    });
    setReportData(valuationData);
  }, [
    items,
    selectedBranch,
    valuationMethod,
    transformedSalesInvoices,
    transformedSalesReturns,
    transformedPurchaseInvoices,
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

  const totalValue = reportData.reduce((acc, item) => acc + item.value, 0);

  const handlePrint = () => {
    const reportContent = document.getElementById("printable-area");
    if (!reportContent) return;

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow?.document.write("<html><head><title>طباعة التقرير</title>");
    printWindow?.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow?.document.write(
      '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
    );
    printWindow?.document.write(`
            <style>
                body { font-family: "Cairo", sans-serif; direction: rtl; }
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    table { width: 100%; border-collapse: collapse; }
                    .bg-brand-blue { background-color: #1E40AF !important; }
                    .text-white { color: white !important; }
                    .bg-gray-50 { background-color: #F9FAFB !important; }
                    .text-brand-blue { color: #1E40AF !important; }
                    .text-gray-700 { color: #374151 !important; }
                    .text-gray-800 { color: #1F2937 !important; }
                    .flex { display: flex !important; }
                    .justify-between { justify-content: space-between !important; }
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
        <div className="border-2 border-brand-blue rounded-lg mb-4">
          <InvoiceHeader
            branchName={typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
            userName={currentUser?.fullName || currentUser?.name}
          />
        </div>
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="space-y-2 text-right">
              <p className="text-lg font-bold text-gray-800">
                <span className="text-brand-blue">تقييم حسب سعر:</span> {
                  valuationMethod === 'purchasePrice' ? 'آخر شراء' :
                  valuationMethod === 'averageCost' ? 'متوسط التكلفة' :
                  valuationMethod === 'salePrice' ? 'سعر البيع' :
                  'آخر شراء'
                }
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">فرع الطباعة:</span> {typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">المستخدم:</span> {currentUser?.fullName || currentUser?.name}
              </p>
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 no-print">
          <div className="flex items-center gap-4">
            <label className="font-semibold">الفرع:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">جميع الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">تقييم حسب سعر:</label>
            <select
              className="p-2 border-2 border-brand-blue rounded-md bg-brand-blue-bg"
              value={valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value as any)}
            >
              <option value="purchasePrice">آخر شراء</option>
              <option value="averageCost">متوسط التكلفة</option>
              <option value="salePrice">سعر البيع</option>
            </select>
            <button
              onClick={handleViewReport}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2"
            >
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
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
                <th className="px-4 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-80">
                  اسم الصنف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الوحدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  السعر
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  القيمة الإجمالية
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
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.balance)}`}>{formatNumber(item.balance)}</td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.cost)}`}>{formatNumber(item.cost)}</td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.value)}`}>
                    {formatNumber(item.value)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td colSpan={5} className="px-6 py-3 text-right">
                  إجمالي قيمة المخزون
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalValue)}`}>
                  {formatNumber(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryValuationReport;
