import React from "react";
import { tafqeet } from "../../../utils/tafqeet";
import { PrintIcon, XIcon } from "../../icons";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { formatNumber } from "../../../utils/formatting";

interface ReceiptVoucherPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  voucherData: {
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
  const { data: companyInfo, isLoading, error } = useGetCompanyQuery();

  // Add css for printing
  React.useEffect(() => {
    // Disable scrolling in background when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrint = React.useCallback(() => {
    window.print();
    setTimeout(() => {
      onClose();
    }, 500);
  }, [onClose]);

  if (!isOpen) return null;

  const {
    number,
    date,
    amount,
    receivedFrom,
    description,
    userName,
    branchName,
  } = voucherData;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-center">جاري تحميل بيانات الشركة...</p>
        </div>
      </div>
    );
  }

  if (error || !companyInfo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p className="text-center text-red-500">خطأ في تحميل بيانات الشركة</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto"
      onClick={onClose}
    >
      <style>{`
        @page {
          size: A5 landscape;
          margin: 0;
        }
        @media print {
          html, body { height: auto; }
          body { margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          #printable-voucher, #printable-voucher * { visibility: visible !important; }
          #printable-voucher {
            position: absolute !important;
            inset: 0 !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 148mm !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .print:hidden, .no-print { display: none !important; }
        }
      `}</style>
      <div
        id="modal-print-preview"
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
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

        <div className="overflow-y-auto flex justify-center">
          <div
            id="printable-voucher"
            className="mx-auto p-6 bg-white"
            style={{ width: "210mm", height: "148mm" }}
          >
            <div className="border-2 border-brand-blue h-full p-4 flex flex-col justify-between rounded-lg">
              <div className="flex justify-between items-center pb-2 border-b-2 border-brand-blue">
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
                    {companyInfo.phone && (
                      <p className="text-xs text-gray-600">هاتف: {companyInfo.phone}</p>
                    )}
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
                    <span className="font-semibold">الرقم الضريبي: {companyInfo.taxNumber}</span> {number}
                  </p>
                  <p>
                    <span className="font-semibold">التاريخ:</span> {date}
                  </p>
                  <p>
                    <span className="font-semibold">الفرع:</span> {typeof branchName === "string" ? branchName : branchName?.name || "غير محدد"}
                  </p>
                </div>
              </div>

              <main className="flex-grow my-4 space-y-3 text-base">
                <div className="flex items-center pt-4">
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
