import React, { useState, useMemo } from "react";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon, XIcon } from "../icons";
import ReportHeader from "../pages/reports/ReportHeader";
import type { CompanyInfo } from "../../types";
import {
  formatNumber,
  exportToExcel,
  exportToPdf,
} from "../../utils/formatting";

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: { Header: string; accessor: string }[];
  data: any[];
  onSelectRow: (row: any) => void;
  companyInfo?: CompanyInfo;
  colorTheme?: "blue" | "green" | "amber";
}

const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  title,
  columns,
  data,
  onSelectRow,
  companyInfo,
  colorTheme = "blue",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Determine color classes based on theme
  const headerBgClass =
    colorTheme === "green"
      ? "bg-brand-green"
      : colorTheme === "amber"
      ? "bg-amber-500"
      : "bg-brand-blue";
  const hoverBgClass =
    colorTheme === "green"
      ? "hover:bg-brand-green-bg"
      : colorTheme === "amber"
      ? "hover:bg-yellow-100"
      : "hover:bg-brand-blue-bg";
  const inputBorderClass =
    colorTheme === "green"
      ? "border-brand-green"
      : colorTheme === "amber"
      ? "border-amber-500"
      : "border-brand-blue";
  const inputBgClass =
    colorTheme === "green"
      ? "bg-brand-green-bg"
      : colorTheme === "amber"
      ? "bg-yellow-100"
      : "bg-brand-blue-bg";
  const inputRingClass =
    colorTheme === "green"
      ? "focus:ring-brand-green"
      : colorTheme === "amber"
      ? "focus:ring-amber-500"
      : "focus:ring-brand-blue";

  const filteredData = useMemo(
    () =>
      data.filter((row) =>
        columns.some(
          (col) =>
            row[col.accessor] &&
            row[col.accessor]
              .toString()
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        ),
      ),
    [data, columns, searchTerm],
  );

  const totalableColumns = useMemo(
    () =>
      columns.filter((c) => c.accessor === "balance").map((c) => c.accessor),
    [columns],
  );

  const totals = useMemo(
    () =>
      totalableColumns.reduce(
        (acc, accessor) => {
          acc[accessor] = filteredData.reduce(
            (sum, row) => sum + (Number(row[accessor]) || 0),
            0,
          );
          return acc;
        },
        {} as Record<string, number>,
      ),
    [filteredData, totalableColumns],
  );

  const firstTotalColIndex = useMemo(
    () => columns.findIndex((c) => totalableColumns.includes(c.accessor)),
    [columns, totalableColumns],
  );

  const handleExcelExport = () => {
    const dataToExport = filteredData.map((row) => {
      const newRow: { [key: string]: any } = {};
      columns.forEach((col) => {
        newRow[col.Header] = row[col.accessor];
      });
      return newRow;
    });
    exportToExcel(dataToExport, title);
  };

  const handlePdfExport = () => {
    const head = [columns.map((c) => c.Header).reverse()];
    const body = filteredData.map((row) =>
      columns.map((col) => row[col.accessor]).reverse(),
    );

    exportToPdf(title, head, body, title, companyInfo, undefined, colorTheme);
  };

  if (!isOpen) {
    return null;
  }

  const handleSelect = (row: any) => {
    onSelectRow(row);
    onClose();
  };

  // Get print header color based on theme
  const printHeaderColor =
    colorTheme === "green"
      ? "#16A34A" // green-600 (brand-green equivalent)
      : colorTheme === "amber"
      ? "#F59E0B" // amber-500
      : "#1E40AF"; // blue-700 (default)

  const handlePrint = () => {
    const tableContent = document.getElementById(
      "modal-printable-area",
    )?.innerHTML;
    if (!tableContent) return;

    const printWindow = window.open("", "", "height=800,width=800");
    printWindow?.document.write(
      "<html><head><title>طباعة - " + title + "</title>",
    );
    printWindow?.document.write(
      `<style>body { font-family: Cairo, sans-serif; direction: rtl; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: right; } thead { background-color: ${printHeaderColor}; color: white; } </style>`,
    );
    if (companyInfo) {
      printWindow?.document.write(
        '<script src="https://cdn.tailwindcss.com"></script>',
      );
    }
    printWindow?.document.write("</head><body>");
    printWindow?.document.write(tableContent);
    printWindow?.document.write("</body></html>");
    printWindow?.document.close();
    printWindow?.print();
  };

  const inputStyle = `w-full pr-10 pl-4 py-3 ${inputBgClass} border-2 ${inputBorderClass} rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 ${inputRingClass}`;

  return (
    <div
      className="fixed inset-[-100px] bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-brand-dark">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExcelExport}
              title="تصدير Excel"
              className="text-gray-500 hover:text-brand-dark p-2 rounded-full hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handlePdfExport}
              title="تصدير PDF"
              className="text-gray-500 hover:text-brand-dark p-2 rounded-full hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handlePrint}
              className="text-gray-500 hover:text-brand-dark p-2 rounded-full hover:bg-gray-100"
            >
              <PrintIcon />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-brand-dark p-1 rounded-full hover:bg-gray-100"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-auto px-4 pb-4">
          <div id="modal-printable-area">
            {companyInfo && (
              <ReportHeader title={title} companyInfo={companyInfo} />
            )}
            <div className={companyInfo ? "mt-4" : ""}>
              <table className="min-w-full border-collapse">
                <thead className={headerBgClass}>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.accessor}
                        className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider border border-gray-300"
                      >
                        {col.Header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredData.map((row, i) => (
                    <tr
                      key={i}
                      onClick={() => handleSelect(row)}
                      className={`cursor-pointer ${hoverBgClass}`}
                    >
                      {columns.map((col) => {
                        const value = row[col.accessor];
                        const isBalanceColumn = col.accessor === "balance";

                        let displayValue = value;
                        if (isBalanceColumn && typeof value === "number") {
                          displayValue = formatNumber(value);
                        }

                        const isNegativeBalance =
                          isBalanceColumn &&
                          typeof value === "number" &&
                          value < 0;

                        return (
                          <td
                            key={col.accessor}
                            className={`px-6 py-4 whitespace-nowrap text-sm text-brand-text border border-gray-300 ${isNegativeBalance ? "text-red-600" : ""} ${isBalanceColumn ? "font-bold" : ""}`}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                {totalableColumns.length > 0 && (
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td
                        colSpan={firstTotalColIndex}
                        className="px-6 py-3 text-right border border-gray-300"
                      >
                        الإجمالي
                      </td>
                      {columns.slice(firstTotalColIndex).map((col) => {
                        if (totalableColumns.includes(col.accessor)) {
                          const total = totals[col.accessor];
                          const isNegativeTotal = total < 0;
                          return (
                            <td
                              key={`total-${col.accessor}`}
                              className={`px-6 py-3 text-right border border-gray-300 ${isNegativeTotal ? "text-red-600" : ""}`}
                            >
                              {formatNumber(total)}
                            </td>
                          );
                        } else {
                          return (
                            <td
                              key={`total-empty-${col.accessor}`}
                              className="border border-gray-300"
                            ></td>
                          );
                        }
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTableModal;
