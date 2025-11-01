import React, { useState, useMemo } from "react";
import type { CompanyInfo, Invoice } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import InvoiceHeader from "../../common/InvoiceHeader";
import { useGetPurchaseInvoicesQuery } from "../../store/slices/purchaseInvoice/purchaseInvoiceApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";

interface DailyPurchasesProps {
  title: string;
}

const DailyPurchases: React.FC<DailyPurchasesProps> = ({ title }) => {
  // Redux hooks
  const { data: purchaseInvoices = [] } = useGetPurchaseInvoicesQuery();
  const { data: company } = useGetCompanyQuery();
  const { data: branches = [] } = useGetBranchesQuery();

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
  const [startDate, setStartDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const filteredPurchases = useMemo(() => {
    return purchaseInvoices.filter((purchase) => {
      const purchaseDate = purchase.date.substring(0, 10); // Extract just the date part
      const matchesDateRange = purchaseDate >= startDate && purchaseDate <= endDate;
      const matchesBranch = !selectedBranchId || purchase.branchId === selectedBranchId;
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
      return matchesDateRange && matchesBranch && matchesSearch;
    });
  }, [purchaseInvoices, startDate, endDate, searchTerm, selectedBranchId]);

  const totals = filteredPurchases.reduce(
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
    const dataToExport = filteredPurchases.map((p) => ({
      التاريخ: p.date,
      "رقم الفاتورة": p.code,
      المورد: p.supplier?.name || "-",
      الفرع: p.branch?.name || "-",
      المبلغ: p.subtotal.toFixed(2),
      الضريبة: p.tax.toFixed(2),
      الخصم: p.discount.toFixed(2),
      "صافي المبلغ": p.net.toFixed(2),
    }));
    dataToExport.push({
      التاريخ: "الإجمالي",
      "رقم الفاتورة": "",
      المورد: "",
      الفرع: "",
      المبلغ: totals.subtotal.toFixed(2),
      الضريبة: totals.tax.toFixed(2),
      الخصم: totals.discount.toFixed(2),
      "صافي المبلغ": totals.net.toFixed(2),
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
        "المورد",
        "رقم الفاتورة",
        "التاريخ",
        "م",
      ],
    ];
    const body = filteredPurchases.map((p, i) => [
      p.net.toFixed(2),
      p.discount.toFixed(2),
      p.tax.toFixed(2),
      p.subtotal.toFixed(2),
      p.branch?.name || "-",
      p.supplier?.name || "-",
      p.code,
      p.date ? new Date(p.date).toLocaleDateString() : "",
      (i + 1).toString(),
    ]);
    const footer = [
      [
        totals.net.toFixed(2),
        totals.discount.toFixed(2),
        totals.tax.toFixed(2),
        totals.subtotal.toFixed(2),
        "",
        "",
        "",
        "",
        "الإجمالي",
      ],
    ];

    exportToPdf(title, head, body, title, companyInfo, footer);
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
      <div className="border-2 border-brand-green rounded-lg mb-4">
        <InvoiceHeader />
      </div>

      <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>

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
                رقم الفاتورة
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
            {filteredPurchases.map((purchase, index) => (
              <tr key={purchase.id} className="hover:bg-brand-green-bg">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(purchase.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                  {purchase.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.supplier?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.branch?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.subtotal.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.tax.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {purchase.discount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  {purchase.net.toFixed(2)}
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
                {totals.subtotal.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right">{totals.tax.toFixed(2)}</td>
              <td className="px-6 py-3 text-right">
                {totals.discount.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right">{totals.net.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DailyPurchases;
