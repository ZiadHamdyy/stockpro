import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyInfo, Invoice } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { exportToExcel, exportToPdf, formatMoney } from "../../../utils/formatting";
import DocumentHeader from "../../common/DocumentHeader";
import { useGetPurchaseReturnsQuery } from "../../store/slices/purchaseReturn/purchaseReturnApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/slices/auth/auth";
import { getCurrentYearRange } from "../reports/dateUtils";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useUserPermissions } from "../../hook/usePermissions";

interface DailyPurchaseReturnsProps {
  title: string;
}

const DailyPurchaseReturns: React.FC<DailyPurchaseReturnsProps> = ({
  title,
}) => {
  const navigate = useNavigate();
  // Redux hooks
  const { data: allPurchaseReturns = [] } = useGetPurchaseReturnsQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const currentUser = useAppSelector(selectCurrentUser);
  const { hasPermission } = useUserPermissions();

  // Helper function to get user's branch ID
  const getUserBranchId = (user: any): string | null => {
    if (!user) return null;
    if (user.branchId) return user.branchId;
    const branch = user?.branch;
    if (typeof branch === "string") return branch;
    if (branch && typeof branch === "object") return branch.id || null;
    return null;
  };

  // Get current user's branch ID
  const userBranchId = getUserBranchId(currentUser);
  const canSearchAllBranches = useMemo(
    () =>
      hasPermission(
        buildPermission(Resources.DAILY_PURCHASE_RETURNS, Actions.SEARCH),
      ),
    [hasPermission],
  );
  
  // Filter returns: show only current branch if user doesn't have SEARCH permission
  const purchaseReturns = useMemo(() => {
    return allPurchaseReturns.filter((returnRecord: any) => {
      // Filter by current branch if user doesn't have SEARCH permission
      const returnBranchId = returnRecord.branch?.id || returnRecord.branchId;
      if (!canSearchAllBranches && userBranchId && returnBranchId !== userBranchId) {
        return false;
      }
      
      return true;
    });
  }, [allPurchaseReturns, canSearchAllBranches, userBranchId]);

  const companyInfo: CompanyInfo = company || {
    name: "",
    activity: "",
    address: "",
    phone: "",
    taxNumber: "",
    commercialReg: "",
    currency: "SAR",
    logo: null,
    capital: 0,
    vatRate: 15,
    isVatEnabled: false,
  };
  const { start: defaultStartDate, end: defaultEndDate } = getCurrentYearRange();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [invoiceType, setInvoiceType] = useState<string>("");

  const getInvoiceTypeLabel = (paymentMethod?: string | null) => {
    if (!paymentMethod) return "-";
    switch (paymentMethod) {
      case "CASH":
        return "نقدي";
      case "CREDIT":
        return "آجل";
      default:
        return "-";
    }
  };

  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter((purchase) => {
      const purchaseDate = purchase.date.substring(0, 10); // Extract just the date part
      const matchesDateRange = purchaseDate >= startDate && purchaseDate <= endDate;
      const matchesBranch = !selectedBranchId || purchase.branchId === selectedBranchId;
      const matchesInvoiceType =
        !invoiceType || purchase.paymentMethod === invoiceType;
      const matchesSearch =
        !searchTerm ||
        purchase.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.supplier &&
          purchase.supplier.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (purchase.branch &&
          purchase.branch.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      return (
        matchesDateRange &&
        matchesBranch &&
        matchesInvoiceType &&
        matchesSearch
      );
    });
  }, [purchaseReturns, startDate, endDate, searchTerm, selectedBranchId, invoiceType]);

  const totals = filteredReturns.reduce(
    (acc, purchase) => {
      acc.subtotal += purchase.subtotal;
      acc.tax += purchase.tax;
      acc.discount += purchase.discount;
      acc.net += purchase.net;
      return acc;
    },
    { subtotal: 0, tax: 0, discount: 0, net: 0 },
  );

  const handleExcelExport = () => {
    const dataToExport = filteredReturns.map((p) => ({
      التاريخ: p.date,
      "رقم المرتجع": p.code,
      "نوع الفاتورة": getInvoiceTypeLabel(p.paymentMethod),
      المورد: p.supplier?.name || "-",
      الفرع: p.branch?.name || "-",
      المبلغ: formatMoney(p.subtotal),
      الضريبة: formatMoney(p.tax),
      الخصم: formatMoney(p.discount),
      "صافي المبلغ": formatMoney(p.net),
    }));
    dataToExport.push({
      التاريخ: "الإجمالي",
      "رقم المرتجع": "",
      "نوع الفاتورة": "",
      المورد: "",
      الفرع: "",
      المبلغ: formatMoney(totals.subtotal),
      الضريبة: formatMoney(totals.tax),
      الخصم: formatMoney(totals.discount),
      "صافي المبلغ": formatMoney(totals.net),
    });
    exportToExcel(dataToExport, title);
  };

  const handlePdfExport = () => {
    const head = [
      [
        "صافي المبلغ",
        "الخصم",
        "الضريبة",
        "المبلغ",
        "الفرع",
        "نوع الفاتورة",
        "المورد",
        "رقم المرتجع",
        "التاريخ",
        "م",
      ],
    ];
    const body = filteredReturns.map((p, i) => [
      formatMoney(p.net),
      formatMoney(p.discount),
      formatMoney(p.tax),
      formatMoney(p.subtotal),
      p.branch?.name || "-",
      getInvoiceTypeLabel(p.paymentMethod),
      p.supplier?.name || "-",
      p.code,
      p.date ? new Date(p.date).toLocaleDateString() : "",
      (i + 1).toString(),
    ]);
    const footer = [
      [
        formatMoney(totals.net),
        formatMoney(totals.discount),
        formatMoney(totals.tax),
        formatMoney(totals.subtotal),
        "",
        "",
      "",
        "",
        "",
        "الإجمالي",
      ],
    ];

    const selectedBranchName = selectedBranchId 
      ? branches.find(b => b.id === selectedBranchId)?.name || "جميع الفروع"
      : "جميع الفروع";
    const dateRangeText = `من: ${startDate} - إلى: ${endDate} | الفرع: ${selectedBranchName}`;
    const pdfTitle = `${title} - ${dateRangeText}`;

    exportToPdf(pdfTitle, head, body, title, companyInfo, footer);
  };

  const inputStyle =
    "p-2 bg-brand-green-bg border-2 border-brand-green rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green";

  return (
    <div className="bg-white p-6 rounded-lg shadow print-scale-sm">
      <style>{`@media print {
        .no-print { display: none !important; }
        .print-scale-sm { font-size: 12px; }
        .print-scale-sm h1 { font-size: 18px; margin-bottom: 8px; }
        .print-scale-sm .p-6 { padding: 12px; }
        .print-scale-sm .px-6 { padding-left: 12px; padding-right: 12px; }
        .print-scale-sm .py-4 { padding-top: 8px; padding-bottom: 8px; }
        .print-scale-sm .py-3 { padding-top: 6px; padding-bottom: 6px; }
        .print-scale-sm table th, .print-scale-sm table td { padding: 4px 6px !important; }
      }`}</style>
      <div className="border-2 border-brand-green rounded-lg mb-4 bg-white">
        <DocumentHeader companyInfo={companyInfo} />
      </div>

      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

      <div className="mb-4 p-3 bg-gray-50 rounded-md border-2 border-gray-300 hidden print:block">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="font-semibold">من:</label>
            <input
              type="text"
              readOnly
              value={startDate}
              className="p-2 bg-white border border-gray-300 rounded-md text-black w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold">إلى:</label>
            <input
              type="text"
              readOnly
              value={endDate}
              className="p-2 bg-white border border-gray-300 rounded-md text-black w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold">الفرع:</label>
            <input
              type="text"
              readOnly
              value={selectedBranchId ? branches.find(b => b.id === selectedBranchId)?.name || "جميع الفروع" : "جميع الفروع"}
              className="p-2 bg-white border border-gray-300 rounded-md text-black w-48"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 no-print bg-gray-50 p-3 rounded-md border-2">
        <div className="flex items-center gap-4 flex-wrap">
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
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث..."
              className={inputStyle + " pr-10 w-48"}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label className="font-semibold">نوع الفاتورة:</label>
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className={inputStyle + " w-40"}
          >
            <option value="">جميع الأنواع</option>
            <option value="CASH">نقدي</option>
            <option value="CREDIT">آجل</option>
          </select>
          <label className="font-semibold">الفرع:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className={inputStyle + " w-48"}
          >
            <option value="">جميع الفروع</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.DAILY_PURCHASE_RETURNS,
              Actions.PRINT,
            )}
            fallback={
              <button
                disabled
                title="تصدير Excel"
                className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
              >
                <ExcelIcon className="w-6 h-6" />
              </button>
            }
          >
            <button
              onClick={handleExcelExport}
              title="تصدير Excel"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.DAILY_PURCHASE_RETURNS,
              Actions.PRINT,
            )}
            fallback={
              <button
                disabled
                title="تصدير PDF"
                className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
              >
                <PdfIcon className="w-6 h-6" />
              </button>
            }
          >
            <button
              onClick={handlePdfExport}
              title="تصدير PDF"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
          <PermissionWrapper
            requiredPermission={buildPermission(
              Resources.DAILY_PURCHASE_RETURNS,
              Actions.PRINT,
            )}
            fallback={
              <button
                disabled
                title="طباعة"
                className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
              >
                <PrintIcon className="w-6 h-6" />
              </button>
            }
          >
            <button
              title="طباعة"
              onClick={() => window.print()}
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </PermissionWrapper>
        </div>
      </div>

      <div className="overflow-x-auto border-2 border-brand-green rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-brand-green">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                م
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                رقم المرتجع
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                نوع الفاتورة
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                المورد
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                الفرع
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                المبلغ
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                الضريبة
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                الخصم
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                صافي المبلغ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReturns.map((purchase, index) => (
              <tr key={purchase.id} className="hover:bg-brand-green-bg">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(purchase.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => navigate(`/purchases/return?returnId=${purchase.id}`)}
                    className="text-brand-blue hover:underline font-semibold no-print cursor-pointer"
                  >
                    {purchase.code}
                  </button>
                  <span className="print:inline hidden">{purchase.code}</span>
                </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getInvoiceTypeLabel(purchase.paymentMethod)}
              </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.supplier?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.branch?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(purchase.subtotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(purchase.tax)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(purchase.discount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  {formatMoney(purchase.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-bold text-brand-dark">
              <td colSpan={6} className="px-6 py-3 text-right">
                الإجمالي
              </td>
              <td className="px-6 py-3 text-right">
                {formatMoney(totals.subtotal)}
              </td>
              <td className="px-6 py-3 text-right">{formatMoney(totals.tax)}</td>
              <td className="px-6 py-3 text-right">
                {formatMoney(totals.discount)}
              </td>
              <td className="px-6 py-3 text-right">{formatMoney(totals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DailyPurchaseReturns;
