import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../configs/database/database.service';
import { SequentialNumberService } from './services/sequential-number.service';
import { HashChainService } from './services/hash-chain.service';
import { UblXmlGeneratorService } from './services/ubl-xml-generator.service';
import { CsidSignatureService } from './services/csid-signature.service';
import { ZatcaApiService } from './services/zatca-api.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { ZatcaStatus } from '@prisma/client';
@Injectable()
export class ZatcaService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly sequentialNumberService: SequentialNumberService,
    private readonly hashChainService: HashChainService,
    private readonly ublXmlGeneratorService: UblXmlGeneratorService,
    private readonly csidSignatureService: CsidSignatureService,
    private readonly zatcaApiService: ZatcaApiService,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  /**
   * Check if ZATCA is properly configured
   * @returns true if ZATCA can be processed
   */
  isZatcaConfigured(): boolean {
    // ZATCA can work without API credentials (for local processing)
    // But we need at least the certificate for signing
    return this.csidSignatureService.isCertificateAvailable();
  }

  /**
   * Process invoice for ZATCA compliance
   * Generates UUID, sequential number, XML, hash, and signs XML
   * @param invoiceId Invoice ID
   * @returns Processed invoice data
   */
  async processInvoiceForZatca(invoiceId: string): Promise<{
    uuid: string;
    sequentialNumber: number;
    xml: string;
    signedXml: string;
    hash: string;
  }> {
    // Get invoice with related data
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    // Check if VAT is enabled
    if (!invoice.company.isVatEnabled) {
      throw new HttpException(
        'VAT is not enabled for this company',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate UUID if not exists (ZATCA requires UUID v4 format)
    let uuid = invoice.zatcaUuid;
    if (!uuid) {
      uuid = randomUUID();
    }

    // Generate sequential number if not exists
    let sequentialNumber = invoice.zatcaSequentialNumber;
    if (!sequentialNumber) {
      sequentialNumber = await this.sequentialNumberService.generateNext(
        invoice.companyId,
      );
    }

    // Get previous hash for hash chain
    const previousHash = await this.hashChainService.getPreviousHash(
      invoice.companyId,
    );

    // Get issue date/time (use zatcaIssueDateTime if exists, otherwise use current UTC)
    const issueDateTime = invoice.zatcaIssueDateTime || new Date();

    // Generate UBL XML
    const xml = await this.ublXmlGeneratorService.generate({
      id: invoice.id,
      zatcaUuid: uuid,
      zatcaSequentialNumber: sequentialNumber,
      zatcaIssueDateTime: issueDateTime,
      code: invoice.code,
      date: invoice.date,
      company: {
        name: invoice.company.name,
        taxNumber: invoice.company.taxNumber,
        commercialReg: invoice.company.commercialReg,
        address: invoice.company.address,
        phone: invoice.company.phone,
        vatRate: invoice.company.vatRate,
      },
      customer: invoice.customer
        ? {
            name: invoice.customer.name,
            taxNumber: invoice.customer.taxNumber,
            commercialReg: invoice.customer.commercialReg,
            nationalAddress: invoice.customer.nationalAddress,
            phone: invoice.customer.phone,
          }
        : undefined,
      items: invoice.items as Array<{
        id: string;
        name: string;
        unit: string;
        qty: number;
        price: number;
        taxAmount?: number;
        total?: number;
      }>,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      net: invoice.net,
      previousHash,
    });

    // Sign XML with CSID certificate (if available)
    let signedXml: string;
    if (this.csidSignatureService.isCertificateAvailable()) {
      try {
        signedXml = await this.csidSignatureService.signXml(xml);
      } catch (error: any) {
        // If signing fails, use unsigned XML (for development/testing)
        console.warn(`ZATCA certificate signing failed: ${error.message}. Using unsigned XML.`);
        signedXml = xml;
      }
    } else {
      // Certificate not configured, use unsigned XML
      console.warn('ZATCA certificate not configured. Using unsigned XML.');
      signedXml = xml;
    }

    // Calculate hash
    const hash = this.hashChainService.calculateHash(signedXml);

    // Update invoice with ZATCA data
    await this.prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        zatcaUuid: uuid,
        zatcaSequentialNumber: sequentialNumber,
        zatcaIssueDateTime: issueDateTime,
        zatcaHash: hash,
        zatcaPreviousHash: previousHash,
        zatcaStatus: ZatcaStatus.PENDING,
      },
    });

    return {
      uuid,
      sequentialNumber,
      xml,
      signedXml,
      hash,
    };
  }

  /**
   * Submit invoice to ZATCA API
   * @param invoiceId Invoice ID
   * @returns ZATCA API response
   */
  async submitToZatca(invoiceId: string): Promise<any> {
    // Process invoice if not already processed
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    let signedXml: string;

    // If invoice is not processed yet, process it first
    if (!invoice.zatcaUuid || !invoice.zatcaHash) {
      const processed = await this.processInvoiceForZatca(invoiceId);
      signedXml = processed.signedXml;
    } else {
      // Get signed XML from stored data or regenerate
      // For now, we'll regenerate it (in production, you might want to store it)
      const processed = await this.processInvoiceForZatca(invoiceId);
      signedXml = processed.signedXml;
    }

    // Submit to ZATCA API (only if configured)
    let response: any;
    let status: ZatcaStatus = ZatcaStatus.REJECTED;
    let responseMessage: string = '';

    if (!this.zatcaApiService.isConfigured()) {
      status = ZatcaStatus.PENDING;
      responseMessage = 'ZATCA API not configured. Invoice processed locally.';
      response = { message: 'ZATCA API not configured' };
    } else {
      try {
        response = await this.zatcaApiService.submitInvoice(signedXml);

      // Check response status
      if (response.reportingStatus === 'REPORTED' || response.validationResults?.errorMessages?.length === 0) {
        status = ZatcaStatus.ACCEPTED;
        responseMessage = 'Invoice successfully submitted to ZATCA';
      } else {
        status = ZatcaStatus.REJECTED;
        responseMessage =
          response.validationResults?.errorMessages?.join(', ') ||
          'Invoice submission failed';
      }
      } catch (error: any) {
        status = ZatcaStatus.REJECTED;
        responseMessage = error.message || 'Failed to submit invoice to ZATCA';
        response = { error: error.message };
      }
    }

    // Update invoice with submission result
    await this.prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        zatcaStatus: status,
        zatcaSubmittedAt: new Date(),
        zatcaResponseXml: JSON.stringify(response),
        zatcaResponseMessage: responseMessage,
      },
    });

    return {
      status,
      message: responseMessage,
      response,
    };
  }

  /**
   * Get ZATCA status for an invoice
   * @param invoiceId Invoice ID
   * @returns ZATCA status
   */
  async getZatcaStatus(invoiceId: string): Promise<{
    status: ZatcaStatus;
    uuid?: string;
    sequentialNumber?: number;
    hash?: string;
    submittedAt?: Date;
    responseMessage?: string;
  }> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        zatcaStatus: true,
        zatcaUuid: true,
        zatcaSequentialNumber: true,
        zatcaHash: true,
        zatcaSubmittedAt: true,
        zatcaResponseMessage: true,
      },
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: invoice.zatcaStatus || ZatcaStatus.PENDING,
      uuid: invoice.zatcaUuid || undefined,
      sequentialNumber: invoice.zatcaSequentialNumber || undefined,
      hash: invoice.zatcaHash || undefined,
      submittedAt: invoice.zatcaSubmittedAt || undefined,
      responseMessage: invoice.zatcaResponseMessage || undefined,
    };
  }

  /**
   * Regenerate XML for an invoice
   * @param invoiceId Invoice ID
   * @returns Regenerated XML
   */
  async regenerateXml(invoiceId: string): Promise<string> {
    const processed = await this.processInvoiceForZatca(invoiceId);
    return processed.xml;
  }

  /**
   * Get signed XML for an invoice
   * @param invoiceId Invoice ID
   * @returns Signed XML
   */
  async getSignedXml(invoiceId: string): Promise<string> {
    const processed = await this.processInvoiceForZatca(invoiceId);
    return processed.signedXml;
  }

  /**
   * Generate PDF/A-3 for an invoice
   * @param invoiceId Invoice ID
   * @returns PDF buffer
   */
  async generatePdfA3(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    // Get signed XML
    const signedXml = await this.getSignedXml(invoiceId);

    // Generate PDF
    const pdfBuffer = await this.pdfGeneratorService.generatePdfA3(
      signedXml,
      {
        code: invoice.code,
        date: invoice.date,
        company: {
          name: invoice.company.name,
        },
        customer: invoice.customer
          ? {
              name: invoice.customer.name,
            }
          : undefined,
        items: invoice.items as Array<{
          name: string;
          qty: number;
          price: number;
          total?: number;
        }>,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        net: invoice.net,
      },
    );

    return pdfBuffer;
  }
}

