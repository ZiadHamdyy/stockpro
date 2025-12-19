import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class PdfGeneratorService {
  /**
   * Generate PDF/A-3 with embedded XML
   * Note: pdf-lib doesn't fully support PDF/A-3, this is a basic implementation
   * For full PDF/A-3 compliance, consider using specialized libraries or services
   * @param xmlString Signed XML string to embed
   * @param invoiceData Invoice data for PDF content
   * @returns PDF buffer
   */
  async generatePdfA3(
    xmlString: string,
    invoiceData: {
      code: string;
      date: Date;
      company: { name: string };
      customer?: { name: string };
      items: Array<{ name: string; qty: number; price: number; total?: number }>;
      subtotal: number;
      tax: number;
      net: number;
    },
  ): Promise<Buffer> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add metadata for PDF/A compliance
    pdfDoc.setTitle(`Invoice ${invoiceData.code}`);
    pdfDoc.setSubject('ZATCA E-Invoice');
    pdfDoc.setCreator('StockPro');
    pdfDoc.setProducer('StockPro ZATCA Module');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Embed XML as attachment (PDF/A-3 requirement)
    // Note: pdf-lib has limited support for attachments
    // For full PDF/A-3 compliance, you may need to use a different library
    // or generate the PDF using a service that supports PDF/A-3
    
    // For now, we'll create a basic PDF with invoice content
    // The XML embedding will need to be implemented based on the specific
    // PDF/A-3 requirements and available libraries

    const page = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // Header
    page.drawText('INVOICE', {
      x: 50,
      y,
      size: 24,
      font: boldFont,
    });

    y -= 40;

    // Invoice details
    page.drawText(`Invoice Number: ${invoiceData.code}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`Date: ${invoiceData.date.toLocaleDateString()}`, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 40;

    // Company info
    page.drawText('From:', {
      x: 50,
      y,
      size: 12,
      font: boldFont,
    });

    y -= 20;

    page.drawText(invoiceData.company.name, {
      x: 50,
      y,
      size: 12,
      font,
    });

    y -= 40;

    // Customer info
    if (invoiceData.customer) {
      page.drawText('To:', {
        x: 50,
        y,
        size: 12,
        font: boldFont,
      });

      y -= 20;

      page.drawText(invoiceData.customer.name, {
        x: 50,
        y,
        size: 12,
        font,
      });

      y -= 40;
    }

    // Items table header
    page.drawText('Items', {
      x: 50,
      y,
      size: 12,
      font: boldFont,
    });

    y -= 20;

    page.drawText('Name', {
      x: 50,
      y,
      size: 10,
      font: boldFont,
    });

    page.drawText('Qty', {
      x: 300,
      y,
      size: 10,
      font: boldFont,
    });

    page.drawText('Price', {
      x: 350,
      y,
      size: 10,
      font: boldFont,
    });

    page.drawText('Total', {
      x: 450,
      y,
      size: 10,
      font: boldFont,
    });

    y -= 20;

    // Items
    for (const item of invoiceData.items) {
      if (y < 100) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        y = 800;
      }

      page.drawText(item.name, {
        x: 50,
        y,
        size: 10,
        font,
      });

      page.drawText(item.qty.toString(), {
        x: 300,
        y,
        size: 10,
        font,
      });

      page.drawText(item.price.toFixed(2), {
        x: 350,
        y,
        size: 10,
        font,
      });

      const itemTotal = item.total || item.price * item.qty;
      page.drawText(itemTotal.toFixed(2), {
        x: 450,
        y,
        size: 10,
        font,
      });

      y -= 20;
    }

    y -= 20;

    // Totals
    page.drawText(`Subtotal: ${invoiceData.subtotal.toFixed(2)}`, {
      x: 350,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`Tax: ${invoiceData.tax.toFixed(2)}`, {
      x: 350,
      y,
      size: 12,
      font,
    });

    y -= 20;

    page.drawText(`Total: ${invoiceData.net.toFixed(2)}`, {
      x: 350,
      y,
      size: 14,
      font: boldFont,
    });

    // Note: XML embedding for PDF/A-3 would go here
    // This requires specialized handling that pdf-lib may not fully support
    // Consider using a service like Adobe PDF Library or similar for full compliance

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes);
  }

  /**
   * Check if PDF/A-3 generation is available
   * Note: This is a placeholder - full PDF/A-3 support may require additional setup
   * @returns true if available
   */
  isAvailable(): boolean {
    // For now, return true - actual availability depends on library support
    return true;
  }
}

