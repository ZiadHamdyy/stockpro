import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { ExportPdfDto } from './dtos/export-pdf.dto.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportPdfService {
  private buildHtml(dto: ExportPdfDto): string {
    const fontCdn =
      'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf';
    const fontUrl = fontCdn;

    const head = dto.columns?.[0] || [];

    const rowsHtml = dto.body
      .map(
        (row: any[]) =>
          `<tr>${row
            .map(
              (cell) =>
                `<td style="padding:8px;border:1px solid #e5e7eb;">${this.escapeHtml(cell?.content ?? cell ?? '')}</td>`,
            )
            .join('')}</tr>`,
      )
      .join('');

    const footHtml = (dto.footerRows || [])
      .map(
        (row: any[]) =>
          `<tr>${row
            .map((cell) => {
              const content =
                cell && typeof cell === 'object' && 'content' in cell
                  ? cell.content
                  : cell;
              return `<td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f3f4f6;">${this.escapeHtml(content ?? '')}</td>`;
            })
            .join('')}</tr>`,
      )
      .join('');

    // Get header color based on theme
    const headerColor =
      dto.colorTheme === 'green'
        ? '#16A34A' // green-600
        : dto.colorTheme === 'amber'
          ? '#F59E0B' // amber-500
          : '#1E40AF'; // blue-700 (default)

    const thead = `<thead><tr>${head
      .map(
        (h: any) =>
          `<th style="padding:8px;border:1px solid #e5e7eb;background:${headerColor};color:#fff;">${this.escapeHtml(h?.content ?? h ?? '')}</th>`,
      )
      .join('')}</tr></thead>`;

    const companyName = dto.companyInfo?.name
      ? `<div class="company">${this.escapeHtml(dto.companyInfo.name)}</div>`
      : '';

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face { font-family: 'Noto Naskh Arabic'; src: url('${fontUrl}') format('truetype'); font-weight: normal; font-style: normal; }
    body { font-family: 'Noto Naskh Arabic', 'Cairo', sans-serif; margin: 0; padding: 16px; color: #111827; }
    header { text-align: center; margin-bottom: 12px; }
    header .title { font-size: 18px; color: #1F2937; font-weight: bold; }
    header .company { font-size: 12px; color: #6B7280; text-align: right; }
    table { width: 100%; border-collapse: collapse; direction: rtl; }
    th, td { font-size: 12px; font-weight: bold; }
    tfoot td { font-weight: bold; background: #f3f4f6; }
    .footer { position: fixed; bottom: 8mm; right: 10mm; font-size: 10px; color: #6B7280; }
  </style>
</head>
<body>
  <header>
    <div class="title">${this.escapeHtml(dto.title)}</div>
    ${companyName}
  </header>
  <main>
    <table>
      ${thead}
      <tbody>${rowsHtml}</tbody>
      ${footHtml ? `<tfoot>${footHtml}</tfoot>` : ''}
    </table>
  </main>
  <div class="footer">صفحة <span class="pageNumber"></span></div>
  <script>
    // Puppeteer will not execute this; page numbers can be added via headerTemplate/footerTemplate in pdf() if needed.
  </script>
</body>
</html>`;
  }

  private escapeHtml(input: any): string {
    const s = String(input ?? '');
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async renderTableReport(dto: ExportPdfDto): Promise<Buffer> {
    const html = this.buildHtml(dto);
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
    const browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--remote-debugging-port=0',
      ],
      executablePath,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      page.setDefaultNavigationTimeout(60000);
      page.setDefaultTimeout(60000);
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '12mm', left: '10mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
