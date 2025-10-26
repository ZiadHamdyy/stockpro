import React, { useState, useMemo } from "react";
import type { CompanyInfo } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import InvoiceHeader from "../../common/InvoiceHeader";
import { useGetSalesReturnsQuery } from "../../store/slices/salesReturn/salesReturnApiSlice";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";

interface DailySalesReturnsProps {
  title: string;
}

const DailySalesReturns: React.FC<DailySalesReturnsProps> = ({ title }) => {
  // Redux hooks
  const { data: salesReturns = [] } = useGetSalesReturnsQuery();
  const { data: company } = useGetCompanyQuery();

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
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReturns = useMemo(() => {
    return salesReturns.filter((sale) => {
      const saleDate = sale.date.substring(0, 10); // Extract just the date part
      return (
        saleDate >= startDate &&
        saleDate <= endDate &&
        (sale.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sale.customer &&
            sale.customer.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())))
      );
    });
  }, [salesReturns, startDate, endDate, searchTerm]);

  const totals = filteredReturns.reduce(
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
    const dataToExport = filteredReturns.map((s) => ({
      التاريخ: s.date,
      "رقم المرتجع": s.code,
      العميل: s.customer?.name || "عميل نقدي",
      المبلغ: s.subtotal.toFixed(2),
      الضريبة: s.tax.toFixed(2),
      الخصم: s.discount.toFixed(2),
      "صافي المبلغ": s.net.toFixed(2),
    }));
    dataToExport.push({
      التاريخ: "الإجمالي",
      "رقم المرتجع": "",
      العميل: "",
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
        "العميل",
        "رقم المرتجع",
        "التاريخ",
        "م",
      ],
    ];
    const body = filteredReturns.map((s, i) => [
      s.net.toFixed(2),
      s.discount.toFixed(2),
      s.tax.toFixed(2),
      s.subtotal.toFixed(2),
      s.customer?.name || "عميل نقدي",
      s.code,
      s.date,
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
        "الإجمالي",
      ],
    ];

    exportToPdf(title, head, body, title, companyInfo, footer);
  };

  const inputStyle =
    "p-2 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="border-2 border-brand-blue rounded-lg mb-4">
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
                رقم المرتجع
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                العميل
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
            {filteredReturns.map((sale, index) => (
              <tr key={sale.id} className="hover:bg-brand-blue-bg">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">{sale.date}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                  {sale.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.customer?.name || "عميل نقدي"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.subtotal.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.tax.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {sale.discount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  {sale.net.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-bold text-brand-dark">
              <td colSpan={4} className="px-6 py-3 text-right">
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

export default DailySalesReturns;
