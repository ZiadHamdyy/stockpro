import React, { useState } from "react";
import type { CompanyInfo, User, Voucher } from "../../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../../icons";
import ReportHeader from "../ReportHeader";
import { formatNumber } from "../../../../utils/formatting";

interface DailyPaymentsReportProps {
  title: string;
  companyInfo: CompanyInfo;
  paymentVouchers: Voucher[];
  currentUser: User | null;
}

const DailyPaymentsReport: React.FC<DailyPaymentsReportProps> = ({
  title,
  companyInfo,
  paymentVouchers,
  currentUser,
}) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(
    new Date().toISOString().substring(0, 10),
  );

  const totals = paymentVouchers.reduce(
    (acc, voucher) => {
      acc.amount += voucher.amount;
      return acc;
    },
    { amount: 0 },
  );

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="printable-area">
        <ReportHeader title={title} companyInfo={companyInfo} />
        <div className="px-6 py-2 text-sm print:block hidden border-t-2 mt-2">
          <p>
            <strong>فرع الطباعة:</strong> {currentUser?.branch}
          </p>
          <p>
            <strong>المستخدم:</strong> {currentUser?.fullName}
          </p>
        </div>

        <div className="flex justify-between items-center my-4 bg-gray-50 p-3 rounded-md border-2 border-gray-200 no-print">
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
            <button className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center gap-2">
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
                  م
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  رقم السند
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  صرفنا لـ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase">
                  البيان
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentVouchers.map((voucher, index) => (
                <tr key={voucher.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4">{index + 1}</td>
                  <td className="px-6 py-4">{voucher.date}</td>
                  <td className="px-6 py-4 font-medium text-brand-dark">
                    {voucher.id}
                  </td>
                  <td className="px-6 py-4">{voucher.entity.name}</td>
                  <td className="px-6 py-4">
                    {voucher.paymentMethod === "safe" ? "نقداً" : "بنك"}
                  </td>
                  <td className="px-6 py-4 font-bold">
                    {formatNumber(voucher.amount)}
                  </td>
                  <td className="px-6 py-4">{voucher.description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr className="font-bold text-brand-dark">
                <td colSpan={5} className="px-6 py-3 text-right">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right">
                  {formatNumber(totals.amount)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyPaymentsReport;
