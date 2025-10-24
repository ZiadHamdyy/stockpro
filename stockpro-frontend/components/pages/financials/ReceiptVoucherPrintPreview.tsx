import React from "react";
import { tafqeet } from "../../../utils/tafqeet";
import { PrintIcon, XIcon } from "../../icons";
import type { CompanyInfo } from "../../../types";
import { formatNumber } from "../../../utils/formatting";

interface ReceiptVoucherPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: {
    companyInfo: CompanyInfo;
    number: string;
    date: string;
    amount: number;
    receivedFrom: string;
    description: string;
    userName: string;
    branchName: string;
  };
}

const ReceiptVoucherPrintPreview: React.FC<ReceiptVoucherPrintPreviewProps> = ({
  isOpen,
  onClose,
  voucherData,
}) => {
  if (!isOpen) return null;

  const {
    companyInfo,
    number,
    date,
    amount,
    receivedFrom,
    description,
    userName,
    branchName,
  } = voucherData;

  const handlePrint = () => {
    const printContents =
      document.getElementById("printable-voucher")?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow?.document.write("<html><head><title>طباعة سند قبض</title>");
      printWindow?.document.write(
        '<script src="https://cdn.tailwindcss.com"></script>',
      );
      printWindow?.document.write(
        '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
      );
      printWindow?.document.write(
        '<style>body { font-family: "Cairo", sans-serif; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } @page { size: A5 landscape; margin: 0.5cm; } </style>',
      );
      printWindow?.document.write('</head><body dir="rtl">');
      printWindow?.document.write(printContents);
      printWindow?.document.write("</body></html>");
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
      }, 250);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center print:hidden bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-brand-dark">
            معاينة طباعة سند القبض
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold flex items-center"
            >
              <PrintIcon className="ml-2 w-5 h-5" /> طباعة
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-brand-dark p-2 rounded-full hover:bg-gray-200"
            >
              <XIcon />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div
            id="printable-voucher"
            className="p-6 bg-white"
            style={{ width: "210mm", height: "148mm" }}
          >
            <div className="border-2 border-brand-blue h-full p-4 flex flex-col justify-between rounded-lg">
              <header className="flex justify-between items-center pb-2 border-b-2 border-brand-blue">
                <div className="flex items-center gap-4">
                  {companyInfo.logo && (
                    <img
                      src={companyInfo.logo}
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-brand-dark">
                      {companyInfo.name}
                    </h2>
                    <p className="text-xs text-gray-600">
                      {companyInfo.address}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-brand-blue">
                    سند قبض
                  </h1>
                  <p className="font-semibold">Receipt Voucher</p>
                </div>
                <div className="text-left text-sm">
                  <p>
                    <span className="font-semibold">الرقم:</span> {number}
                  </p>
                  <p>
                    <span className="font-semibold">التاريخ:</span> {date}
                  </p>
                  <p>
                    <span className="font-semibold">الفرع:</span> {branchName}
                  </p>
                </div>
              </header>

              <main className="flex-grow my-4 space-y-3 text-base">
                <div className="flex items-center">
                  <label className="font-bold w-48">
                    استلمنا من السيد/السادة:
                  </label>
                  <span className="border-b-2 border-dotted border-gray-400 flex-grow px-2">
                    {receivedFrom}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="font-bold w-48">مبلغ وقدره:</label>
                  <span className="border-b-2 border-dotted border-gray-400 flex-grow px-2 font-mono font-bold bg-brand-blue-bg text-brand-blue text-lg">
                    {formatNumber(amount)} {companyInfo.currency}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="border-b-2 border-dotted border-gray-400 flex-grow p-2 bg-gray-100 text-center font-semibold">
                    {tafqeet(amount, companyInfo.currency)}
                  </span>
                </div>
                <div className="flex items-center">
                  <label className="font-bold w-48">وذلك عن:</label>
                  <span className="border-b-2 border-dotted border-gray-400 flex-grow px-2">
                    {description}
                  </span>
                </div>
              </main>

              <footer className="flex justify-around items-end pt-2 border-t-2 border-brand-blue text-center text-sm">
                <div>
                  <p className="font-bold">المحاسب</p>
                  <p className="mt-8 border-t-2 border-dotted border-gray-500 w-40 mx-auto pt-1">
                    {userName}
                  </p>
                </div>
                <div>
                  <p className="font-bold">المستلم</p>
                  <p className="mt-8 border-t-2 border-dotted border-gray-500 w-40 mx-auto pt-1">
                    ..............................
                  </p>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptVoucherPrintPreview;
