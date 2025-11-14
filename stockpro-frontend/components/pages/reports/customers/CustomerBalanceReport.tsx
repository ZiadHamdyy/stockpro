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
  receiptVouchers,
  paymentVouchers,
  currentUser,
}) => {
  // API hooks
  const { data: apiCustomers = [], isLoading: customersLoading } =
    useGetCustomersQuery(undefined);
  const { data: apiSalesInvoices = [], isLoading: salesInvoicesLoading } =
    useGetSalesInvoicesQuery(undefined);
  const { data: apiSalesReturns = [], isLoading: salesReturnsLoading } =
    useGetSalesReturnsQuery(undefined);
  const { data: apiBranches = [], isLoading: branchesLoading } =
    useGetBranchesQuery(undefined);

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
      customerOrSupplier: invoice.customerOrSupplier
        ? {
            id: invoice.customerOrSupplier.id.toString(),
            name: invoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiSalesInvoices]);

  const salesReturns = useMemo(() => {
    return (apiSalesReturns as any[]).map((returnInvoice) => ({
      ...returnInvoice,
      // Transform nested customer data
      customerOrSupplier: returnInvoice.customerOrSupplier
        ? {
            id: returnInvoice.customerOrSupplier.id.toString(),
            name: returnInvoice.customerOrSupplier.name,
          }
        : null,
    }));
  }, [apiSalesReturns]);

  const branches = useMemo(() => {
    return (apiBranches as any[]).map((branch) => ({
      ...branch,
      // Add any necessary transformations here
    }));
  }, [apiBranches]);

  const isLoading =
    customersLoading ||
    salesInvoicesLoading ||
    salesReturnsLoading ||
    branchesLoading;
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [reportData, setReportData] = useState<any[]>([]);
  const [hideZeroBalance, setHideZeroBalance] = useState(false);

  const handleViewReport = useCallback(() => {
    const customerBalanceData = customers.map((customer) => {
      const customerIdStr = customer.id.toString();
      const customerId = customer.id;

      const sales = salesInvoices
        .filter(
          (inv) =>
            inv.customerOrSupplier?.id === customerIdStr && inv.date <= endDate,
        )
        .reduce((sum, inv) => sum + inv.totals.net, 0);

      const returns = salesReturns
        .filter(
          (inv) =>
            inv.customerOrSupplier?.id === customerIdStr && inv.date <= endDate,
        )
        .reduce((sum, inv) => sum + inv.totals.net, 0);

      const receipts = receiptVouchers
        .filter(
          (v) =>
            v.entity.type === "customer" &&
            v.entity.id == customerId &&
            v.date <= endDate,
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const payments = paymentVouchers // Refunds to customer are a debit
        .filter(
          (v) =>
            v.entity.type === "customer" &&
            v.entity.id == customerId &&
            v.date <= endDate,
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const opening = customer.openingBalance;
      // Split opening balance: positive goes to debit, negative goes to credit
      const openingDebit = opening > 0 ? opening : 0;
      const openingCredit = opening < 0 ? Math.abs(opening) : 0;
      const totalDebit = sales + payments + openingDebit;
      const totalCredit = returns + receipts + openingCredit;
      const balance = opening + (sales + payments) - (returns + receipts);

      return {
        id: customer.id,
        code: customer.code,
        name: customer.name,
        opening: opening,
        debit: totalDebit,
        credit: totalCredit,
        balance: balance,
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  اسم العميل
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
                <td colSpan={2} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right text-green-600">
                  {formatNumber(totals.debit)}
                </td>
                <td className="px-6 py-3 text-right text-red-600">
                  {formatNumber(totals.credit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClass(totals.balance)}`}>
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
