import React, { useState, useMemo, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Supplier,
  User,
  Invoice,
  Voucher,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetSuppliersQuery } from "../../../store/slices/supplier/supplierApiSlice";
import { useGetPurchaseInvoicesQuery } from "../../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetPurchaseReturnsQuery } from "../../../store/slices/purchaseReturn/purchaseReturnApiSlice";

interface SupplierStatementReportProps {
  title: string;
  companyInfo: CompanyInfo;
  onNavigate: (
    pageKey: string,
    pageLabel: string,
    recordId: string | number,
  ) => void;
  currentUser: User | null;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
}

const SupplierStatementReport: React.FC<SupplierStatementReportProps> = ({
  title,
  companyInfo,
  onNavigate,
  currentUser,
  receiptVouchers,
  paymentVouchers,
}) => {
  // API hooks
  const { data: apiSuppliers = [], isLoading: suppliersLoading } =
    useGetSuppliersQuery(undefined);
  const { data: apiPurchaseInvoices = [], isLoading: purchaseInvoicesLoading } =
    useGetPurchaseInvoicesQuery(undefined);
  const { data: apiPurchaseReturns = [], isLoading: purchaseReturnsLoading } =
    useGetPurchaseReturnsQuery(undefined);

  // Transform API data to match expected format
  const suppliers = useMemo(() => {
    return (apiSuppliers as any[]).map((supplier) => ({
      ...supplier,
      // Add any necessary transformations here
    }));
  }, [apiSuppliers]);

  const purchaseInvoices = useMemo(() => {
    return (apiPurchaseInvoices as any[]).map((invoice) => ({
      ...invoice,
      // Transform nested supplier data
      customerOrSupplier: invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiPurchaseInvoices]);

  const purchaseReturns = useMemo(() => {
    return (apiPurchaseReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested supplier data
      customerOrSupplier: returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiPurchaseReturns]);

  const isLoading =
    suppliersLoading || purchaseInvoicesLoading || purchaseReturnsLoading;
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    suppliers.length > 0 ? suppliers[0].id.toString() : null,
  );

  const [reportData, setReportData] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()),
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id.toString() === selectedSupplierId),
    [suppliers, selectedSupplierId],
  );
  const selectedSupplierName = selectedSupplier?.name || "غير محدد";

  const handleViewReport = useCallback(() => {
    if (!selectedSupplier) {
      setReportData([]);
      setOpeningBalance(0);
      return;
    }
    const supplierId = selectedSupplier.id;
    const supplierIdStr = supplierId.toString();

    const purchasesBefore = purchaseInvoices
      .filter(
        (i) => i.customerOrSupplier?.id === supplierIdStr && i.date < startDate,
      )
      .reduce((sum, i) => sum + i.totals.net, 0); // Credit
    const returnsBefore = purchaseReturns
      .filter(
        (i) => i.customerOrSupplier?.id === supplierIdStr && i.date < startDate,
      )
      .reduce((sum, i) => sum + i.totals.net, 0); // Debit
    const paymentsBefore = paymentVouchers
      .filter(
        (v) =>
          v.entity.type === "supplier" &&
          v.entity.id == supplierId &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0); // Debit
    const receiptsBefore = receiptVouchers
      .filter(
        (v) =>
          v.entity.type === "supplier" &&
          v.entity.id == supplierId &&
          v.date < startDate,
      )
      .reduce((sum, v) => sum + v.amount, 0); // Credit

    const currentOpeningBalance =
      selectedSupplier.openingBalance +
      paymentsBefore +
      returnsBefore -
      purchasesBefore -
      receiptsBefore;
    setOpeningBalance(currentOpeningBalance);

    const transactions: {
      date: string;
      description: string;
      ref: string;
      voucherCode: string;
      debit: number;
      credit: number;
      link: { page: string; label: string } | null;
    }[] = [];

    // Credit (Increases what we owe)
    purchaseInvoices.forEach((inv) => {
      if (
        inv.customerOrSupplier?.id === supplierIdStr &&
        inv.date >= startDate &&
        inv.date <= endDate
      ) {
        transactions.push({
          date: inv.date,
          description: "فاتورة مشتريات",
          ref: inv.id,
          voucherCode: inv.code || inv.id,
          debit: 0,
          credit: inv.totals.net,
          link: { page: "purchase_invoice", label: "فاتورة مشتريات" },
        });
      }
    });
    receiptVouchers.forEach((v) => {
      // Refund from supplier we cashed
      if (
        v.entity.type === "supplier" &&
        v.entity.id == supplierId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند قبض (رد مبلغ)",
          ref: v.id,
          voucherCode: (v as any).code || v.id,
          debit: 0,
          credit: v.amount,
          link: { page: "receipt_voucher", label: "سند قبض" },
        });
      }
    });

    // Debit (Decreases what we owe)
    purchaseReturns.forEach((inv) => {
      if (
        inv.customerOrSupplier?.id === supplierIdStr &&
        inv.date >= startDate &&
        inv.date <= endDate
      ) {
        transactions.push({
          date: inv.date,
          description: "مرتجع مشتريات",
          ref: inv.id,
          voucherCode: inv.code || inv.id,
          debit: inv.totals.net,
          credit: 0,
          link: { page: "purchase_return", label: "مرتجع مشتريات" },
        });
      }
    });
    paymentVouchers.forEach((v) => {
      if (
        v.entity.type === "supplier" &&
        v.entity.id == supplierId &&
        v.date >= startDate &&
        v.date <= endDate
      ) {
        transactions.push({
          date: v.date,
          description: "سند صرف",
          ref: v.id,
          voucherCode: (v as any).code || v.id,
          debit: v.amount,
          credit: 0,
          link: { page: "payment_voucher", label: "سند صرف" },
        });
      }
    });

    transactions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let balance = currentOpeningBalance;
    const finalData = transactions.map((t) => {
      balance = balance + t.debit - t.credit;
      return { ...t, balance };
    });

    setReportData(finalData);
  }, [
    selectedSupplier,
    purchaseInvoices,
    purchaseReturns,
    paymentVouchers,
    receiptVouchers,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const totalDebit = reportData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = reportData.reduce((sum, item) => sum + item.credit, 0);
  const finalBalance = openingBalance + totalDebit - totalCredit;

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
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2 space-y-1">
          <p>
            <strong>المورد:</strong> {selectedSupplierName}
          </p>
          <p>
            <strong>الفترة من:</strong> {startDate} <strong>إلى:</strong>{" "}
            {endDate}
          </p>
          <p>
            <strong>فرع الطباعة:</strong> {typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName || currentUser?.name}
          </p>
        </div>
        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="text"
              placeholder="بحث عن مورد..."
              className={inputStyle + " w-48"}
              value={supplierSearchTerm}
              onChange={(e) => setSupplierSearchTerm(e.target.value)}
            />
            <select
              className={inputStyle}
              value={selectedSupplierId || ""}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">اختر المورد...</option>
              {filteredSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
                  البيان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المرجع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  دائن
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
                <td className={`px-6 py-3 font-bold ${getNegativeNumberClass(openingBalance)}`}>
                  {formatNumber(openingBalance)}
                </td>
              </tr>
              {reportData.map((item, index) => (
                <tr key={index} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{item.date.substring(0, 10)}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.description}{" "}
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
                        ({item.ref})
                      </button>
                    ) : (
                      `(${item.ref})`
                    )}
                    <span className="print:inline hidden">({item.ref})</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {item.voucherCode}
                  </td>
                  <td className={`px-6 py-4 text-green-600 ${getNegativeNumberClass(item.debit)}`}>
                    {formatNumber(item.debit)}
                  </td>
                  <td className={`px-6 py-4 text-red-600 ${getNegativeNumberClass(item.credit)}`}>
                    {formatNumber(item.credit)}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue">
              <tr className="font-bold text-white">
                <td colSpan={3} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalDebit)}`}>
                  {formatNumber(totalDebit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totalCredit)}`}>
                  {formatNumber(totalCredit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(finalBalance)}`}>
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

export default SupplierStatementReport;
