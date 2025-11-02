// Declare global variables from CDN scripts to satisfy TypeScript
declare var XLSX: any;
declare var jspdf: any;
// Lazy import to avoid circular deps if any
let getAuthToken = (): string | null => {
  try {
    // Prefer Redux store if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { store } = require('../components/store/store');
    const state = store?.getState?.();
    const tokenFromStore = state?.auth?.token as string | undefined;
    if (tokenFromStore) return tokenFromStore;
  } catch {}
  try {
    // Fallback to redux-persist key for auth slice
    const persistedAuth = localStorage.getItem('persist:auth');
    if (persistedAuth) {
      const parsed = JSON.parse(persistedAuth);
      // In redux-persist, each field may be a JSON-stringified value
      let t: any = parsed?.token;
      if (typeof t === 'string') {
        // If it looks JSON-encoded (wrapped in quotes or JSON), try to parse
        try {
          const maybe = JSON.parse(t);
          if (typeof maybe === 'string') t = maybe;
        } catch {}
        // Strip accidental wrapping quotes
        if (t.startsWith('"') && t.endsWith('"')) {
          t = t.slice(1, -1);
        }
        if (typeof t === 'string' && t.length > 0) return t;
      }
    }
  } catch {}
  return null;
};

// Client-side embedded font is no longer used (server-side PDF).
const amiriFontBase64 = "";

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formats a number as currency with commas and 2 decimal places for money display.
 * Example: 1000000 -> "1,000,000.00"
 * @param num The number to format
 * @returns Formatted string with commas and 2 decimal places
 */
export const formatMoney = (num: number): string => {
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
 * Exports data to a PDF file via backend Puppeteer service (Arabic/RTL supported).
 * @param title The title of the report.
 * @param columns The columns for the table header.
 * @param body The data for the table body.
 * @param fileName The name of the file to create (without extension).
 * @param companyInfo Optional company info for the header.
 * @param footerRows Optional rows for the table footer (for totals).
 */
export const exportToPdf = async (
  title: string,
  columns: any[][],
  body: any[],
  fileName: string,
  companyInfo?: any,
  footerRows?: any[][],
): Promise<void> => {
  try {
    const baseUrl = (import.meta as any).env?.VITE_BASE_BACK_URL || "http://localhost:4000/api/v1";

    const token = getAuthToken();

    const resp = await fetch(`${baseUrl}/report-pdf/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, columns, body, fileName, companyInfo, footerRows }),
    });
    if (!resp.ok) throw new Error(`PDF export failed: ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export to PDF:", error);
    alert("حدث خطأ أثناء تصدير ملف PDF.");
  }
};
