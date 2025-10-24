import React, { useState, useMemo, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Item,
  User,
  Invoice,
  StoreReceiptVoucher,
  StoreIssueVoucher,
  StoreTransferVoucher,
  Branch,
  Store,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber } from "../../../../utils/formatting";

interface ItemMovementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  items: Item[];
  salesInvoices: Invoice[];
  purchaseInvoices: Invoice[];
  salesReturns: Invoice[];
  purchaseReturns: Invoice[];
  storeReceiptVouchers: StoreReceiptVoucher[];
  storeIssueVouchers: StoreIssueVoucher[];
  storeTransferVouchers: StoreTransferVoucher[];
  onNavigate: (
    pageKey: string,
    pageLabel: string,
    recordId: string | number,
  ) => void;
  currentUser: User | null;
  branches: Branch[];
  stores: Store[];
}

const ItemMovementReport: React.FC<ItemMovementReportProps> = ({
  title,
  companyInfo,
  items,
  salesInvoices,
  purchaseInvoices,
  salesReturns,
  purchaseReturns,
  storeReceiptVouchers,
  storeIssueVouchers,
  storeTransferVouchers,
  onNavigate,
  currentUser,
  branches,
  stores,
}) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    items.length > 0 ? items[0].id.toString() : null,
  );
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

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
    if (!selectedItem) {
      setReportData([]);
      setOpeningBalance(0);
      return;
    }

    const itemCode = selectedItem.code;
    const filterByBranch = (tx: any) =>
      selectedBranch === "all" ||
      tx.branch === selectedBranch ||
      tx.branchName === selectedBranch;

    // --- Correct Opening Balance Calculation ---
    let opening = selectedItem.stock;

    const adjustBalance = (
      txList: any[],
      factor: number,
      isInvoice: boolean,
    ) => {
      txList.forEach((tx: any) => {
        const branchMatches =
          selectedBranch === "all" ||
          (isInvoice
            ? tx.branchName === selectedBranch
            : tx.branch === selectedBranch);
        if (branchMatches && tx.date < startDate) {
          tx.items.forEach((item: any) => {
            if (item.id === itemCode) {
              opening += item.qty * factor;
            }
          });
        }
      });
    };

    adjustBalance(purchaseInvoices, 1, true);
    adjustBalance(salesReturns, 1, true);
    adjustBalance(storeReceiptVouchers, 1, false);
    adjustBalance(salesInvoices, -1, true);
    adjustBalance(purchaseReturns, -1, true);
    adjustBalance(storeIssueVouchers, -1, false);

    storeTransferVouchers.forEach((v) => {
      if (v.date < startDate) {
        const fromStore = stores.find((s) => s.name === v.fromStore);
        const toStore = stores.find((s) => s.name === v.toStore);
        v.items.forEach((i) => {
          if (i.id === itemCode) {
            if (selectedBranch === "all") {
              // Transfers are neutral for total stock
            } else {
              if (fromStore?.branch === selectedBranch) opening -= i.qty;
              if (toStore?.branch === selectedBranch) opening += i.qty;
            }
          }
        });
      }
    });

    setOpeningBalance(opening);

    // --- Report Data Calculation for the period ---
    type Transaction = {
      date: string;
      type: string;
      ref: string;
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
        selectedBranch === "all" ||
        (isInvoice
          ? tx.branchName === selectedBranch
          : tx.branch === selectedBranch);
      if (branchMatches && tx.date >= startDate && tx.date <= endDate) {
        tx.items.forEach((item: any) => {
          if (item.id === itemCode) {
            transactions.push({
              date: tx.date,
              type: type,
              ref: tx.id,
              inward: factor > 0 ? item.qty : 0,
              outward: factor < 0 ? item.qty : 0,
              link: linkInfo,
            });
          }
        });
      }
    };

    purchaseInvoices.forEach((inv) =>
      processTx(
        inv,
        "فاتورة مشتريات",
        1,
        { page: "purchase_invoice", label: "فاتورة مشتريات" },
        true,
      ),
    );
    salesReturns.forEach((inv) =>
      processTx(
        inv,
        "مرتجع مبيعات",
        1,
        { page: "sales_return", label: "مرتجع مبيعات" },
        true,
      ),
    );
    storeReceiptVouchers.forEach((v) =>
      processTx(
        v,
        "إذن إضافة مخزن",
        1,
        { page: "store_receipt_voucher", label: "إذن إضافة مخزن" },
        false,
      ),
    );

    salesInvoices.forEach((inv) =>
      processTx(
        inv,
        "فاتورة مبيعات",
        -1,
        { page: "sales_invoice", label: "فاتورة مبيعات" },
        true,
      ),
    );
    purchaseReturns.forEach((inv) =>
      processTx(
        inv,
        "مرتجع مشتريات",
        -1,
        { page: "purchase_return", label: "مرتجع مشتريات" },
        true,
      ),
    );
    storeIssueVouchers.forEach((v) =>
      processTx(
        v,
        "إذن صرف مخزن",
        -1,
        { page: "store_issue_voucher", label: "إذن صرف مخزن" },
        false,
      ),
    );

    storeTransferVouchers.forEach((v) => {
      if (v.date >= startDate && v.date <= endDate) {
        const fromStore = stores.find((s) => s.name === v.fromStore);
        const toStore = stores.find((s) => s.name === v.toStore);
        v.items.forEach((item: any) => {
          if (item.id === itemCode) {
            if (
              selectedBranch === "all" ||
              fromStore?.branch === selectedBranch
            ) {
              transactions.push({
                date: v.date,
                type: `تحويل من ${v.fromStore}`,
                ref: v.id,
                inward: 0,
                outward: item.qty,
                link: { page: "store_transfer", label: "تحويل مخزني" },
              });
            }
            if (
              selectedBranch === "all" ||
              toStore?.branch === selectedBranch
            ) {
              transactions.push({
                date: v.date,
                type: `تحويل إلى ${v.toStore}`,
                ref: v.id,
                inward: item.qty,
                outward: 0,
                link: { page: "store_transfer", label: "تحويل مخزني" },
              });
            }
          }
        });
      }
    });

    transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

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
    selectedBranch,
    salesInvoices,
    purchaseInvoices,
    salesReturns,
    purchaseReturns,
    storeReceiptVouchers,
    storeIssueVouchers,
    storeTransferVouchers,
    stores,
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
                    .bg-gray-100 { background-color: #F3F4F6 !important; }
                    .text-brand-dark { color: #1F2937 !important; }
                    .text-green-600 { color: #16A34A !important; }
                    .text-red-600 { color: #DC2626 !important; }
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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>الصنف:</strong> {selectedItemName}
          </p>
          <p>
            <strong>الفترة من:</strong> {startDate} <strong>إلى:</strong>{" "}
            {endDate}
          </p>
          <p>
            <strong>فرع الطباعة:</strong> {currentUser?.branch}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
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
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  التاريخ
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
                <td colSpan={5} className="px-6 py-3 font-bold">
                  رصيد أول المدة
                </td>
                <td className="px-6 py-3 font-bold">
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.type}
                  </td>
                  <td className="px-6 py-4">
                    {item.link ? (
                      <button
                        onClick={() =>
                          onNavigate(
                            item.link.page,
                            `${item.link.label} #${item.ref}`,
                            item.ref,
                          )
                        }
                        className="text-brand-blue hover:underline font-semibold no-print"
                      >
                        {item.ref}
                      </button>
                    ) : (
                      item.ref
                    )}
                    <span className="print:inline hidden">{item.ref}</span>
                  </td>
                  <td className="px-6 py-4 text-green-600">
                    {formatNumber(item.inward)}
                  </td>
                  <td className="px-6 py-4 text-red-600">
                    {formatNumber(item.outward)}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-bold text-brand-dark">
                <td colSpan={3} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right text-green-600">
                  {formatNumber(totalInward)}
                </td>
                <td className="px-6 py-3 text-right text-red-600">
                  {formatNumber(totalOutward)}
                </td>
                <td className="px-6 py-3 text-right">
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
