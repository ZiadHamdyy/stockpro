import React from "react";
import type { InvoiceItem } from "../../../types";
import { tafqeet } from "../../../utils/tafqeet";
import { generateZatcaBase64 } from "../../../utils/qrCodeGenerator";
import { PrintIcon, XIcon } from "../../icons";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

interface InvoicePrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    vatRate: number;
    isVatEnabled: boolean;
    items: InvoiceItem[];
    totals: { subtotal: number; discount: number; tax: number; net: number };
    paymentMethod: "cash" | "credit";
    customer: { id: string; name: string; address?: string; taxNumber?: string } | null;
    details: {
      invoiceNumber: string;
      invoiceDate: string;
      userName: string;
      branchName: string;
    };
  };
}

const InvoicePrintPreview: React.FC<InvoicePrintPreviewProps> = ({
  isOpen,
  onClose,
  invoiceData,
}) => {
  const { data: companyInfo, isLoading, error } = useGetCompanyQuery();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  if (!isOpen) return null;

  const {
    vatRate,
    isVatEnabled,
    items,
    totals,
    paymentMethod,
    customer,
    details,
  } = invoiceData;

  // Determine the original VAT status from invoice data (not current company settings)
  // If invoice has no tax (total tax is 0 and all items have 0 or no taxAmount), 
  // then VAT was disabled when invoice was created
  const originalIsVatEnabled = totals.tax > 0 || items.some(item => (item.taxAmount || 0) > 0);

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

  const handlePrint = () => {
    const printContents =
      document.getElementById("printable-invoice")?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "height=800,width=800");
      printWindow?.document.write("<html><head><title>طباعة الفاتورة</title>");
      printWindow?.document.write(
        '<script src="https://cdn.tailwindcss.com"></script>',
      );
      printWindow?.document.write(
        '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
      );
      printWindow?.document.write(
        '<style>body { font-family: "Cairo", sans-serif; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; } @page { size: A4; margin: 0; } </style>',
      );
      printWindow?.document.write('</head><body dir="rtl">');
      printWindow?.document.write(printContents);
      printWindow?.document.write("</body></html>");
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
        // Close the modal and reset to new invoice after printing
        onClose();
      }, 250);
    }
  };

  const qrData = generateZatcaBase64(
    companyInfo.name,
    companyInfo.taxNumber,
    new Date(details.invoiceDate).toISOString(),
    totals.net.toFixed(2),
    totals.tax.toFixed(2),
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=128x128&margin=0`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center print:hidden bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-brand-dark">
            معاينة طباعة الفاتورة
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
          <div id="printable-invoice" className="p-8 bg-white">
            <header className="flex justify-between items-start pb-4 border-b-2 border-brand-blue">
              <div className="flex items-center gap-4">
                {companyInfo.logo && (
                  <img
                    src={companyInfo.logo}
                    alt="Company Logo"
                    className="h-20 w-auto object-contain"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    {companyInfo.name}
                  </h2>
                  <p className="text-sm text-gray-600">{companyInfo.address}</p>
                  <p className="text-sm text-gray-600">
                    الرقم الضريبي: {companyInfo.taxNumber}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-brand-blue">
                  {!originalIsVatEnabled 
                    ? "فاتورة مبيعات"
                    : (customer?.taxNumber 
                        ? "فاتورة ضريبية" 
                        : "فاتورة ضريبية مبيسطة")}
                </h1>
                <p>Tax Invoice</p>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-x-8 text-sm my-6">
              <div className="border border-gray-300 rounded-md p-3">
                <h3 className="font-bold text-base mb-2">بيانات العميل:</h3>
                <p>
                  <span className="font-semibold">الاسم:</span>{" "}
                  {customer?.name || "عميل نقدي"}
                </p>
                <p>
                  <span className="font-semibold">العنوان:</span>{" "}
                  {customer?.address || "غير محدد"}
                </p>
                <p>
                  <span className="font-semibold">الرقم الضريبي:</span>{" "}
                  {customer?.taxNumber || "غير محدد"}
                </p>
              </div>
              <div className="border border-gray-300 rounded-md p-3">
                <p>
                  <span className="font-semibold">رقم الفاتورة:</span>{" "}
                  {details.invoiceNumber}
                </p>
                <p>
                  <span className="font-semibold">تاريخ الفاتورة:</span>{" "}
                  {details.invoiceDate}
                </p>
                <p>
                  <span className="font-semibold">الفرع:</span>{" "}
                  {currentUser?.branch?.name || details.branchName}
                </p>
                <p>
                  <span className="font-semibold">الموظف:</span>{" "}
                  {currentUser?.name || details.userName}
                </p>
              </div>
            </section>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-brand-blue text-white">
                <tr>
                  <th className="p-2 border border-blue-300">#</th>
                  <th className="p-2 border border-blue-300 text-right">
                    الصنف
                  </th>
                  <th className="p-2 border border-blue-300">الكمية</th>
                  <th className="p-2 border border-blue-300">السعر</th>
                  {isVatEnabled && (
                    <th className="p-2 border border-blue-300">مبلغ الضريبة</th>
                  )}
                  <th className="p-2 border border-blue-300">الاجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2 border border-gray-300 text-center">
                      {index + 1}
                    </td>
                    <td className="p-2 border border-gray-300">{item.name}</td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.qty}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.price.toFixed(2)}
                    </td>
                    {isVatEnabled && (
                      <td className="p-2 border border-gray-300 text-center">
                        {item.taxAmount.toFixed(2)}
                      </td>
                    )}
                    <td className="p-2 border border-gray-300 text-center">
                      {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="flex justify-between items-start mt-4 gap-4">
              <div className="w-1/2">
                {isVatEnabled && qrData && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28" />
                )}
              </div>
              <div className="w-1/2 text-sm">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="font-semibold p-2 border border-gray-300">
                        الاجمالي قبل الضريبة
                      </td>
                      <td className="p-2 border border-gray-300 text-left">
                        {totals.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold p-2 border border-gray-300">
                        الخصم
                      </td>
                      <td className="p-2 border border-gray-300 text-left">
                        {totals.discount.toFixed(2)}
                      </td>
                    </tr>
                    {isVatEnabled && (
                      <tr>
                        <td className="font-semibold p-2 border border-gray-300">
                          إجمالي الضريبة ({vatRate}%)
                        </td>
                        <td className="p-2 border border-gray-300 text-left">
                          {totals.tax.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-brand-blue text-white font-bold text-base">
                      <td className="p-2 border border-blue-300">الصافي</td>
                      <td className="p-2 border border-blue-300 text-left">
                        {totals.net.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-4 p-2 bg-brand-blue-bg border border-brand-blue text-center font-semibold text-sm rounded-md">
              {tafqeet(totals.net, companyInfo.currency)}
            </div>

            <footer className="flex justify-around items-center mt-20 text-center text-sm">
              <div>
                <p className="font-bold">المستلم</p>
                <p className="mt-8 border-t border-gray-400 pt-1">
                  الاسم: ..............................
                </p>
                <p>التوقيع: ..............................</p>
              </div>
              <div>
                <p className="font-bold">المحاسب</p>
                <p className="mt-8 border-t border-gray-400 pt-1">
                  الاسم: ..............................
                </p>
                <p>التوقيع: ..............................</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintPreview;
