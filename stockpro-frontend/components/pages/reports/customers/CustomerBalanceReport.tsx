import React, { useMemo, useState, useCallback, useEffect } from "react";
import type {
  CompanyInfo,
  Customer,
  Invoice,
  Voucher,
  Branch,
  User,
} from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import InvoiceHeader from "../../../common/InvoiceHeader";
import { formatNumber, getNegativeNumberClass } from "../../../../utils/formatting";
import { useGetCustomersQuery } from "../../../store/slices/customer/customerApiSlice";
import { useGetSalesInvoicesQuery } from "../../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetSalesReturnsQuery } from "../../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetBranchesQuery } from "../../../store/slices/branch/branchApi";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { useAuth } from "../../../hook/Auth";
import { getCurrentYearRange } from "../dateUtils";

interface CustomerBalanceReportProps {
  title: string;
  companyInfo: CompanyInfo;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const CustomerBalanceReport: React.FC<CustomerBalanceReportProps> = ({
  title,
  companyInfo,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
  currentUser,
}) => {
  const { isAuthed } = useAuth();
  const skip = !isAuthed;

  // API hooks
  const { data: apiCustomers = [], isLoading: customersLoading } =
    useGetCustomersQuery(undefined);
  const { data: apiSalesInvoices = [], isLoading: salesInvoicesLoading } =
    useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } =
    useGetSalesReturnsQuery(undefined);
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);
  const { 
    data: apiReceiptVouchers = [], 
    isLoading: receiptVouchersLoading,
  } = useGetReceiptVouchersQuery(undefined, { skip });
  const { 
    data: apiPaymentVouchers = [], 
    isLoading: paymentVouchersLoading,
  } = useGetPaymentVouchersQuery(undefined, { skip });

  // Use API vouchers if authenticated and API is being used, otherwise fall back to props
  const rawReceiptVouchers = isAuthed ? apiReceiptVouchers : (propReceiptVouchers || []);
  const rawPaymentVouchers = isAuthed ? apiPaymentVouchers : (propPaymentVouchers || []);

  // Transform API data to match expected format
  const customers = useMemo(() => {
    return (apiCustomers as any[]).map((customer) => ({
      ...customer,
      // Add any necessary transformations here
    }));
  }, [apiCustomers]);

  const salesInvoices = useMemo(() => {
    return (apiSalesInvoices as any[]).map((invoice) => ({
      ...invoice,
      // Transform nested customer data
      customerOrSupplier: invoice.customer
        ? {
            id: invoice.customer.id.toString(),
            name: invoice.customer.name,
          }
        : invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
      // Transform totals structure
      totals: invoice.totals || {
        subtotal: invoice.subtotal || 0,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        net: invoice.net || 0,
      },
    }));
  }, [apiSalesInvoices]);

  const salesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested customer data
      customerOrSupplier: returnInvoice.customer
        ? {
            id: returnInvoice.customer.id.toString(),
            name: returnInvoice.customer.name,
          }
        : returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
      // Transform totals structure
      totals: returnInvoice.totals || {
        subtotal: returnInvoice.subtotal || 0,
        discount: returnInvoice.discount || 0,
        tax: returnInvoice.tax || 0,
        net: returnInvoice.net || 0,
      },
    }));
  }, [apiSalesReturns]);

  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
      // Add any necessary transformations here
    }));
  }, [apiBranches]);

  // Helper function to normalize dates to YYYY-MM-DD format
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
      } catch (e) {
        // Ignore parsing errors
      }
      return "";
    };
  }, []);

  // Transform vouchers to match expected structure
  const receiptVouchers = useMemo(() => {
    return rawReceiptVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName || "",
      };
      
      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawReceiptVouchers, normalizeDate]);

  const paymentVouchers = useMemo(() => {
    return rawPaymentVouchers.map((voucher: any) => {
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || "",
        name: voucher.entityName || "",
      };
      
      return {
        id: voucher.id,
        code: voucher.code || voucher.id,
        date: normalizeDate(voucher.date),
        entity: entity,
        amount: voucher.amount,
        description: voucher.description || "",
        paymentMethod: voucher.paymentMethod,
        safeOrBankId: voucher.safeId || voucher.bankId,
      };
    });
  }, [rawPaymentVouchers, normalizeDate]);

  const isLoading =
    customersLoading ||
    salesInvoicesLoading ||
    salesReturnsLoading ||
    branchesLoading ||
    receiptVouchersLoading ||
    paymentVouchersLoading;
  const { end: defaultEndDate } = getCurrentYearRange();
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reportData, setReportData] = useState<any[]>([]);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const handleViewReport = useCallback(() => {
    const customerBalanceData = customers.map((customer) => {
      const customerIdStr = customer.id.toString();
      const customerId = customer.id;

      const totalSales = salesInvoices
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
            return (invCustomerId === customerIdStr || invCustomerId == customerId) && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const totalReturns = salesReturns
        .filter(
          (inv) => {
            const invDate = normalizeDate(inv.date);
            const invCustomerId = inv.customerOrSupplier?.id || inv.customerId?.toString() || (inv.customer?.id?.toString());
            return (invCustomerId === customerIdStr || invCustomerId == customerId) && invDate <= endDate;
          }
        )
        .reduce((sum, inv) => sum + (inv.totals?.net || inv.net || 0), 0);

      const totalReceipts = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "customer" &&
              (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
              vDate <= endDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const totalPayments = paymentVouchers // Refunds to customer
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherCustomerId = v.entity?.id?.toString() || v.entity?.id;
            return v.entity?.type === "customer" &&
              (voucherCustomerId === customerIdStr || voucherCustomerId == customerId) &&
              vDate <= endDate;
          }
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const opening = customer.openingBalance;
      // Total Debit: sales invoices, payment vouchers (all increase what customer owes)
      const totalDebit = totalSales + totalPayments;
      // Total Credit: sales returns, receipt vouchers (all decrease what customer owes)
      const totalCredit = totalReturns + totalReceipts;
      // Balance = Beginning Balance + Total Debit - Total Credit
      const balance = opening + totalDebit - totalCredit;

      return {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        opening,
        debit: totalDebit,
        credit: totalCredit,
        balance,
      };
    });
    setReportData(customerBalanceData);
  }, [
    customers,
    salesInvoices,
    salesReturns,
    receiptVouchers,
    paymentVouchers,
    endDate,
    normalizeDate,
  ]);

  useEffect(() => {
    handleViewReport();
  }, [handleViewReport]);

  const filteredReportData = useMemo(() => {
    if (hideZeroBalance) {
      return reportData.filter((item) => Math.abs(item.balance) > 0.01);
    }
    return reportData;
  }, [reportData, hideZeroBalance]);

  const totals = filteredReportData.reduce(
    (acc, item) => {
      acc.opening += item.opening;
      acc.debit += item.debit;
      acc.credit += item.credit;
      acc.balance += item.balance;
      return acc;
    },
    { opening: 0, debit: 0, credit: 0, balance: 0 },
  );

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
                @media print {
                    body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; font-size: 14px !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
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
        <div className="border-2 border-brand-blue rounded-lg mb-4">
          <InvoiceHeader
            branchName={typeof currentUser?.branch === 'string' ? currentUser.branch : (currentUser?.branch as any)?.name}
            userName={currentUser?.fullName || currentUser?.name}
          />
        </div>
        <div className="px-6 py-4 text-base print:block hidden border-t-2 border-b-2 mt-2 mb-4 bg-gray-50">
          <div className="space-y-2 text-right">
            <p className="text-base text-gray-700">
              <span className="font-semibold text-gray-800">التاريخ:</span> {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="font-semibold">الفرع:</label>
            <select className={inputStyle}>
              <option value="all">جميع الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name}
                </option>
              ))}
            </select>
            <label className="font-semibold">الرصيد حتى تاريخ:</label>
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideZeroBalance}
                onChange={(e) => setHideZeroBalance(e.target.checked)}
                className="w-4 h-4 text-brand-blue border-2 border-gray-300 rounded focus:ring-2 focus:ring-brand-blue"
              />
              <span className="font-semibold text-gray-700">إخفاء العملاء برصيد صفر</span>
            </label>
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود العميل
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-64">
                  اسم العميل
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رصيد أول المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  إجمالي دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد الحالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReportData.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-64">
                    {item.name}
                  </td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.opening)}`}>
                    {formatNumber(item.opening)}
                  </td>
                  <td className="px-6 py-4 text-green-600">
                    {formatNumber(item.debit)}
                  </td>
                  <td className="px-6 py-4 text-red-600">
                    {item.credit > 0 ? formatNumber(item.credit) : "0.00"}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getNegativeNumberClass(item.balance)}`}>
                    {formatNumber(item.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td colSpan={2} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(totals.opening)}`}>
                  {formatNumber(totals.opening)}
                </td>
                <td className="px-6 py-3 text-right text-white">
                  {formatNumber(totals.debit)}
                </td>
                <td className="px-6 py-3 text-right text-white">
                  {formatNumber(totals.credit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClass(totals.balance)}`}>
                  {formatNumber(totals.balance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerBalanceReport;

