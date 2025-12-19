import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { DatabaseService } from '../../../configs/database/database.service';

interface InvoiceData {
  id: string;
  zatcaUuid: string;
  zatcaSequentialNumber: number;
  zatcaIssueDateTime: Date;
  code: string;
  date: Date;
  company: {
    name: string;
    taxNumber: string;
    commercialReg: string;
    address: string;
    phone: string;
    vatRate: number;
  };
  customer?: {
    name: string;
    taxNumber: string;
    commercialReg: string;
    nationalAddress: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    unit: string;
    qty: number;
    price: number;
    taxAmount?: number;
    total?: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  net: number;
  previousHash?: string | null;
}

@Injectable()
export class UblXmlGeneratorService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Generate UBL 2.1 compliant XML for ZATCA
   * @param invoiceData Invoice data with all required fields
   * @returns UBL 2.1 XML string
   */
  async generate(invoiceData: InvoiceData): Promise<string> {
    const {
      zatcaUuid,
      zatcaSequentialNumber,
      zatcaIssueDateTime,
      code,
      company,
      customer,
      items,
      subtotal,
      discount,
      tax,
      net,
      previousHash,
    } = invoiceData;

    // Format date in ISO 8601 format (UTC)
    const issueDate = zatcaIssueDateTime.toISOString().split('T')[0];
    const issueTime = zatcaIssueDateTime.toISOString().split('T')[1].split('.')[0] + 'Z';

    // Calculate line totals
    const invoiceLines = items.map((item, index) => {
      const lineExtensionAmount = (item.total || item.price * item.qty) - (item.taxAmount || 0);
      const taxExclusivePrice = item.price;
      const taxInclusivePrice = item.price + ((item.taxAmount || 0) / item.qty);
      const taxAmount = item.taxAmount || 0;

      return {
        id: (index + 1).toString(),
        note: item.name,
        invoicedQuantity: {
          unitCode: this.mapUnitCode(item.unit),
          value: item.qty.toString(),
        },
        lineExtensionAmount: {
          currencyID: 'SAR',
          value: lineExtensionAmount.toFixed(2),
        },
        taxTotal: {
          taxAmount: {
            currencyID: 'SAR',
            value: taxAmount.toFixed(2),
          },
        },
        item: {
          name: item.name,
          classifiedTaxCategory: {
            id: 'S',
            percent: company.vatRate.toFixed(2),
            taxScheme: {
              id: 'VAT',
            },
          },
          price: {
            priceAmount: {
              currencyID: 'SAR',
              value: taxExclusivePrice.toFixed(2),
            },
          },
        },
      };
    });

    // Build UBL 2.1 XML
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('Invoice', {
        xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      });

    // UBLExtensions (for ZATCA)
    root.ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
        .ele('ext:ExtensionContent');

    // Invoice identification
    root.ele('cbc:CustomizationID', 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0');
    root.ele('cbc:ProfileID', 'reporting:1.0');
    root.ele('cbc:ID', code);
    root.ele('cbc:UUID', zatcaUuid);
    root.ele('cbc:IssueDate', issueDate);
    root.ele('cbc:IssueTime', issueTime);
    root.ele('cbc:InvoiceTypeCode', '388'); // Standard invoice
    root.ele('cbc:DocumentCurrencyCode', 'SAR');
    root.ele('cbc:TaxCurrencyCode', 'SAR');

    // Invoice period (if applicable)
    root.ele('cac:InvoicePeriod')
      .ele('cbc:StartDate', issueDate)
      .up()
      .ele('cbc:EndDate', issueDate);

    // Additional document reference for sequential number
    root.ele('cac:AdditionalDocumentReference')
      .ele('cbc:ID', zatcaSequentialNumber.toString())
      .up()
      .ele('cbc:DocumentType', '388');

    // Previous invoice hash (if exists)
    if (previousHash) {
      root.ele('cac:AdditionalDocumentReference')
        .ele('cbc:ID', previousHash)
        .up()
        .ele('cbc:DocumentType', 'Previous Invoice Hash');
    }

    // Accounting supplier party (company)
    const supplierParty = root.ele('cac:AccountingSupplierParty');
    const supplierPartyParty = supplierParty.ele('cac:Party');
    
    // Supplier party identification
    supplierPartyParty.ele('cac:PartyIdentification')
      .ele('cbc:ID', company.taxNumber);
    
    // Supplier party name
    supplierPartyParty.ele('cac:PartyName')
      .ele('cbc:Name', company.name);
    
    // Supplier postal address
    const supplierPostalAddress = supplierPartyParty.ele('cac:PostalAddress');
    supplierPostalAddress.ele('cbc:StreetName', company.address);
    supplierPostalAddress.ele('cbc:CityName', 'Riyadh'); // Default, should be configurable
    supplierPostalAddress.ele('cbc:PostalZone', '');
    supplierPostalAddress.ele('cac:Country')
      .ele('cbc:IdentificationCode', 'SA');
    
    // Supplier party tax scheme
    supplierPartyParty.ele('cac:PartyTaxScheme')
      .ele('cbc:CompanyID', company.taxNumber)
      .up()
      .ele('cac:TaxScheme')
        .ele('cbc:ID', 'VAT');
    
    // Supplier party legal entity
    supplierPartyParty.ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName', company.name)
      .up()
      .ele('cac:CompanyID', company.commercialReg);
    
    // Supplier contact
    supplierPartyParty.ele('cac:Contact')
      .ele('cbc:Telephone', company.phone);

    // Accounting customer party (if customer exists)
    if (customer) {
      const customerParty = root.ele('cac:AccountingCustomerParty');
      const customerPartyParty = customerParty.ele('cac:Party');
      
      // Customer party identification
      customerPartyParty.ele('cac:PartyIdentification')
        .ele('cbc:ID', customer.taxNumber || 'N/A');
      
      // Customer party name
      customerPartyParty.ele('cac:PartyName')
        .ele('cbc:Name', customer.name);
      
      // Customer postal address
      const customerPostalAddress = customerPartyParty.ele('cac:PostalAddress');
      customerPostalAddress.ele('cbc:StreetName', customer.nationalAddress);
      customerPostalAddress.ele('cbc:CityName', 'Riyadh'); // Default
      customerPostalAddress.ele('cbc:PostalZone', '');
      customerPostalAddress.ele('cac:Country')
        .ele('cbc:IdentificationCode', 'SA');
      
      // Customer party tax scheme
      if (customer.taxNumber && customer.taxNumber !== 'N/A') {
        customerPartyParty.ele('cac:PartyTaxScheme')
          .ele('cbc:CompanyID', customer.taxNumber)
          .up()
          .ele('cac:TaxScheme')
            .ele('cbc:ID', 'VAT');
      }
      
      // Customer party legal entity
      customerPartyParty.ele('cac:PartyLegalEntity')
        .ele('cbc:RegistrationName', customer.name);
      
      // Customer contact
      customerPartyParty.ele('cac:Contact')
        .ele('cbc:Telephone', customer.phone);
    } else {
      // Simplified customer party for B2C
      const customerParty = root.ele('cac:AccountingCustomerParty');
      const customerPartyParty = customerParty.ele('cac:Party');
      customerPartyParty.ele('cac:PartyName')
        .ele('cbc:Name', 'Simplified Tax Invoice Customer');
    }

    // Invoice lines
    invoiceLines.forEach((line) => {
      const invoiceLine = root.ele('cac:InvoiceLine');
      invoiceLine.ele('cbc:ID', line.id);
      invoiceLine.ele('cbc:Note', line.note);
      invoiceLine.ele('cbc:InvoicedQuantity', line.invoicedQuantity.value, {
        unitCode: line.invoicedQuantity.unitCode,
      });
      invoiceLine.ele('cbc:LineExtensionAmount', line.lineExtensionAmount.value, {
        currencyID: line.lineExtensionAmount.currencyID,
      });
      
      // Tax total for line
      const lineTaxTotal = invoiceLine.ele('cac:TaxTotal');
      lineTaxTotal.ele('cbc:TaxAmount', line.taxTotal.taxAmount.value, {
        currencyID: line.taxTotal.taxAmount.currencyID,
      });
      
      const lineTaxSubtotal = lineTaxTotal.ele('cac:TaxSubtotal');
      lineTaxSubtotal.ele('cbc:TaxableAmount', line.lineExtensionAmount.value, {
        currencyID: line.lineExtensionAmount.currencyID,
      });
      lineTaxSubtotal.ele('cbc:TaxAmount', line.taxTotal.taxAmount.value, {
        currencyID: line.taxTotal.taxAmount.currencyID,
      });
      lineTaxSubtotal.ele('cac:TaxCategory')
        .ele('cbc:ID', 'S')
        .up()
        .ele('cbc:Percent', company.vatRate.toFixed(2))
        .up()
        .ele('cac:TaxScheme')
          .ele('cbc:ID', 'VAT');
      
      // Item
      const item = invoiceLine.ele('cac:Item');
      item.ele('cbc:Name', line.item.name);
      item.ele('cac:ClassifiedTaxCategory')
        .ele('cbc:ID', line.item.classifiedTaxCategory.id)
        .up()
        .ele('cbc:Percent', line.item.classifiedTaxCategory.percent)
        .up()
        .ele('cac:TaxScheme')
          .ele('cbc:ID', line.item.classifiedTaxCategory.taxScheme.id);
      item.ele('cac:Price')
        .ele('cbc:PriceAmount', line.item.price.priceAmount.value, {
          currencyID: line.item.price.priceAmount.currencyID,
        });
    });

    // Tax totals
    const taxTotal = root.ele('cac:TaxTotal');
    taxTotal.ele('cbc:TaxAmount', tax.toFixed(2), { currencyID: 'SAR' });
    
    const taxSubtotal = taxTotal.ele('cac:TaxSubtotal');
    const taxableAmount = subtotal - discount;
    taxSubtotal.ele('cbc:TaxableAmount', taxableAmount.toFixed(2), { currencyID: 'SAR' });
    taxSubtotal.ele('cbc:TaxAmount', tax.toFixed(2), { currencyID: 'SAR' });
    taxSubtotal.ele('cac:TaxCategory')
      .ele('cbc:ID', 'S')
      .up()
      .ele('cbc:Percent', company.vatRate.toFixed(2))
      .up()
      .ele('cac:TaxScheme')
        .ele('cbc:ID', 'VAT');

    // Legal monetary totals
    const legalMonetaryTotal = root.ele('cac:LegalMonetaryTotal');
    legalMonetaryTotal.ele('cbc:LineExtensionAmount', (subtotal - discount).toFixed(2), { currencyID: 'SAR' });
    legalMonetaryTotal.ele('cbc:TaxExclusiveAmount', (subtotal - discount).toFixed(2), { currencyID: 'SAR' });
    legalMonetaryTotal.ele('cbc:TaxInclusiveAmount', net.toFixed(2), { currencyID: 'SAR' });
    legalMonetaryTotal.ele('cbc:AllowanceTotalAmount', discount.toFixed(2), { currencyID: 'SAR' });
    legalMonetaryTotal.ele('cbc:PayableAmount', net.toFixed(2), { currencyID: 'SAR' });

    // Convert to XML string
    return root.end({ prettyPrint: true });
  }

  /**
   * Map unit code to UN/ECE Recommendation 20
   * @param unit Unit name
   * @returns UN/ECE unit code
   */
  private mapUnitCode(unit: string): string {
    const unitMap: Record<string, string> = {
      'piece': 'C62',
      'pcs': 'C62',
      'kg': 'KGM',
      'gram': 'GRM',
      'liter': 'LTR',
      'meter': 'MTR',
      'hour': 'HUR',
      'day': 'DAY',
      'month': 'MON',
      'year': 'ANN',
    };

    const normalizedUnit = unit.toLowerCase().trim();
    return unitMap[normalizedUnit] || 'C62'; // Default to piece
  }
}

