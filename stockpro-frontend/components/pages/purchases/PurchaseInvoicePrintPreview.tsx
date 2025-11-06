import React from "react";
import type { InvoiceItem } from "../../../types";
import { tafqeet } from "../../../utils/tafqeet";
import { PrintIcon, XIcon } from "../../icons";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { formatMoney } from "../../../utils/formatting";

interface PurchaseInvoicePrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  isReturn?: boolean;
  invoiceData: {
    vatRate: number;
    isVatEnabled: boolean;
    items: InvoiceItem[];
    totals: { subtotal: number; discount: number; tax: number; net: number };
    paymentMethod: "cash" | "credit";
    supplier: { id: string; name: string; address?: string; taxNumber?: string } | null;
    details: {
      invoiceNumber: string;
      invoiceDate: string;
      userName: string | { name: string };
      branchName: string | { name: string };
    };
  };
}

const PurchaseInvoicePrintPreview: React.FC<
  PurchaseInvoicePrintPreviewProps
> = ({ isOpen, onClose, isReturn = false, invoiceData }) => {
  const { data: companyInfo, isLoading, error } = useGetCompanyQuery();

  if (!isOpen) return null;

  const {
    vatRate,
    isVatEnabled,
    items,
    totals,
    paymentMethod,
    supplier,
    details,
  } = invoiceData;

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
    const printContents = document.getElementById("printable-invoice")?.innerHTML;
    if (printContents) {
      const printWindow = window.open("", "", "height=800,width=800");
      printWindow?.document.write("<html><head><title>طباعة الفاتورة</title>");
      printWindow?.document.write(
        '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">',
      );
      printWindow?.document.write(`
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'brand-blue': '#1E40AF',
                  'brand-blue-bg': '#EFF6FF',
                  'brand-green': '#16a34a',
                  'brand-green-active': '#4ade80',
                  'brand-green-bg': '#ECFDF5',
                  'brand-dark': '#1F2937',
                  'brand-light-gray': '#F8FAFC',
                  'brand-text': '#111827',
                },
              },
            },
          };
        </script>
      `);
      printWindow?.document.write(
        '<script src="https://cdn.tailwindcss.com"></script>',
      );
      printWindow?.document.write(`
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: "Cairo", sans-serif;
            direction: rtl;
            padding: 1.5cm;
            margin: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .bg-brand-green {
            background-color: #16a34a !important;
          }
          .text-brand-green {
            color: #16a34a !important;
          }
          .border-brand-green {
            border-color: #16a34a !important;
          }
          .bg-brand-green-bg {
            background-color: #ECFDF5 !important;
          }
          .text-brand-dark {
            color: #1F2937 !important;
          }
          .border-green-300 {
            border-color: #86efac !important;
          }
        </style>
      `);
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
              className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold flex items-center"
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
            <header className="flex justify-between items-start pb-4 border-b-2 border-brand-green">
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
                    {typeof companyInfo.name === 'string' ? companyInfo.name : JSON.stringify(companyInfo.name) || '---'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {typeof companyInfo.address === 'string' ? companyInfo.address : (companyInfo.address ? JSON.stringify(companyInfo.address) : '--------------------------------')}
                  </p>
                  <p className="text-sm text-gray-600">
                    الرقم الضريبي: {typeof companyInfo.taxNumber === 'string' ? companyInfo.taxNumber : (companyInfo.taxNumber ? JSON.stringify(companyInfo.taxNumber) : '--------------------------------')}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-brand-green">
                  {isReturn ? 'مرتجع مشتريات' : 'فاتورة مشتريات'}
                </h1>
                <p>Purchase Invoice</p>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-x-8 text-sm my-6">
              <div className="border border-gray-300 rounded-md p-3">
                <h3 className="font-bold text-base mb-2">بيانات المورد:</h3>
                <p>
                  <span className="font-semibold">الاسم:</span>{" "}
                  {supplier?.name || "مورد نقدي"}
                </p>
                <p>
                  <span className="font-semibold">العنوان:</span>{' '}
                  {typeof supplier?.address === 'string' ? supplier?.address : (supplier?.address ? JSON.stringify(supplier?.address) : '--------------------------------')}
                </p>
                <p>
                  <span className="font-semibold">الرقم الضريبي:</span>{' '}
                  {typeof supplier?.taxNumber === 'string' ? supplier?.taxNumber : (supplier?.taxNumber ? JSON.stringify(supplier?.taxNumber) : '--------------------------------')}
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
                {(() => {
                  let renderingBranch = '--------------------------------';
                  if (details.branchName != null) {
                    if (typeof details.branchName === 'object' && 'name' in details.branchName && details.branchName.name) {
                      renderingBranch = details.branchName.name;
                    } else if (typeof details.branchName === 'string') {
                      renderingBranch = details.branchName;
                    }
                  }
                  let renderingUser = '--------------------------------';
                  if (details.userName != null) {
                    if (typeof details.userName === 'object' && 'name' in details.userName && details.userName.name) {
                      renderingUser = details.userName.name;
                    } else if (typeof details.userName === 'string') {
                      renderingUser = details.userName;
                    }
                  }
                  return <>
                    <p>
                      <span className="font-semibold">الفرع:</span>{' '}{renderingBranch}
                    </p>
                    <p>
                      <span className="font-semibold">الموظف:</span>{' '}{renderingUser}
                    </p>
                  </>;
                })()}
              </div>
            </section>

            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-brand-green text-white">
                <tr>
                  <th className="p-2 border border-green-300">م</th>
                  <th className="p-2 border border-green-300 text-right" style={{ width: '35%' }}>الصنف</th>
                  <th className="p-2 border border-green-300">الوحدة</th>
                  <th className="p-2 border border-green-300">الكمية</th>
                  <th className="p-2 border border-green-300">السعر</th>
                  {isVatEnabled && (
                    <th className="p-2 border border-green-300">الضريبة {isVatEnabled ? `(%${vatRate})` : '(%0)'}</th>
                  )}
                  <th className="p-2 border border-green-300">الاجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-2 border border-gray-300 text-center">{index + 1}</td>
                    <td className="p-2 border border-gray-300" style={{ width: '35%' }}>{item.name}</td>
                    <td className="p-2 border border-gray-300 text-center">{item.unit}</td>
                    <td className="p-2 border border-gray-300 text-center">{item.qty}</td>
                    <td className="p-2 border border-gray-300 text-center">{formatMoney(item.price)}</td>
                    {isVatEnabled && (
                      <td className="p-2 border border-gray-300 text-center">{formatMoney(item.taxAmount || 0)}</td>
                    )}
                    <td className="p-2 border border-gray-300 text-center">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="flex justify-between items-start mt-4 gap-4">
              <div className="w-full text-sm">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="font-semibold p-2 border border-gray-300">الاجمالي قبل الضريبة</td>
                      <td className="p-2 border border-gray-300 text-left">{formatMoney(totals.subtotal)}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold p-2 border border-gray-300">الخصم</td>
                      <td className="p-2 border border-gray-300 text-left">{formatMoney(totals.discount)}</td>
                    </tr>
                    {isVatEnabled && (
                      <tr>
                        <td className="font-semibold p-2 border border-gray-300">إجمالي الضريبة ({vatRate}%)</td>
                        <td className="p-2 border border-gray-300 text-left">{formatMoney(totals.tax)}</td>
                      </tr>
                    )}
                    <tr className="bg-brand-green text-white font-bold text-base">
                      <td className="p-2 border border-green-300">الصافي</td>
                      <td className="p-2 border border-green-300 text-left">{formatMoney(totals.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-4 p-2 bg-brand-green-bg border border-brand-green text-center font-semibold text-sm rounded-md">
              {tafqeet(totals.net, companyInfo.currency)}
            </div>

            <div className="mt-6 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-gray-300">
              استلمت البضاعة كاملة و بجودة سليمة
            </div>

            <footer className="flex justify-around items-center mt-20 text-center text-sm">
              <div>
                <p className="font-bold">المستلم</p>
                <p className="mt-8 border-t border-gray-400 pt-1">الاسم: ..............................</p>
                <p>التوقيع: ..............................</p>
              </div>
              <div>
                <p className="font-bold">المحاسب</p>
                <p className="mt-8 border-t border-gray-400 pt-1">الاسم: ..............................</p>
                <p>التوقيع: ..............................</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoicePrintPreview;
