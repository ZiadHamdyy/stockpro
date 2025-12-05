import React from "react";
import type { CompanyInfo, InvoiceItem, PrintSettings } from "../../../types";
import { tafqeet } from "../../../utils/tafqeet";
import { generateZatcaBase64 } from "../../../utils/qrCodeGenerator";
import { PrintIcon, XIcon } from "../../icons";
import { formatMoney } from "../../../utils/formatting";
import { guardPrint } from "../../utils/printGuard";
import { useToast } from "../../common/ToastProvider";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

interface InvoicePrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  isReturn?: boolean;
  invoiceData: {
    companyInfo: CompanyInfo;
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
  printSettings?: PrintSettings;
}

const InvoicePrintPreview: React.FC<InvoicePrintPreviewProps> = ({
  isOpen,
  onClose,
  isReturn = false,
  invoiceData,
  printSettings,
}) => {
  if (!isOpen) return null;

  const { companyInfo, vatRate, isVatEnabled, items, totals, paymentMethod, customer, details } =
    invoiceData;
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { showToast } = useToast();

  // Default settings if none provided - optimized for page fitting
  const getDefaultEpsonSettings = (): import("../../../types").EpsonSettings => ({
    pageWidth: 80,
    fonts: {
      header: 13,
      body: 11,
      items: 10,
      totals: 12,
      footer: 9,
    },
    spacing: {
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginRight: 1,
      sectionGap: 2,
    },
    alignment: {
      header: 'center' as const,
      items: 'right' as const,
      totals: 'right' as const,
      footer: 'center' as const,
    },
    positioning: {
      branchName: 0,
      date: 0,
      customerType: 0,
      itemName: 0,
      itemQty: 0,
      itemPrice: 0,
      itemTax: 0,
      itemTotal: 0,
      totalsSubtotal: 0,
      totalsTax: 0,
      totalsNet: 0,
      qrCode: 0,
      footerText: 0,
    },
  });

  const settings: PrintSettings = (() => {
    const base = printSettings || {
      template: "default",
      showLogo: true,
      showTaxNumber: true,
      showAddress: true,
      headerText: "",
      footerText: "شكراً لتعاملكم معنا",
      termsText: "",
    };
    if (base.template === 'epson' && !base.epsonSettings) {
      base.epsonSettings = getDefaultEpsonSettings();
    }
    return base;
  })();

  const template = settings.template as string;

  // Preserve original Arabic title logic:
  // - If VAT was disabled when invoice was created => "فاتورة مبيعات"
  // - If VAT enabled and customer has tax number => "فاتورة ضريبية"
  // - If VAT enabled and no customer tax number => "فاتورة ضريبية مبسطة"
  const originalIsVatEnabled =
    totals.tax > 0 || items.some((item) => (item.taxAmount || 0) > 0);
  const defaultArabicTitle = !originalIsVatEnabled
    ? "فاتورة مبيعات"
    : customer?.taxNumber
    ? "فاتورة ضريبية"
    : "فاتورة ضريبية مبسطة";

  const qrData = generateZatcaBase64(
    companyInfo.name,
    companyInfo.taxNumber,
    new Date(details.invoiceDate).toISOString(),
    totals.net.toFixed(2),
    totals.tax.toFixed(2)
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=128x128&margin=0`;

  // --- Shared base styles ---
  const getBaseStyles = () => `
    body { font-family: "Cairo", sans-serif; direction: rtl; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
    * { box-sizing: border-box; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .p-2 { padding: 0.5rem; }
  `;

  // 1. THERMAL / POS (80mm)
  const renderThermalTemplate = () => `
    <html>
    <head>
      <title>إيصال</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        ${getBaseStyles()}
        @page { size: 80mm auto; margin: 0; }
        body { width: 78mm; margin: 0 auto; padding: 5px; font-size: 12px; font-family: 'Courier New', 'Cairo', monospace; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .logo { max-width: 60px; margin-bottom: 5px; filter: grayscale(100%); }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .items-table th { border-bottom: 1px solid #000; text-align: center; font-size: 11px; font-weight: bold; }
        .items-table td { padding: 4px 0; font-size: 11px; }
        .totals { margin-top: 10px; border-top: 2px dashed #000; padding-top: 5px; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px; }
        .qr-container { text-align: center; margin-top: 15px; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; border-top: 1px solid #000; padding-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${settings.showLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" class="logo"/>` : ""}
        <div style="font-size: 16px; font-weight: bold;">${companyInfo.name}</div>
        ${
          settings.showAddress
            ? `<div>${companyInfo.address}</div><div>${companyInfo.phone}</div>`
            : ""
        }
        ${
          settings.showTaxNumber
            ? `<div>الرقم الضريبي: ${companyInfo.taxNumber}</div>`
            : ""
        }
      </div>
      <div style="text-align: center; margin-bottom: 10px; font-weight: bold; font-size: 14px; border: 1px solid #000; padding: 5px;">
        ${settings.headerText || defaultArabicTitle}
      </div>
      <div class="info-row"><span>رقم الفاتورة:</span><span>${details.invoiceNumber}</span></div>
      <div class="info-row"><span>التاريخ:</span><span>${details.invoiceDate}</span></div>
      <div class="info-row"><span>العميل:</span><span>${customer?.name || "نقدي"}</span></div>
      <div class="info-row"><span>الموظف:</span><span>${details.userName || "غير محدد"}</span></div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: right;">الصنف</th>
            <th style="width: 20px;">ك</th>
            <th>سعر</th>
            <th>مجموع</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="text-align: right;">${item.name}</td>
              <td style="text-align: center;">${item.qty}</td>
              <td style="text-align: center;">${item.price.toFixed(2)}</td>
              <td style="text-align: center;">${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="totals">
        <div class="info-row"><span>المجموع:</span><span>${totals.subtotal.toFixed(
          2,
        )}</span></div>
        <div class="info-row"><span>الخصم:</span><span>${totals.discount.toFixed(
          2,
        )}</span></div>
        ${
          isVatEnabled
            ? `<div class="info-row"><span>الضريبة (${vatRate}%):</span><span>${totals.tax.toFixed(
                2,
              )}</span></div>`
            : ""
        }
        <div class="total-row"><span>الصافي:</span><span>${totals.net.toFixed(2)}</span></div>
      </div>
      <div class="qr-container">
        ${isVatEnabled ? `<img src="${qrCodeUrl}" width="100" height="100"/>` : ""}
      </div>
      <div class="footer">
        <div>${settings.footerText}</div>
      </div>
    </body>
    </html>
  `;

  // 1.5. EPSON TEMPLATE (Customizable thermal) - Optimized for page fitting
  const renderEpsonTemplate = () => {
    const epson = settings.epsonSettings || getDefaultEpsonSettings();

    const pageSize = epson.pageHeight !== undefined
      ? `${epson.pageWidth}mm ${epson.pageHeight}mm`
      : `${epson.pageWidth}mm auto`;

    const getAlignment = (section: 'header' | 'items' | 'totals' | 'footer') => {
      const align = epson.alignment[section];
      return align === 'left' ? 'left' : align === 'center' ? 'center' : 'right';
    };

    const getPosition = (key: keyof typeof epson.positioning) => {
      const offset = epson.positioning[key];
      return offset !== 0 ? `transform: translateY(${offset}px);` : '';
    };

    return `
    <html>
    <head>
      <title>إيصال إبسون</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        ${getBaseStyles()}
        @page { size: ${pageSize}; margin: 0; }
        body { 
          width: ${epson.pageWidth}mm; 
          max-width: ${epson.pageWidth}mm;
          margin: 0 auto; 
          padding: ${epson.spacing.marginTop}mm ${epson.spacing.marginRight}mm ${epson.spacing.marginBottom}mm ${epson.spacing.marginLeft}mm; 
          font-size: ${epson.fonts.body}px; 
          font-family: 'Courier New', 'Cairo', monospace; 
          line-height: 1.2;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .header { 
          text-align: ${getAlignment('header')}; 
          border-bottom: 1px dashed #000; 
          padding-bottom: ${epson.spacing.sectionGap}px; 
          margin-bottom: ${epson.spacing.sectionGap}px; 
        }
        .logo { max-width: 50px; margin-bottom: 2px; filter: grayscale(100%); }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 1px; font-size: ${epson.fonts.body}px; }
        .info-row span { max-width: 48%; overflow-wrap: break-word; word-wrap: break-word; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: ${epson.spacing.sectionGap}px; table-layout: fixed; }
        .items-table th { border-bottom: 1px solid #000; text-align: ${getAlignment('items')}; font-size: ${epson.fonts.items}px; font-weight: bold; padding: 2px 0; }
        .items-table td { padding: 2px 0; font-size: ${epson.fonts.items}px; overflow-wrap: break-word; word-wrap: break-word; }
        .totals { margin-top: ${epson.spacing.sectionGap}px; border-top: 1px dashed #000; padding-top: 3px; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: ${epson.fonts.totals}px; margin-top: 3px; }
        .qr-container { text-align: center; margin-top: ${epson.spacing.sectionGap}px; }
        .qr-container img { max-width: 80px; height: auto; }
        .footer { text-align: ${getAlignment('footer')}; margin-top: ${epson.spacing.sectionGap}px; font-size: ${epson.fonts.footer}px; border-top: 1px solid #000; padding-top: 3px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${settings.showLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" class="logo"/>` : ""}
        <div style="font-size: ${epson.fonts.header}px; font-weight: bold; ${getPosition('branchName')}">${companyInfo.name}</div>
        ${
          settings.showAddress
            ? `<div style="${getPosition('date')}; font-size: ${epson.fonts.body - 1}px;">${companyInfo.address}</div><div style="font-size: ${epson.fonts.body - 1}px;">${companyInfo.phone}</div>`
            : ""
        }
        ${
          settings.showTaxNumber
            ? `<div style="${getPosition('date')}; font-size: ${epson.fonts.body - 1}px;">الرقم الضريبي: ${companyInfo.taxNumber}</div>`
            : ""
        }
      </div>
      <div style="text-align: ${getAlignment('header')}; margin-bottom: ${epson.spacing.sectionGap}px; font-weight: bold; font-size: ${epson.fonts.header}px; border: 1px solid #000; padding: 3px;">
        ${settings.headerText || defaultArabicTitle}
      </div>
      <div class="info-row" style="${getPosition('date')}">
        <span>${details.branchName || "الفرع الرئيسي"}</span>
        <span>${details.invoiceNumber}</span>
      </div>
      <div class="info-row" style="${getPosition('date')}">
        <span>${details.invoiceDate}</span>
        <span style="${getPosition('customerType')}">${paymentMethod === "cash" ? "نقدا" : "اجل"}</span>
      </div>
      <div class="info-row"><span>العميل:</span><span>${customer?.name || "عميل نقدا"}</span></div>
      <div class="info-row"><span>الموظف:</span><span>${details.userName || "غير محدد"}</span></div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: ${getAlignment('items')}; ${getPosition('itemName')}">الصنف</th>
            <th style="width: 20px; ${getPosition('itemQty')}">ك</th>
            <th style="${getPosition('itemPrice')}">سعر</th>
            ${isVatEnabled ? `<th style="${getPosition('itemTax')}">ض</th>` : ''}
            <th style="${getPosition('itemTotal')}">مجموع</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="text-align: ${getAlignment('items')}; ${getPosition('itemName')}">${item.name}</td>
              <td style="text-align: center; ${getPosition('itemQty')}">${item.qty}</td>
              <td style="text-align: center; ${getPosition('itemPrice')}">${item.price.toFixed(2)}</td>
              ${isVatEnabled ? `<td style="text-align: center; ${getPosition('itemTax')}">${(item.taxAmount || 0).toFixed(2)}</td>` : ''}
              <td style="text-align: center; ${getPosition('itemTotal')}">${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="totals">
        <div class="info-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsSubtotal')}">
          <span>المجموع:</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div class="info-row" style="text-align: ${getAlignment('totals')};">
          <span>الخصم:</span>
          <span>${totals.discount.toFixed(2)}</span>
        </div>
        ${
          isVatEnabled
            ? `<div class="info-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsTax')}">
                <span>الضريبة (${vatRate}%):</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>`
            : ""
        }
        <div class="total-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsNet')}">
          <span>الصافي:</span>
          <span>${totals.net.toFixed(2)}</span>
        </div>
      </div>
      <div class="qr-container" style="${getPosition('qrCode')}">
        ${isVatEnabled ? `<img src="${qrCodeUrl}" width="80" height="80"/>` : ""}
      </div>
      <div style="text-align: center; margin-top: ${epson.spacing.sectionGap}px; font-weight: bold; font-size: ${epson.fonts.body}px;">
        ${tafqeet(totals.net, companyInfo.currency)}
      </div>
      <div class="footer" style="${getPosition('footerText')}">
        <div>${settings.footerText}</div>
        ${settings.termsText ? `<div style="margin-top: 3px; font-size: ${epson.fonts.footer - 1}px;">${settings.termsText}</div>` : ''}
      </div>
    </body>
    </html>
  `;
  };

  // 2. DEFAULT TEMPLATE (current app style)
  const renderDefaultTemplate = () => `
    <html>
      <head>
        <title>طباعة الفاتورة</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getBaseStyles()}
          @page { size: A4; margin: 0; }
          body { padding: 40px; font-size: 14px; background: #fff; }
          .header-box { border: 2px solid #1E40AF; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; margin-bottom: 20px; }
          .title-box { border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; font-weight: bold; color: #1f2937; text-align: center;}
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #1E40AF; }
          .main-table th { background-color: #1E40AF; color: white; padding: 10px; border: 1px solid #93c5fd; }
          .main-table td { padding: 8px; border: 1px solid #ccc; text-align: center; }
                .totals-box { border: 2px solid #1E40AF; border-radius: 8px; overflow: hidden; width: 40%; margin-right: auto; }
                .totals-row { display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px dashed #ccc; }
                .net-row { background-color: #DBEAFE; border-top: 4px solid #1E40AF; font-weight: bold; font-size: 18px; padding: 10px 15px; color: #1F2937; }
          .tafqeet-box { background-color: #EFF6FF; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; color: #1E40AF; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="display:flex; gap:15px; align-items:center;">
            ${
              settings.showLogo && companyInfo.logo
                ? `<img src="${companyInfo.logo}" style="height: 80px;"/>`
                : ""
            }
            <div>
              <h2 style="margin:0; color:#1f2937; font-size:20px;">${companyInfo.name}</h2>
              ${
                settings.showAddress
                  ? `<p style="margin:5px 0; color:#666;">${companyInfo.address}</p>
                     <p style="margin:0; color:#666;">${companyInfo.phone}</p>`
                  : ""
              }
            </div>
          </div>
          <div style="text-align:left;">
            ${
              settings.showTaxNumber
                ? `<p><strong>الرقم الضريبي:</strong> ${companyInfo.taxNumber}</p>`
                : ""
            }
            <p><strong>السجل التجاري:</strong> ${companyInfo.commercialReg}</p>
          </div>
        </div>
        <div class="title-box">${settings.headerText || defaultArabicTitle}</div>
        <div class="grid-info">
          <div style="border:1px solid #ccc; padding:10px; border-radius:6px;">
            <div style="font-weight:bold; margin-bottom:5px;">بيانات العميل</div>
            <div>الاسم: ${customer?.name || "عميل نقدي"}</div>
            <div>العنوان: ${customer?.address || "--------------------------------"}</div>
            <div>الرقم الضريبي: ${customer?.taxNumber || "--------------------------------"}</div>
            <div>السجل التجاري: ${customer?.commercialReg || "--------------------------------"}</div>
          </div>
          <div style="border:1px solid #ccc; padding:10px; border-radius:6px;">
            <div style="font-weight:bold; margin-bottom:5px;">بيانات الفاتورة</div>
            <div style="display:flex; justify-content:space-between;"><span>الرقم:</span><strong>${details.invoiceNumber}</strong></div>
            <div style="display:flex; justify-content:space-between;"><span>التاريخ:</span><span>${details.invoiceDate}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>النوع:</span><span>${paymentMethod === "cash" ? "نقدي" : "آجل"}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>الفرع:</span><span>${details.branchName}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>الموظف:</span><span>${details.userName || "غير محدد"}</span></div>
          </div>
        </div>
        <table class="main-table">
          <thead>
            <tr>
              <th style="width:50px;">م</th>
              <th>الصنف</th>
              <th style="width:90px;">الوحدة</th>
              <th style="width:80px;">الكمية</th>
              <th style="width:100px;">السعر</th>
              ${isVatEnabled ? `<th style="width:120px;">الضريبة (${vatRate})</th>` : ""}
              <th style="width:120px;">الاجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="text-right">${item.name}</td>
                <td>${item.unit || ""}</td>
                <td>${item.qty}</td>
                <td>${item.price.toFixed(2)}</td>
                ${
                  isVatEnabled
                    ? `<td>${(item.taxAmount || 0).toFixed(2)}</td>`
                    : ""
                }
                <td>${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <div style="width:50%; display:flex; flex-direction:column; align-items:flex-start; gap:12px;">
            ${isVatEnabled ? `<div><img src="${qrCodeUrl}" width="120" height="120"/></div>` : ""}
            <div class="tafqeet-box" style="white-space: nowrap; width:100%; text-align:center;">${tafqeet(totals.net, companyInfo.currency)}</div>
          </div>
          <div class="totals-box">
            <div class="totals-row"><span>المجموع</span><span>${totals.subtotal.toFixed(
              2,
            )}</span></div>
            <div class="totals-row"><span>الخصم</span><span>${totals.discount.toFixed(
              2,
            )}</span></div>
            ${
              isVatEnabled
                ? `<div class="totals-row"><span>الضريبة (${vatRate}%)</span><span>${totals.tax.toFixed(
                    2,
                  )}</span></div>`
                : ""
            }
            <div class="totals-row net-row"><span>الصافي</span><span>${totals.net.toFixed(
              2,
            )}</span></div>
          </div>
        </div>
        <div style="margin-top:40px; text-align:center; font-size:12px; color:#666; border-top:1px solid #eee; padding-top:10px;">
          ${settings.footerText}<br/>
          ${settings.termsText}
        </div>
      </body>
    </html>
  `;

  // 3. CLASSIC TEMPLATE (Formal, B&W)
  const renderClassicTemplate = () => `
    <html>
      <head>
        <title>فاتورة</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getBaseStyles()}
          @page { size: A4; margin: 0; }
          body { padding: 50px; font-size: 13px; }
          .header { border-bottom: 4px double #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .company-name { font-size: 26px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .invoice-box { border: 1px solid #000; padding: 5px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table th { border: 1px solid #000; padding: 8px; background: #f0f0f0; text-align: center; }
          .data-table td { border: 1px solid #000; padding: 8px; text-align: center; }
          .totals-table { width: 40%; border-collapse: collapse; float: left; margin-top: 10px; }
          .totals-table td { border: 1px solid #000; padding: 5px; }
          .footer { clear: both; margin-top: 50px; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${companyInfo.name}</div>
            ${settings.showAddress ? `<div>${companyInfo.address}</div>` : ""}
            ${settings.showTaxNumber ? `<div>الرقم الضريبي: ${companyInfo.taxNumber}</div>` : ""}
          </div>
          ${
            settings.showLogo && companyInfo.logo
              ? `<img src="${companyInfo.logo}" style="height: 70px; filter: grayscale(100%);"/>`
              : ""
          }
        </div>
        <h2 style="text-align: center; text-decoration: underline; margin: 10px 0 20px;">
          ${settings.headerText || defaultArabicTitle}
        </h2>
        <div class="invoice-box">
          <div>
            <strong>العميل:</strong> ${customer?.name || "نقدي"}<br/>
            <strong>العنوان:</strong> ${customer?.address || "--------------------------------"}<br/>
            <strong>الرقم الضريبي:</strong> ${customer?.taxNumber || "--------------------------------"}<br/>
            <strong>السجل التجاري:</strong> ${customer?.commercialReg || "--------------------------------"}
          </div>
          <div style="text-align: left;">
            <strong>رقم الفاتورة:</strong> ${details.invoiceNumber}<br/>
            <strong>التاريخ:</strong> ${details.invoiceDate}<br/>
            <strong>الفرع:</strong> ${details.branchName}<br/>
            <strong>الموظف:</strong> ${details.userName || "غير محدد"}
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th>البيان</th>
              <th width="10%">الكمية</th>
              <th width="15%">السعر</th>
              ${isVatEnabled ? '<th width="15%">الضريبة</th>' : ""}
              <th width="15%">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="text-right">${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price.toFixed(2)}</td>
                ${isVatEnabled ? `<td>${(item.taxAmount || 0).toFixed(2)}</td>` : ""}
                <td>${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div style="overflow: hidden;">
          <div style="float: right; width: 50%;">
            <p><strong>المبلغ كتابة:</strong> ${tafqeet(totals.net, companyInfo.currency)}</p>
            ${isVatEnabled ? `<br/><img src="${qrCodeUrl}" width="100" height="100"/>` : ""}
          </div>
          <table class="totals-table">
            <tr><td>المجموع</td><td class="text-left">${totals.subtotal.toFixed(2)}</td></tr>
            <tr><td>الخصم</td><td class="text-left">${totals.discount.toFixed(2)}</td></tr>
            ${
              isVatEnabled
                ? `<tr><td>الضريبة</td><td class="text-left">${totals.tax.toFixed(2)}</td></tr>`
                : ""
            }
            <tr style="font-weight: bold; background: #f0f0f0;">
              <td>الصافي</td><td class="text-left">${totals.net.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          ${settings.footerText} <br/>
          ${settings.termsText}
        </div>
      </body>
    </html>
  `;

  // 4. MODERN TEMPLATE (colorful)
  const renderModernTemplate = () => `
    <html>
      <head>
        <title>Invoice</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getBaseStyles()}
          @page { size: A4; margin: 0; }
          body { background: #fff; color: #333; font-size: 14px; }
          .top-banner { height: 100px; background: linear-gradient(135deg, #1e40af, #60a5fa); display: flex; align-items: center; padding: 0 40px; color: white; justify-content: space-between; }
          .top-banner h1 { font-size: 36px; margin: 0; }
          .container { padding: 40px; }
          .client-box { margin-top: -60px; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 40%; }
          .meta-info { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 30px; color: #555; }
          .modern-table { width: 100%; border-collapse: collapse; }
          .modern-table th { text-align: right; padding: 15px 10px; color: #888; font-weight: 600; border-bottom: 2px solid #eee; text-transform: uppercase; font-size: 12px; }
          .modern-table td { padding: 15px 10px; border-bottom: 1px solid #f9f9f9; }
          .amount { font-weight: bold; color: #1e40af; }
          .total-section { display: flex; justify-content: flex-end; margin-top: 20px; }
          .total-card { width: 300px; text-align: right; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .grand-total { font-size: 24px; color: #1e40af; font-weight: bold; border-top: 2px solid #1e40af; padding-top: 10px; margin-top: 10px; border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="top-banner">
          <div>
            ${
              settings.showLogo && companyInfo.logo
                ? `<img src="${companyInfo.logo}" style="height: 60px; background: white; padding: 4px; padding-top: 8px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); margin-top: 10px;"/>`
                : ""
            }
            <div style="font-weight: bold; margin-top: 5px;">${companyInfo.name}</div>
          </div>
          <h1>${settings.headerText || "INVOICE"}</h1>
        </div>
        <div class="container">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="client-box">
              <div style="color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">فاتورة إلى</div>
              <div style="font-size: 18px; font-weight: bold;">${customer?.name || "عميل نقدي"}</div>
              <div style="font-size: 12px; margin-top:5px;">العنوان: ${customer?.address || "--------------------------------"}</div>
              <div style="font-size: 12px; margin-top:5px;">الرقم الضريبي: ${customer?.taxNumber || "--------------------------------"}</div>
              <div style="font-size: 12px; margin-top:5px;">السجل التجاري: ${customer?.commercialReg || "--------------------------------"}</div>
            </div>
            <div style="text-align: left; margin-top: 20px;">
              ${isVatEnabled ? `<img src="${qrCodeUrl}" width="100" height="100"/>` : ""}
            </div>
          </div>
          <div class="meta-info">
            <div>
              <span style="display:block; font-size:12px; color:#999; font-weight:bold;">رقم الفاتورة</span>
              <span style="font-size:16px; font-weight:bold;">#${details.invoiceNumber}</span>
            </div>
            <div>
              <span style="display:block; font-size:12px; color:#999; font-weight:bold;">التاريخ</span>
              <span style="font-size:16px;">${details.invoiceDate}</span>
            </div>
            <div>
              <span style="display:block; font-size:12px; color:#999; font-weight:bold;">الموظف</span>
              <span style="font-size:16px;">${details.userName || "غير محدد"}</span>
            </div>
            <div>
              <span style="display:block; font-size:12px; color:#999; font-weight:bold;">الفرع</span>
              <span style="font-size:16px;">${details.branchName}</span>
            </div>
          </div>
          <table class="modern-table">
            <thead>
              <tr>
                <th>الوصف</th>
                <th class="text-center">الكمية</th>
                <th class="text-center">السعر</th>
                ${isVatEnabled ? '<th class="text-center">الضريبة</th>' : ""}
                <th class="text-left">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 11px; color: #999;">${item.unit}</div>
                  </td>
                  <td class="text-center">${item.qty}</td>
                  <td class="text-center">${item.price.toFixed(2)}</td>
                  ${isVatEnabled ? `<td class="text-center">${(item.taxAmount || 0).toFixed(2)}</td>` : ""}
                  <td class="text-left amount">${item.total.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="total-section">
            <div class="total-card">
              <div class="total-row"><span>المجموع الفرعي</span><span>${totals.subtotal.toFixed(
                2,
              )}</span></div>
              <div class="total-row"><span>الخصم</span><span>${totals.discount.toFixed(
                2,
              )}</span></div>
              ${
                isVatEnabled
                  ? `<div class="total-row"><span>الضريبة (${vatRate}%)</span><span>${totals.tax.toFixed(
                      2,
                    )}</span></div>`
                  : ""
              }
              <div class="total-row grand-total">
                <span>الإجمالي</span>
                <span>${totals.net.toFixed(2)}</span>
              </div>
              <div style="text-align: center; margin-top: 5px; color: #666; font-size: 11px;">
                ${tafqeet(totals.net, companyInfo.currency)}
              </div>
            </div>
          </div>
          <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; color: #999; text-align: center; font-size: 12px;">
            ${settings.footerText}<br/>
            ${settings.termsText}
          </div>
        </div>
      </body>
    </html>
  `;

  // 5. MINIMAL TEMPLATE (clean)
  const renderMinimalTemplate = () => `
    <html>
      <head>
        <title>Invoice</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          ${getBaseStyles()}
          @page { size: A4; margin: 10mm; }
          body { padding: 12mm; font-size: 13px; font-family: 'Cairo', 'Helvetica Neue', sans-serif; color: #000; background: #fff; }
          h1,h2,h3,h4 { margin: 0; padding: 0; }
          .title-box { text-align: center; font-weight: 700; font-size: 18px; border: 1px solid #000; padding: 10px; margin-bottom: 12px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
          .table th { background: #f5f5f5; }
          .label-en { display: block; font-size: 11px; color: #444; font-weight: 600; }
          .info-table td { width: 25%; vertical-align: top; }
          .section { margin-bottom: 14px; }
          .totals { width: 55%; margin-left: auto; }
          .totals td { font-weight: 600; }
          .totals .value { text-align: left; }
          .muted { color: #666; font-size: 12px; text-align: center; margin-top: 8px; }
          .qr-box { margin-top: 12px; }
          .tafqeet { margin-top: 12px; padding: 8px; border: 1px dashed #000; text-align: center; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="title-box">${settings.headerText || defaultArabicTitle}</div>

        <div class="section">
          <table class="table info-table">
            <tbody>
              <tr>
                <td>
                  الاسم
                  <span class="label-en">Name</span>
                </td>
                <td>${companyInfo.name}</td>
                <td>
                  الرقم الضريبي
                  <span class="label-en">VAT Number</span>
                </td>
                <td>${settings.showTaxNumber ? companyInfo.taxNumber || "-" : "-"}</td>
              </tr>
              <tr>
                <td>
                  العنوان
                  <span class="label-en">Address</span>
                </td>
                <td>${settings.showAddress ? companyInfo.address || "-" : "-"}</td>
                <td>
                  السجل التجاري
                  <span class="label-en">Commercial Reg</span>
                </td>
                <td>${companyInfo.commercialReg || "-"}</td>
              </tr>
              <tr>
                <td>
                  الهاتف
                  <span class="label-en">Phone</span>
                </td>
                <td>${companyInfo.phone || "-"}</td>
                <td>
                  العميل
                  <span class="label-en">Customer</span>
                </td>
                <td>${customer?.name || "عميل نقدي"}</td>
              </tr>
              <tr>
                <td>
                  رقم الفاتورة
                  <span class="label-en">Invoice No</span>
                </td>
                <td>${details.invoiceNumber}</td>
                <td>
                  التاريخ
                  <span class="label-en">Date</span>
                </td>
                <td>${details.invoiceDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <table class="table">
            <thead>
              <tr>
                <th width="5%">م<br/><span class="label-en">S</span></th>
                <th width="22%">تفاصيل السلع أو الخدمات<br/><span class="label-en">Nature Of Goods Or Services</span></th>
                <th width="10%">سعر الوحدة<br/><span class="label-en">Unit Price</span></th>
                <th width="8%">الكمية<br/><span class="label-en">Quantity</span></th>
                <th width="12%">المبلغ الخاضع للضريبة<br/><span class="label-en">Taxable Amount</span></th>
                <th width="8%">خصومات<br/><span class="label-en">Discount</span></th>
                <th width="8%">نسبة الضريبة<br/><span class="label-en">Tax Rate</span></th>
                <th width="10%">مبلغ الضريبة<br/><span class="label-en">Tax Amount</span></th>
                <th width="13%">المجموع شامل الضريبة<br/><span class="label-en">Subtotal Incl. VAT</span></th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length === 0
                  ? `<tr><td colspan="9" style="text-align:center">لا توجد أصناف</td></tr>`
                  : items
                      .map((item, idx) => {
                        const taxable = item.price * item.qty;
                        const taxAmount = item.taxAmount || 0;
                        const lineDiscount = 0;
                        const lineTotal = originalIsVatEnabled ? taxable + taxAmount : taxable;
                        return `
                          <tr>
                            <td style="text-align:center">${idx + 1}</td>
                            <td style="text-align:right">${item.name}</td>
                            <td style="text-align:center">${formatMoney(item.price)}</td>
                            <td style="text-align:center">${item.qty}</td>
                            <td style="text-align:center">${formatMoney(taxable)}</td>
                            <td style="text-align:center">${formatMoney(lineDiscount)}</td>
                            <td style="text-align:center">${isVatEnabled ? vatRate : 0}%</td>
                            <td style="text-align:center">${formatMoney(taxAmount)}</td>
                            <td style="text-align:center">${formatMoney(lineTotal)}</td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>

        <div class="section" style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div class="qr-box">
            ${isVatEnabled && qrData ? `<img src="${qrCodeUrl}" width="120" height="120"/>` : ""}
          </div>
          <table class="table totals">
            <tbody>
              <tr>
                <td>الإجمالي غير شامل الضريبة<br/><span class="label-en">Total Excluding VAT</span></td>
                <td class="value">${formatMoney(totals.subtotal)}</td>
              </tr>
              <tr>
                <td>مجموع الخصومات<br/><span class="label-en">Discount</span></td>
                <td class="value">${formatMoney(totals.discount)}</td>
              </tr>
              <tr>
                <td>الإجمالي الخاضع للضريبة<br/><span class="label-en">Total Taxable Amount</span></td>
                <td class="value">${formatMoney(totals.subtotal - totals.discount)}</td>
              </tr>
              ${
                isVatEnabled
                  ? `<tr>
                      <td>مجموع ضريبة القيمة المضافة<br/><span class="label-en">Total VAT</span></td>
                      <td class="value">${formatMoney(totals.tax)}</td>
                    </tr>`
                  : ""
              }
              <tr style="font-weight:bold; background:#f5f5f5;">
                <td>إجمالي المبلغ المستحق<br/><span class="label-en">Total Amount Due</span></td>
                <td class="value">${formatMoney(totals.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tafqeet">${tafqeet(totals.net, companyInfo.currency)}</div>
        <div class="muted">${settings.footerText} ${settings.footerText && settings.termsText ? "•" : ""} ${settings.termsText}</div>
      </body>
    </html>
  `;

  // Separate print function for Modern template
  const printModernTemplate = () => {
    // Wait a bit to ensure React has fully rendered
    setTimeout(() => {
      const printable = document.getElementById("printable-modern-invoice");
      if (!printable) {
        showToast("خطأ: لم يتم العثور على محتوى الطباعة", "error");
        return;
      }

      // Clone the element to ensure we get all rendered content
      const clone = printable.cloneNode(true) as HTMLElement;
      const printableContent = clone.innerHTML;

      const styleNodes = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      ) as HTMLElement[];
      const stylesHtml = styleNodes.map((n) => n.outerHTML).join("\n");

      const extraPrintStyles = `
        <style>
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4; margin: 0; }
          body { direction: rtl; margin: 0; background: #fff; }
          .page-break { page-break-after: always; }
          .no-break-inside { break-inside: avoid; }
          .print-root { 
            margin: 0 auto; 
            max-width: 100%; 
            padding: 2rem !important; 
            background: white;
          }
          header { 
            display: flex !important; 
            justify-content: space-between !important;
            align-items: flex-start !important;
            padding-bottom: 1rem !important;
            border-bottom: 2px solid #1E40AF !important;
            margin-bottom: 1.5rem !important;
          }
          /* Preserve all Tailwind flex utilities */
          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .items-start { align-items: flex-start !important; }
          .items-center { align-items: center !important; }
          .gap-4 { gap: 1rem !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          /* Preserve Tailwind grid utilities */
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
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
            <div class="print-root">${printableContent}</div>
          </body>
        </html>`;

      const printWindow = window.open("", "printWindow", "width=900,height=850");
      if (!printWindow) {
        showToast("خطأ: تم منع فتح نافذة الطباعة", "error");
        return;
      }
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
        setTimeout(doPrint, 1200);
      };

      if (printWindow.document.readyState === "complete") {
        setTimeout(waitForImages, 100);
      } else {
        printWindow.addEventListener("load", () =>
          setTimeout(waitForImages, 100)
        );
      }
    }, 100);
  };

  // Separate print function for Minimal template
  const printMinimalTemplate = () => {
    // Wait a bit to ensure React has fully rendered
    setTimeout(() => {
      const printable = document.getElementById("printable-modern-invoice");
      if (!printable) {
        showToast("خطأ: لم يتم العثور على محتوى الطباعة", "error");
        return;
      }

      // Get all content including header from the printable element
      // Clone the element to ensure we get all rendered content
      const clone = printable.cloneNode(true) as HTMLElement;
      const printableContent = clone.innerHTML;

      // Verify header is present (for minimal template, header should be in first page)
      const hasHeader = printableContent.includes('border-b-2 border-brand-blue') || 
                       printableContent.includes('text-3xl font-bold text-brand-blue');
      
      if (!hasHeader) {
        console.warn("Header not found in printable content, but proceeding with print");
      }

      const styleNodes = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      ) as HTMLElement[];
      const stylesHtml = styleNodes.map((n) => n.outerHTML).join("\n");

      const extraPrintStyles = `
        <style>
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4; margin: 0; }
          body { direction: rtl; margin: 0; background: #fff; }
          .page-break { page-break-after: always; }
          .no-break-inside { break-inside: avoid; }
          .print-root { 
            margin: 0 auto; 
            max-width: 100%; 
            padding: 2rem !important; 
            background: white;
          }
          header { 
            display: flex !important; 
            justify-content: space-between !important;
            align-items: flex-start !important;
            padding-bottom: 1rem !important;
            border-bottom: 2px solid #1E40AF !important;
            margin-bottom: 1.5rem !important;
          }
          /* Preserve all Tailwind flex utilities */
          .flex { display: flex !important; }
          .justify-between { justify-content: space-between !important; }
          .items-start { align-items: flex-start !important; }
          .items-center { align-items: center !important; }
          .gap-4 { gap: 1rem !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          /* Preserve Tailwind grid utilities */
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
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
            <div class="print-root">${printableContent}</div>
          </body>
        </html>`;

      const printWindow = window.open("", "printWindow", "width=900,height=850");
      if (!printWindow) {
        showToast("خطأ: تم منع فتح نافذة الطباعة", "error");
        return;
      }
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
        setTimeout(doPrint, 1200);
      };

      if (printWindow.document.readyState === "complete") {
        setTimeout(waitForImages, 100);
      } else {
        printWindow.addEventListener("load", () =>
          setTimeout(waitForImages, 100)
        );
      }
    }, 100);
  };

  const handlePrint = () => {
    if (template === "modern") {
      guardPrint({
        hasData: items.length > 0,
        showToast,
        onAllowed: printModernTemplate,
      });
      return;
    }
    
    if (template === "minimal") {
      guardPrint({
        hasData: items.length > 0,
        showToast,
        onAllowed: printMinimalTemplate,
      });
      return;
    }

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    let content = "";
    switch (template) {
      case "thermal":
        content = renderThermalTemplate();
        break;
      case "epson":
        content = renderEpsonTemplate();
        break;
      case "classic":
        content = renderClassicTemplate();
        break;
      case "modern":
        content = renderModernTemplate();
        break;
      case "minimal":
        content = renderMinimalTemplate();
        break;
      default:
        content = renderDefaultTemplate();
        break;
    }

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      onClose();
    }, 500);
  };

  const isThermal = template === "thermal" || template === "epson";

  // Interactive controls state for epson template
  const [epsonPreviewSettings, setEpsonPreviewSettings] = React.useState(
    settings.epsonSettings || getDefaultEpsonSettings()
  );
  const [selectedElement, setSelectedElement] = React.useState<string | null>(null);
  const [showEpsonControls, setShowEpsonControls] = React.useState(false);

  // Update preview settings when settings change
  React.useEffect(() => {
    if (template === 'epson' && settings.epsonSettings) {
      setEpsonPreviewSettings(settings.epsonSettings);
    }
  }, [settings.epsonSettings, template]);

  // Render epson template with preview settings - Optimized for page fitting
  const renderEpsonTemplateWithPreview = () => {
    const epson = epsonPreviewSettings;
    const pageSize = epson.pageHeight !== undefined
      ? `${epson.pageWidth}mm ${epson.pageHeight}mm`
      : `${epson.pageWidth}mm auto`;

    const getAlignment = (section: 'header' | 'items' | 'totals' | 'footer') => {
      const align = epson.alignment[section];
      return align === 'left' ? 'left' : align === 'center' ? 'center' : 'right';
    };

    const getPosition = (key: keyof typeof epson.positioning) => {
      const offset = epson.positioning[key];
      return offset !== 0 ? `transform: translateY(${offset}px);` : '';
    };

    return `
    <html>
    <head>
      <title>إيصال إبسون</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        ${getBaseStyles()}
        @page { size: ${pageSize}; margin: 0; }
        body { 
          width: ${epson.pageWidth}mm; 
          max-width: ${epson.pageWidth}mm;
          margin: 0 auto; 
          padding: ${epson.spacing.marginTop}mm ${epson.spacing.marginRight}mm ${epson.spacing.marginBottom}mm ${epson.spacing.marginLeft}mm; 
          font-size: ${epson.fonts.body}px; 
          font-family: 'Courier New', 'Cairo', monospace; 
          line-height: 1.2;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .header { 
          text-align: ${getAlignment('header')}; 
          border-bottom: 1px dashed #000; 
          padding-bottom: ${epson.spacing.sectionGap}px; 
          margin-bottom: ${epson.spacing.sectionGap}px; 
        }
        .logo { max-width: 50px; margin-bottom: 2px; filter: grayscale(100%); }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 1px; font-size: ${epson.fonts.body}px; }
        .info-row span { max-width: 48%; overflow-wrap: break-word; word-wrap: break-word; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: ${epson.spacing.sectionGap}px; table-layout: fixed; }
        .items-table th { border-bottom: 1px solid #000; text-align: ${getAlignment('items')}; font-size: ${epson.fonts.items}px; font-weight: bold; padding: 2px 0; }
        .items-table td { padding: 2px 0; font-size: ${epson.fonts.items}px; overflow-wrap: break-word; word-wrap: break-word; }
        .totals { margin-top: ${epson.spacing.sectionGap}px; border-top: 1px dashed #000; padding-top: 3px; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: ${epson.fonts.totals}px; margin-top: 3px; }
        .qr-container { text-align: center; margin-top: ${epson.spacing.sectionGap}px; }
        .qr-container img { max-width: 80px; height: auto; }
        .footer { text-align: ${getAlignment('footer')}; margin-top: ${epson.spacing.sectionGap}px; font-size: ${epson.fonts.footer}px; border-top: 1px solid #000; padding-top: 3px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${settings.showLogo && companyInfo.logo ? `<img src="${companyInfo.logo}" class="logo"/>` : ""}
        <div style="font-size: ${epson.fonts.header}px; font-weight: bold; ${getPosition('branchName')}">${companyInfo.name}</div>
        ${
          settings.showAddress
            ? `<div style="${getPosition('date')}; font-size: ${epson.fonts.body - 1}px;">${companyInfo.address}</div><div style="font-size: ${epson.fonts.body - 1}px;">${companyInfo.phone}</div>`
            : ""
        }
        ${
          settings.showTaxNumber
            ? `<div style="${getPosition('date')}; font-size: ${epson.fonts.body - 1}px;">الرقم الضريبي: ${companyInfo.taxNumber}</div>`
            : ""
        }
      </div>
      <div style="text-align: ${getAlignment('header')}; margin-bottom: ${epson.spacing.sectionGap}px; font-weight: bold; font-size: ${epson.fonts.header}px; border: 1px solid #000; padding: 3px;">
        ${settings.headerText || defaultArabicTitle}
      </div>
      <div class="info-row" style="${getPosition('date')}">
        <span>${details.branchName || "الفرع الرئيسي"}</span>
        <span>${details.invoiceNumber}</span>
      </div>
      <div class="info-row" style="${getPosition('date')}">
        <span>${details.invoiceDate}</span>
        <span style="${getPosition('customerType')}">${paymentMethod === "cash" ? "نقدا" : "اجل"}</span>
      </div>
      <div class="info-row"><span>العميل:</span><span>${customer?.name || "عميل نقدا"}</span></div>
      <div class="info-row"><span>الموظف:</span><span>${details.userName || "غير محدد"}</span></div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: ${getAlignment('items')}; ${getPosition('itemName')}">الصنف</th>
            <th style="width: 20px; ${getPosition('itemQty')}">ك</th>
            <th style="${getPosition('itemPrice')}">سعر</th>
            ${isVatEnabled ? `<th style="${getPosition('itemTax')}">ض</th>` : ''}
            <th style="${getPosition('itemTotal')}">مجموع</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="text-align: ${getAlignment('items')}; ${getPosition('itemName')}">${item.name}</td>
              <td style="text-align: center; ${getPosition('itemQty')}">${item.qty}</td>
              <td style="text-align: center; ${getPosition('itemPrice')}">${item.price.toFixed(2)}</td>
              ${isVatEnabled ? `<td style="text-align: center; ${getPosition('itemTax')}">${(item.taxAmount || 0).toFixed(2)}</td>` : ''}
              <td style="text-align: center; ${getPosition('itemTotal')}">${item.total.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="totals">
        <div class="info-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsSubtotal')}">
          <span>المجموع:</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div class="info-row" style="text-align: ${getAlignment('totals')};">
          <span>الخصم:</span>
          <span>${totals.discount.toFixed(2)}</span>
        </div>
        ${
          isVatEnabled
            ? `<div class="info-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsTax')}">
                <span>الضريبة (${vatRate}%):</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>`
            : ""
        }
        <div class="total-row" style="text-align: ${getAlignment('totals')}; ${getPosition('totalsNet')}">
          <span>الصافي:</span>
          <span>${totals.net.toFixed(2)}</span>
        </div>
      </div>
      <div class="qr-container" style="${getPosition('qrCode')}">
        ${isVatEnabled ? `<img src="${qrCodeUrl}" width="80" height="80"/>` : ""}
      </div>
      <div style="text-align: center; margin-top: ${epson.spacing.sectionGap}px; font-weight: bold; font-size: ${epson.fonts.body}px;">
        ${tafqeet(totals.net, companyInfo.currency)}
      </div>
      <div class="footer" style="${getPosition('footerText')}">
        <div>${settings.footerText}</div>
        ${settings.termsText ? `<div style="margin-top: 3px; font-size: ${epson.fonts.footer - 1}px;">${settings.termsText}</div>` : ''}
      </div>
    </body>
    </html>
  `;
  };

  const handleSaveEpsonPreview = () => {
    if (printSettings) {
      // This would need to be passed back to parent component
      // For now, we'll just update local state
      showToast('تم حفظ إعدادات إبسون. استخدم زر الحفظ في صفحة الإعدادات لحفظ التغييرات الدائمة.');
    }
  };

  const updateEpsonPreviewSetting = (path: string[], value: any) => {
    setEpsonPreviewSettings(prev => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl flex flex-col my-auto transition-all ${
          template === "epson"
            ? "w-auto"
            : isThermal 
            ? "w-[400px]" 
            : "w-full max-w-4xl max-h-[95vh]"
        }`}
        style={
          template === "epson" && settings.epsonSettings?.pageWidth
            ? { 
                maxWidth: `${Math.ceil(settings.epsonSettings.pageWidth * 3.779527559) + 100}px`,
                width: "fit-content"
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center print:hidden bg-gray-50 rounded-t-lg">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-brand-dark">معاينة الطباعة</h2>
            <span className="text-xs text-gray-500 font-mono">
              النموذج: {settings.template}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {template === "epson" && (
              <button
                onClick={() => setShowEpsonControls(!showEpsonControls)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold flex items-center"
              >
                تخصيص إبسون
              </button>
            )}
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

        {/* Epson Interactive Controls */}
        {template === "epson" && showEpsonControls && (
          <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-2xl border-2 border-blue-500 z-50 p-4 w-80 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="font-bold text-lg text-gray-800">تخصيص إبسون</h3>
              <button
                onClick={() => setShowEpsonControls(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                إغلاق
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اختر العنصر للتعديل
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  value={selectedElement || ""}
                  onChange={(e) => setSelectedElement(e.target.value || null)}
                >
                  <option value="">-- اختر عنصر --</option>
                  <optgroup label="الترويسة">
                    <option value="branchName">اسم الفرع</option>
                    <option value="date">التاريخ</option>
                    <option value="customerType">نوع العميل</option>
                  </optgroup>
                  <optgroup label="الأصناف">
                    <option value="itemName">اسم الصنف</option>
                    <option value="itemQty">الكمية</option>
                    <option value="itemPrice">السعر</option>
                    <option value="itemTax">الضريبة</option>
                    <option value="itemTotal">الإجمالي</option>
                  </optgroup>
                  <optgroup label="الإجماليات">
                    <option value="totalsSubtotal">المجموع</option>
                    <option value="totalsTax">ضريبة الإجمالي</option>
                    <option value="totalsNet">الصافي</option>
                  </optgroup>
                  <optgroup label="أخرى">
                    <option value="qrCode">رمز QR</option>
                    <option value="footerText">نص التذييل</option>
                  </optgroup>
                </select>
              </div>

              {selectedElement && (
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      الموضع العمودي (بكسل)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const current = epsonPreviewSettings.positioning[selectedElement as keyof typeof epsonPreviewSettings.positioning];
                          updateEpsonPreviewSetting(['positioning', selectedElement], current - 1);
                        }}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      >
                        ↑
                      </button>
                      <input
                        type="number"
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                        value={epsonPreviewSettings.positioning[selectedElement as keyof typeof epsonPreviewSettings.positioning]}
                        onChange={(e) => updateEpsonPreviewSetting(['positioning', selectedElement], parseFloat(e.target.value) || 0)}
                        min="-50"
                        max="50"
                        step="1"
                      />
                      <button
                        onClick={() => {
                          const current = epsonPreviewSettings.positioning[selectedElement as keyof typeof epsonPreviewSettings.positioning];
                          updateEpsonPreviewSetting(['positioning', selectedElement], current + 1);
                        }}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      >
                        ↓
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">قيمة موجبة للأعلى، سالبة للأسفل</p>
                  </div>

                  {(['header', 'items', 'totals', 'footer'].some(s => selectedElement.includes(s)) || 
                    ['branchName', 'date', 'customerType', 'itemName', 'itemQty', 'itemPrice', 'itemTax', 'itemTotal', 'totalsSubtotal', 'totalsTax', 'totalsNet', 'footerText'].includes(selectedElement)) && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        محاذاة النص
                      </label>
                      <div className="flex gap-2">
                        {(['right', 'center', 'left'] as const).map((align) => {
                          const section = selectedElement.includes('item') ? 'items' :
                                         selectedElement.includes('total') ? 'totals' :
                                         selectedElement.includes('header') || ['branchName', 'date', 'customerType'].includes(selectedElement) ? 'header' : 'footer';
                          return (
                            <button
                              key={align}
                              onClick={() => updateEpsonPreviewSetting(['alignment', section], align)}
                              className={`flex-1 p-2 rounded text-sm ${
                                epsonPreviewSettings.alignment[section] === align
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <button
                  onClick={handleSaveEpsonPreview}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  حفظ التغييرات
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ملاحظة: استخدم صفحة الإعدادات لحفظ التغييرات الدائمة
                </p>
              </div>
            </div>
          </div>
        )}

        {template === "modern" || template === "minimal" ? (
          <div className="overflow-y-auto">
            <div id="printable-modern-invoice" className="p-8 bg-white">
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
                          {template === "minimal" ? (
                            <>
                              <header className="flex justify-between items-start pb-4 border-b-2 border-brand-blue mb-6">
                                <div className="flex items-center gap-4">
                                  {settings.showLogo && companyInfo.logo && (
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
                                    {settings.showAddress && (
                                      <p className="text-sm text-gray-600">
                                        {companyInfo.address}
                                      </p>
                                    )}
                                    {settings.showTaxNumber && (
                                      <p className="text-sm text-gray-600">
                                        الرقم الضريبي: {companyInfo.taxNumber}
                                      </p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                      السجل التجاري: {companyInfo.commercialReg}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <h1 className="text-3xl font-bold text-brand-blue">
                                    {isReturn
                                      ? "فاتورة ضريبية"
                                      : !originalIsVatEnabled
                                      ? "فاتورة مبيعات"
                                      : customer?.taxNumber
                                      ? "فاتورة ضريبية"
                                      : "فاتورة ضريبية مبسطة"}
                                  </h1>
                                  <p>
                                    {isReturn && (
                                      <span className="text-sm text-gray-700">
                                        إشغار مدين
                                      </span>
                                    )}{" "}
                                    Tax Invoice
                                  </p>
                                </div>
                              </header>

                              {/* Invoice Info - Horizontal Layout */}
                              <section className="grid grid-cols-5 gap-4 text-sm mb-6 pb-4 border-b border-gray-300">
                                <div>
                                  <span className="font-semibold">رقم الفاتورة:</span>
                                  <p className="mt-1">{details.invoiceNumber}</p>
                                </div>
                                <div>
                                  <span className="font-semibold">التاريخ:</span>
                                  <p className="mt-1">{details.invoiceDate}</p>
                                </div>
                                <div>
                                  <span className="font-semibold">النوع:</span>
                                  <p className="mt-1">
                                    {paymentMethod === "cash" ? "نقدا" : "اجل"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold">الفرع:</span>
                                  <p className="mt-1">
                                    {currentUser?.branch?.name || details.branchName}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-semibold">الموظف:</span>
                                  <p className="mt-1">
                                    {currentUser?.name || details.userName}
                                  </p>
                                </div>
                              </section>

                              {/* Buyer and Seller Information - Side by Side */}
                              <section className="my-6 grid grid-cols-2 gap-4">
                                <div className="border border-gray-300 rounded-md p-3">
                                  <h3 className="font-bold text-base mb-2">
                                    بيانات البائع:
                                  </h3>
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <p className="font-semibold mb-1">
                                        {companyInfo.name}
                                      </p>
                                      <p className="mb-1">
                                        {settings.showAddress ? companyInfo.address : "عنوان الشركة"}
                                      </p>
                                      <p className="mb-1">
                                        <span className="font-semibold">
                                          الرقم الضريبي:
                                        </span>{" "}
                                        {settings.showTaxNumber ? companyInfo.taxNumber : "--------------------------------"}
                                      </p>
                                      <p>
                                        <span className="font-semibold">
                                          السجل التجاري:
                                        </span>{" "}
                                        {companyInfo.commercialReg || "--------------------------------"}
                                      </p>
                                    </div>
                                    {settings.showLogo && companyInfo.logo && (
                                      <div className="flex-shrink-0 mt-1">
                                        <img
                                          src={companyInfo.logo}
                                          alt="Company Logo"
                                          className="h-14 w-auto object-contain"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="border border-gray-300 rounded-md p-3">
                                  <h3 className="font-bold text-base mb-2">
                                    بيانات المشتري:
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
                              </section>
                            </>
                          ) : (
                            <>
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
                                    {isReturn
                                      ? "فاتورة ضريبية"
                                      : !originalIsVatEnabled
                                      ? "فاتورة مبيعات"
                                      : customer?.taxNumber
                                      ? "فاتورة ضريبية"
                                      : "فاتورة ضريبية مبسطة"}
                                  </h1>
                                  <p>
                                    {isReturn && (
                                      <span className="text-sm text-gray-700">
                                        إشغار مدين
                                      </span>
                                    )}{" "}
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
                                    {paymentMethod === "cash" ? "نقدا" : "اجل"}
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
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "5%" }}>
                              م
                            </th>
                            <th className="p-2 border border-blue-300 text-right" style={{ width: "22%" }}>
                              الصنف
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "8%" }}>
                              الوحدة
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "8%" }}>
                              الكمية
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "10%" }}>
                              السعر
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "12%" }}>
                              المبلغ الخاضع للضريبة
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "8%" }}>
                              خصومات
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "8%" }}>
                              نسبة الضريبة
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "10%" }}>
                              {originalIsVatEnabled ? `الضريبة (${vatRate}%)` : "الضريبة"}
                            </th>
                            <th className="p-2 border border-blue-300 text-center" style={{ width: "13%" }}>
                              الإجمالي
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {pageItems.map((item, index) => {
                            const taxable = item.price * item.qty;
                            const taxAmount = item.taxAmount || 0;
                            const lineDiscount = 0;
                            const lineTotal = originalIsVatEnabled ? taxable + taxAmount : taxable;
                            return (
                              <tr key={index}>
                                <td className="p-2 border border-gray-300 text-center">
                                  {rowNumberOffset + index + 1}
                                </td>
                                <td className="p-2 border border-gray-300 text-right">
                                  {item.name}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {item.unit || "-"}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {item.qty}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {formatMoney(item.price)}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {formatMoney(taxable)}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {formatMoney(lineDiscount)}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {originalIsVatEnabled ? `${vatRate}%` : "0%"}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {formatMoney(taxAmount)}
                                </td>
                                <td className="p-2 border border-gray-300 text-center">
                                  {formatMoney(lineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {isLastPage ? (
                        <>
                          <section className="flex justify-between items-start mt-4 gap-4">
                            <div className="w-1/2">
                              {originalIsVatEnabled && qrData && (
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
                                  {originalIsVatEnabled && (
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
        ) : (
          <div className={`overflow-y-auto flex justify-center items-start bg-gray-200 h-full ${
            template === "epson" ? "p-4" : "p-8"
          }`}>
            <iframe
              srcDoc={
                template === "thermal"
                  ? renderThermalTemplate()
                  : template === "epson"
                  ? renderEpsonTemplateWithPreview()
                  : template === "classic"
                  ? renderClassicTemplate()
                  : template === "modern"
                  ? renderModernTemplate()
                  : template === "minimal"
                  ? renderMinimalTemplate()
                  : renderDefaultTemplate()
              }
              className={`bg-white shadow-2xl ${
                isThermal ? "h-[600px]" : "w-[210mm] min-h-[297mm]"
              } border-none`}
              style={
                template === "epson" && settings.epsonSettings?.pageWidth
                  ? { 
                      width: `${settings.epsonSettings.pageWidth}mm`,
                      maxWidth: `${settings.epsonSettings.pageWidth}mm`,
                      minWidth: `${settings.epsonSettings.pageWidth}mm`,
                      height: "600px",
                      flexShrink: 0
                    }
                  : isThermal
                  ? { width: "80mm", maxWidth: "80mm", minWidth: "80mm" }
                  : undefined
              }
              title="Print Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePrintPreview;
