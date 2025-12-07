import React from "react";
import type { InvoiceItem } from "../../../types";
import { tafqeet } from "../../../utils/tafqeet";
import { generateZatcaBase64 } from "../../../utils/qrCodeGenerator";
import { PrintIcon, XIcon } from "../../icons";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { formatMoney } from "../../../utils/formatting";
import { useToast } from "../../common/ToastProvider";
import { guardPrint } from "../../utils/printGuard";

interface SalesReturnPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  isReturn?: boolean;
  invoiceData: {
    vatRate: number;
    isVatEnabled: boolean;
    items: InvoiceItem[];
    totals: { subtotal: number; discount: number; tax: number; net: number };
    paymentMethod: "cash" | "credit";
    customer: {
      id: string;
      name: string;
      address?: string;
      taxNumber?: string;
      commercialReg?: string;
    } | null;
    details: {
      invoiceNumber: string;
      invoiceDate: string;
      userName: string;
      branchName: string;
    };
  };
}

const SalesReturnPrintPreview: React.FC<SalesReturnPrintPreviewProps> = ({
  isOpen,
  onClose,
  isReturn = false,
  invoiceData,
}) => {
  const { data: companyInfo, isLoading, error } = useGetCompanyQuery();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { showToast } = useToast();

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

  const paymentMethodLabel = paymentMethod === "cash" ? "نقدا" : "اجل";

  // Determine the original VAT status from invoice data (not current company settings)
  // If invoice has no tax (total tax is 0 and all items have 0 or no taxAmount),
  // then VAT was disabled when invoice was created
  const originalIsVatEnabled =
    totals.tax > 0 || items.some((item) => (item.taxAmount || 0) > 0);
  const shouldDisplayTaxColumn = originalIsVatEnabled;

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

  const printInvoice = () => {
    const printable = document.getElementById("printable-invoice");
    if (!printable) return;

    // Clone the printable content and remove the header to avoid duplication
    const printableClone = printable.cloneNode(true) as HTMLElement;
    const previewHeader = printableClone.querySelector('[data-print-exclude="header"]');
    if (previewHeader) {
      previewHeader.remove();
    }

    // Build a minimal header for print to guarantee company info appears
    const headerHtml = `
      <div class="flex justify-between items-start pb-4 border-b-2 border-brand-blue mb-3">
        <div class="flex items-center gap-4">
          ${
            companyInfo.logo
              ? `<img src="${companyInfo.logo}" alt="Company Logo" class="h-20 w-auto object-contain" />`
              : ""
          }
          <div>
            <div class="text-2xl font-bold text-black">${companyInfo.name || ""}</div>
            <div class="text-sm text-gray-600">${companyInfo.address || ""}</div>
            <div class="text-sm text-gray-600">الرقم الضريبي: ${
              companyInfo.taxNumber || ""
            }</div>
            <div class="text-sm text-gray-600">السجل التجاري: ${
              companyInfo.commercialReg || ""
            }</div>
          </div>
        </div>
        <div class="text-left">
          <div class="text-3xl font-bold text-brand-blue">فاتورة مرتجع</div>
          <div class="text-sm">Tax Invoice <span class="text-gray-700">إشغار مدين</span></div>
        </div>
      </div>
    `;

    // Collect stylesheets and inline styles from current document only (skip scripts)
    const styleNodes = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    ) as HTMLElement[];
    const stylesHtml = styleNodes.map((n) => n.outerHTML).join("\n");

    const extraPrintStyles = `
      <style>
        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { size: A4; margin: 0; }
        body { direction: rtl; margin: 0; background: #fff; }
        .page-break { page-break-after: always; }
        .no-break-inside { break-inside: avoid; }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    `;

    const html = `<!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charSet="utf-8" />
          <title>طباعة الفاتورة</title>
          ${stylesHtml}
          ${extraPrintStyles}
        </head>
        <body>
          <div class="print-root" style="margin:0 auto;max-width:23cm;padding:0.6cm;">${headerHtml}${printableClone.innerHTML}</div>
        </body>
      </html>`;

    const printWindow = window.open("", "printWindow", "width=900,height=850");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } finally {
        printWindow.close();
        onClose();
      }
    };

    const waitForImages = () => {
      const imgs = Array.from(printWindow.document.images || []);
      if (imgs.length === 0) {
        setTimeout(doPrint, 200);
        return;
      }
      let loaded = 0;
      const done = () => {
        loaded += 1;
        if (loaded >= imgs.length) {
          setTimeout(doPrint, 150);
        }
      };
      imgs.forEach((img) => {
        if (img.complete) {
          done();
        } else {
          img.addEventListener("load", done);
          img.addEventListener("error", done);
        }
      });
      // Fallback timeout in case some images never fire events
      setTimeout(doPrint, 1200);
    };

    if (printWindow.document.readyState === "complete") {
      setTimeout(waitForImages, 100);
    } else {
      printWindow.addEventListener("load", () =>
        setTimeout(waitForImages, 100),
      );
    }
  };

  const handlePrint = () => {
    guardPrint({
      hasData: items.length > 0,
      showToast,
      onAllowed: printInvoice,
    });
  };

  const qrData = generateZatcaBase64(
    companyInfo.name,
    companyInfo.taxNumber,
    new Date(details.invoiceDate).toISOString(),
    totals.net.toFixed(2),
    totals.tax.toFixed(2),
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    qrData,
  )}&size=128x128&margin=0`;

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
            <style>
              {`
                @media print {
                  .page-break { page-break-after: always; }
                }
                .page-break { page-break-after: always; }
                .no-break-inside { break-inside: avoid; }
              `}
            </style>
            {(() => {
              const rowsPerPage = 16;
              const pages: InvoiceItem[][] = [];
              for (let i = 0; i < items.length; i += rowsPerPage) {
                pages.push(items.slice(i, i + rowsPerPage));
              }
              const totalPages = Math.max(pages.length, 1);
              const ensureAtLeastOnePage = pages.length === 0 ? [[]] : pages;
              return ensureAtLeastOnePage.map((pageItems, pageIndex) => {
                const isFirstPage = pageIndex === 0;
                const isLastPage = pageIndex === totalPages - 1;
                const rowNumberOffset = pageIndex * rowsPerPage;
                return (
                  <div
                    key={pageIndex}
                    className={!isLastPage ? "page-break" : undefined}
                  >
                    {isFirstPage && (
                      <>
                        <header className="flex justify-between items-start pb-4 border-b-2 border-brand-blue" data-print-exclude="header">
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
                              <p className="text-sm text-gray-600">
                                {companyInfo.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                الرقم الضريبي: {companyInfo.taxNumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                السجل التجاري: {companyInfo.commercialReg}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <h1 className="text-3xl font-bold text-brand-blue">
                              فاتورة مرتجع
                            </h1>
                            <p>
                              <span className="text-sm text-gray-700">
                                إشغار مدين
                              </span>{" "}
                              Tax Invoice
                            </p>
                          </div>
                        </header>

                        <section className="grid grid-cols-2 gap-x-8 text-sm my-6">
                          <div className="border border-gray-300 rounded-md p-3">
                            <h3 className="font-bold text-base mb-2">
                              بيانات العميل:
                            </h3>
                            <p>
                              <span className="font-semibold">الاسم:</span>{" "}
                              {customer?.name || "عميل نقدي"}
                            </p>
                            <p>
                              <span className="font-semibold">العنوان:</span>{" "}
                              {customer?.address ||
                                "--------------------------------"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                الرقم الضريبي:
                              </span>{" "}
                              {customer?.taxNumber ||
                                "--------------------------------"}
                            </p>
                            <p>
                              <span className="font-semibold">
                                السجل التجاري:
                              </span>{" "}
                              {customer?.commercialReg ||
                                "--------------------------------"}
                            </p>
                          </div>
                          <div className="border border-gray-300 rounded-md p-3">
                            <p>
                              <span className="font-semibold">
                                نوع الفاتورة:
                              </span>{" "}
                              {paymentMethodLabel}
                            </p>
                            <p>
                              <span className="font-semibold">
                                رقم الفاتورة:
                              </span>{" "}
                              {details.invoiceNumber}
                            </p>
                            <p>
                              <span className="font-semibold">
                                تاريخ الفاتورة:
                              </span>{" "}
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
                      </>
                    )}

                    {!isFirstPage && totalPages > 1 && (
                      <div className="text-center text-xs text-gray-500 mb-4 pb-2 border-b border-gray-300">
                        صفحة {pageIndex + 1} من {totalPages} -{" "}
                        {details.invoiceNumber}
                      </div>
                    )}

                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead className="bg-brand-blue text-white">
                        <tr>
                          <th className="p-2 border border-blue-300">م</th>
                          <th
                            className="p-2 border border-blue-300 text-right"
                            style={{ width: "35%" }}
                          >
                            الصنف
                          </th>
                          <th className="p-2 border border-blue-300">الوحدة</th>
                          <th className="p-2 border border-blue-300">الكمية</th>
                          <th className="p-2 border border-blue-300">السعر</th>
                          {shouldDisplayTaxColumn && (
                            <th className="p-2 border border-blue-300">
                              الضريبة{" "}
                              {originalIsVatEnabled ? `(%${vatRate})` : "(%0)"}
                            </th>
                          )}
                          <th className="p-2 border border-blue-300">
                            الاجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {pageItems.map((item, index) => (
                          <tr key={index}>
                            <td className="p-2 border border-gray-300 text-center">
                              {rowNumberOffset + index + 1}
                            </td>
                            <td
                              className="p-2 border border-gray-300"
                              style={{ width: "35%" }}
                            >
                              {item.name}
                            </td>
                            <td className="p-2 border border-gray-300 text-center">
                              {item.unit}
                            </td>
                            <td className="p-2 border border-gray-300 text-center">
                              {item.qty}
                            </td>
                            <td className="p-2 border border-gray-300 text-center">
                              {formatMoney(item.price)}
                            </td>
                            {shouldDisplayTaxColumn && (
                              <td className="p-2 border border-gray-300 text-center">
                                {formatMoney(item.taxAmount || 0)}
                              </td>
                            )}
                            <td className="p-2 border border-gray-300 text-center">
                              {formatMoney(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {isLastPage ? (
                      <>
                        <section className="flex justify-between items-start mt-4 gap-4">
                          <div className="w-1/2">
                            {shouldDisplayTaxColumn && qrData && (
                              <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="w-28 h-28"
                              />
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
                                    {formatMoney(totals.subtotal)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="font-semibold p-2 border border-gray-300">
                                    الخصم
                                  </td>
                                  <td className="p-2 border border-gray-300 text-left">
                                    {formatMoney(totals.discount)}
                                  </td>
                                </tr>
                                {shouldDisplayTaxColumn && (
                                  <tr>
                                    <td className="font-semibold p-2 border border-gray-300">
                                      إجمالي الضريبة ({vatRate}%)
                                    </td>
                                    <td className="p-2 border border-gray-300 text-left">
                                      {formatMoney(totals.tax)}
                                    </td>
                                  </tr>
                                )}
                                <tr className="bg-brand-blue text-white font-bold text-base">
                                  <td className="p-2 border border-blue-300">
                                    الصافي
                                  </td>
                                  <td className="p-2 border border-blue-300 text-left">
                                    {formatMoney(totals.net)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <div className="mt-4 p-2 bg-brand-blue-bg border border-brand-blue text-center font-semibold text-sm rounded-md">
                          {tafqeet(totals.net, companyInfo.currency)}
                        </div>

                        <div className="mt-6 pt-4 text-center text-sm text-gray-600 font-semibold border-t-2 border-dashed border-gray-300">
                          استلمت البضاعة كاملة و بجودة سليمة
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
                      </>
                    ) : (
                      <div className="text-center text-xs text-gray-500 mt-2">
                        يتبع...
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnPrintPreview;


