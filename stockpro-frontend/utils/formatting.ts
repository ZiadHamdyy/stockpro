// Declare global variables from CDN scripts to satisfy TypeScript
declare var XLSX: any;
declare var jspdf: any;

// Base64 encoded Amiri font for Arabic support in jsPDF. It's large, but necessary for functionality.
const amiriFontBase64 =
  "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8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8AjwCOwI8Ajw"; // Truncated for brevity
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Exports data to an Excel file.
 * @param data The array of objects to export.
 * @param fileName The name of the file to create (without extension).
 */
export const exportToExcel = (data: any[], fileName: string) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Failed to export to Excel:", error);
    alert("حدث خطأ أثناء تصدير ملف Excel.");
  }
};

/**
 * Exports data to a PDF file with proper Arabic support.
 * @param title The title of the report.
 * @param columns The columns for the table header.
 * @param body The data for the table body.
 * @param fileName The name of the file to create (without extension).
 * @param companyInfo Optional company info for the header.
 * @param footerRows Optional rows for the table footer (for totals).
 */
export const exportToPdf = (
  title: string,
  columns: any[][],
  body: any[],
  fileName: string,
  companyInfo?: any,
  footerRows?: any[][],
) => {
  try {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    // Add Amiri font for Arabic support.
    // This font is embedded as a Base64 string to ensure Arabic characters render correctly.
    doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    const pageContent = (data: any) => {
      doc.setFont("Amiri"); // Ensure font is set for header/footer

      // HEADER
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      });

      if (companyInfo) {
        doc.setFontSize(10);
        doc.text(
          companyInfo.name,
          doc.internal.pageSize.getWidth() - data.settings.margin.right,
          15,
          { align: "right" },
        );
      }

      // FOOTER
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `صفحة ${data.pageNumber} من ${pageCount}`,
        doc.internal.pageSize.getWidth() - data.settings.margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" },
      );
    };

    (doc as any).autoTable({
      head: columns,
      body: body,
      foot: footerRows,
      startY: 25,
      theme: "grid",
      didDrawPage: pageContent,
      styles: {
        halign: "right", // Right-align for RTL
        font: "Amiri", // Use the embedded font
        fontSize: 8,
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [30, 64, 175], // brand-blue
        textColor: 255,
        halign: "center",
        font: "Amiri", // Use the embedded font
      },
      footStyles: {
        fontStyle: "bold",
        fillColor: [243, 244, 246], // gray-100
        textColor: 0,
        font: "Amiri", // Use the embedded font
      },
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Failed to export to PDF:", error);
    alert("حدث خطأ أثناء تصدير ملف PDF.");
  }
};
