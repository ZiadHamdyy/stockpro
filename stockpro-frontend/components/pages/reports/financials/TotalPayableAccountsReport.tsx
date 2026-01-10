import React, { useState, useMemo } from "react";
import type { CompanyInfo, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import PermissionWrapper from '../../../common/PermissionWrapper';
import { formatNumber, getNegativeNumberClass, getNegativeNumberClassForTotal, exportToExcel } from "../../../../utils/formatting";
import { useGetPayableAccountsQuery } from "../../../store/slices/payableAccounts/payableAccountsApi";
import { useGetReceiptVouchersQuery } from "../../../store/slices/receiptVoucherApiSlice";
import { useGetPaymentVouchersQuery } from "../../../store/slices/paymentVoucherApiSlice";
import { getCurrentYearRange, formatDate } from "../dateUtils";
import { useAuth } from "../../../hook/Auth";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../../enums/permissions.enum";

interface TotalPayableAccountsReportProps {
  title: string;
  companyInfo: CompanyInfo;
  currentUser: User | null;
  receiptVouchers: Voucher[];
  paymentVouchers: Voucher[];
}

const TotalPayableAccountsReport: React.FC<TotalPayableAccountsReportProps> = ({
  title,
  companyInfo,
  currentUser,
  receiptVouchers: propReceiptVouchers,
  paymentVouchers: propPaymentVouchers,
}) => {
  const { isAuthed } = useAuth();
  
  // Only fetch if user is authenticated
  const skip = !isAuthed;

  // API hooks
  const { data: apiPayableAccounts = [], isLoading: payableAccountsLoading } =
    useGetPayableAccountsQuery(undefined);
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

  // Helper function to normalize dates to YYYY-MM-DD format
  const normalizeDate = useMemo(() => {
    return (date: any): string => {
      if (!date) return "";
      if (typeof date === "string") {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // If it's an ISO string, extract the date part
        return date.substring(0, 10);
      }
      if (date instanceof Date) {
        return date.toISOString().split("T")[0];
      }
      // Try to parse as Date if it's a string that looks like a date
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

  // Transform API data to match expected format
  const payableAccounts = useMemo(() => {
    return (apiPayableAccounts as any[]).map((account) => ({
      ...account,
      // Add any necessary transformations here
    }));
  }, [apiPayableAccounts]);

  // Transform vouchers to match expected structure
  const receiptVouchers = useMemo(() => {
    return rawReceiptVouchers.map((voucher: any) => {
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || voucher.payableAccountId || "",
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
      // Transform to match expected structure
      // If voucher already has entity structure (from props), use it
      // Otherwise, build it from API structure
      const entity = voucher.entity || {
        type: voucher.entityType,
        id: voucher.customerId || voucher.supplierId || voucher.currentAccountId || voucher.payableAccountId || "",
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

  const isLoading = payableAccountsLoading || receiptVouchersLoading || paymentVouchersLoading;
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Calculate account balances from vouchers
  const accountsSummary = useMemo(() => {
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    return payableAccounts.map((account) => {
      const accountId = account.id;
      const accountIdStr = accountId.toString();

      // Calculate transactions before start date for opening balance
      const receiptsBefore = receiptVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "payable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      const paymentsBefore = paymentVouchers
        .filter(
          (v) => {
            const vDate = normalizeDate(v.date);
            const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
            return (
              v.entity?.type === "payable_account" &&
              (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
              vDate < normalizedStartDate
            );
          },
        )
        .reduce((sum, v) => sum + v.amount, 0);

      // Calculate transactions within date range
      const relevantReceipts = receiptVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const relevantPayments = paymentVouchers.filter(
        (v) => {
          const vDate = normalizeDate(v.date);
          const voucherAccountId = v.entity?.id?.toString() || v.entity?.id;
          return (
            v.entity?.type === "payable_account" &&
            (voucherAccountId === accountIdStr || voucherAccountId == accountId) &&
            vDate >= normalizedStartDate &&
            vDate <= normalizedEndDate
          );
        },
      );

      const receipts = relevantReceipts.reduce((sum, v) => sum + v.amount, 0);
      const payments = relevantPayments.reduce((sum, v) => sum + v.amount, 0);

      // Opening balance = base opening balance + payments before start date - receipts before start date
      const opening = (account.openingBalance || 0) + paymentsBefore - receiptsBefore;
      const balance = opening + payments - receipts;

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        opening,
        debit: payments,
        credit: receipts,
        balance,
      };
    });
  }, [payableAccounts, receiptVouchers, paymentVouchers, startDate, endDate, normalizeDate]);

  const totals = accountsSummary.reduce(
    (acc, item) => {
      acc.opening += item.opening;
      acc.debit += item.debit; // Total count of payment vouchers
      acc.credit += item.credit; // Total count of receipt vouchers
      acc.balance += item.balance;
      return acc;
    },
    { opening: 0, debit: 0, credit: 0, balance: 0 },
  );

  const handleExcelExport = () => {
    const dataToExport = [
      ...accountsSummary.map((item) => ({
        "كود الحساب": item.code,
        "اسم الحساب": item.name,
        "رصيد أول المدة": formatNumber(item.opening),
        "إجمالي مدين": formatNumber(item.debit),
        "إجمالي دائن": formatNumber(item.credit),
        "الرصيد الحالي": formatNumber(item.balance),
      })),
      {
        "كود الحساب": "الإجمالي",
        "اسم الحساب": "",
        "رصيد أول المدة": formatNumber(totals.opening),
        "إجمالي مدين": formatNumber(totals.debit),
        "إجمالي دائن": formatNumber(totals.credit),
        "الرصيد الحالي": formatNumber(totals.balance),
      },
    ];
    exportToExcel(dataToExport, "تقرير_إجمالي_الحسابات_الدائنة");
  };

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

  const inputStyle =
    "p-2 border-2 border-brand-blue rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue bg-brand-blue-bg";

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
                <span className="font-semibold text-gray-800">الفترة من:</span> {startDate} 
                <span className="font-semibold text-gray-800 mr-2">إلى:</span> {endDate}
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-base text-gray-700">
                <span className="font-semibold text-gray-800">التاريخ:</span> {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
          <div className="flex items-center gap-4 flex-wrap no-print">
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
            <button className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              <span>عرض التقرير</span>
            </button>
          </div>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.TOTAL_PAYABLE_ACCOUNTS_REPORT,
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
                onClick={handleExcelExport}
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
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-28">
                  كود الحساب
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase w-64">
                  اسم الحساب
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رصيد أول المدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-green-200 uppercase">
                  إجمالي مدين
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-red-200 uppercase">
                  إجمالي دائن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  الرصيد الحالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountsSummary.map((item) => (
                <tr key={item.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 w-28">{item.code}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark w-64">
                    {item.name}
                  </td>
                  <td className={`px-6 py-4 ${getNegativeNumberClass(item.opening)}`}>{formatNumber(item.opening)}</td>
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
            <tfoot className="bg-brand-blue text-white">
              <tr className="font-bold">
                <td colSpan={2} className="px-6 py-3 text-right text-white">
                  الإجمالي
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totals.opening)}`}>
                  {formatNumber(totals.opening)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totals.debit) || "text-green-200"}`}>
                  {formatNumber(totals.debit)}
                </td>
                <td className={`px-6 py-3 text-right ${getNegativeNumberClassForTotal(totals.credit) || "text-red-200"}`}>
                  {formatNumber(totals.credit)}
                </td>
                <td className={`px-6 py-3 text-right text-white ${getNegativeNumberClassForTotal(totals.balance)}`}>
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

export default TotalPayableAccountsReport;

