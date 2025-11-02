import React, { useState, useMemo } from "react";
import type { CompanyInfo } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { exportToExcel, exportToPdf, formatMoney } from "../../../utils/formatting";
import InvoiceHeader from "../../common/InvoiceHeader";
import { useGetSalesInvoicesQuery } from "../../store/slices/salesInvoice/salesInvoiceApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/slices/auth/auth";

interface DailySalesProps {
  title: string;
}

const DailySales: React.FC<DailySalesProps> = ({ title }) => {
  // Redux hooks
  const { data: salesInvoices = [] } = useGetSalesInvoicesQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const currentUser = useAppSelector(selectCurrentUser);

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
    isVatEnabled: true,
  };
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10),
  ); // Current day
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  ); // Current day
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const filteredSales = useMemo(() => {
    return salesInvoices.filter((sale) => {
      const saleDate = sale.date.substring(0, 10); // Extract just the date part
      const matchesDateRange = saleDate >= startDate && saleDate <= endDate;
      const matchesBranch = !selectedBranchId || sale.branchId === selectedBranchId;
      const matchesSearch =
        !searchTerm ||
        sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customer &&
          sale.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (sale.branch &&
          sale.branch.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      return matchesDateRange && matchesBranch && matchesSearch;
    });
  }, [salesInvoices, startDate, endDate, searchTerm, selectedBranchId]);

  const totals = filteredSales.reduce(
    (acc, sale) => {
      acc.subtotal += sale.subtotal;
      acc.tax += sale.tax;
      acc.discount += sale.discount;
      acc.net += sale.net;
      return acc;
    },
    { subtotal: 0, tax: 0, discount: 0, net: 0 },
  );

  const handleExcelExport = () => {
    const dataToExport = filteredSales.map((s) => ({
      التاريخ: s.date,
      "رقم الفاتورة": s.code,
      العميل: s.customer?.name || "عميل نقدي",
      الفرع: s.branch?.name || "-",
      المبلغ: formatMoney(s.subtotal),
      الضريبة: formatMoney(s.tax),
      الخصم: formatMoney(s.discount),
      "صافي المبلغ": formatMoney(s.net),
    }));
    dataToExport.push({
      التاريخ: "الإجمالي",
      "رقم الفاتورة": "",
      العميل: "",
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
        "العميل",
        "رقم الفاتورة",
        "التاريخ",
        "م",
      ],
    ];
    const body = filteredSales.map((s, i) => [
      formatMoney(s.net),
      formatMoney(s.discount),
      formatMoney(s.tax),
      formatMoney(s.subtotal),
      s.branch?.name || "-",
      s.customer?.name || "عميل نقدي",
      s.code,
      s.date ? new Date(s.date).toLocaleDateString() : "",
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
    "p-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

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
      <div className="border-2 border-brand-blue rounded-lg mb-4">
        <InvoiceHeader 
          branchName={selectedBranchId ? branches.find(b => b.id === selectedBranchId)?.name : undefined}
          userName={currentUser?.name}
        />
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
          <button
            onClick={handleExcelExport}
            title="تصدير Excel"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <ExcelIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handlePdfExport}
            title="تصدير PDF"
            className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
          >
            <PdfIcon className="w-6 h-6" />
          </button>
          <button
            title="طباعة"
            onClick={() => window.print()}
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
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                م
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                العميل
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
            {filteredSales.map((sale, index) => (
              <tr key={sale.id} className="hover:bg-brand-blue-bg">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                  {sale.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.customer?.name || "عميل نقدي"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.branch?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(sale.subtotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(sale.tax)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatMoney(sale.discount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  {formatMoney(sale.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-bold text-brand-dark">
              <td colSpan={5} className="px-6 py-3 text-right">
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

export default DailySales;
