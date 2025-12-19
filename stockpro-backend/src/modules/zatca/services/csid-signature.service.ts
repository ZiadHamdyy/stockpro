import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignedXml } from 'xml-crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CsidSignatureService {
  private certPath: string;
  private certPassword: string;

  constructor(private readonly configService: ConfigService) {
    this.certPath = this.configService.get<string>('ZATCA_CSID_CERT_PATH') || '';
    this.certPassword = this.configService.get<string>('ZATCA_CSID_CERT_PASSWORD') || '';
  }

  /**
   * Sign XML with CSID certificate using XML-DSig
   * @param xmlString XML string to sign
   * @returns Signed XML string
   */
  async signXml(xmlString: string): Promise<string> {
    if (!this.certPath) {
      throw new Error('ZATCA_CSID_CERT_PATH is not configured');
    }

    // Load certificate
    const certBuffer = fs.readFileSync(this.certPath);
    const keyBuffer = certBuffer; // For PKCS12, key and cert are in same file

    // Create signed XML
    const signedXml = new SignedXml();
    
    // Add reference to the invoice element
    signedXml.addReference(
      "//*[local-name(.)='Invoice']",
      [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],
      'http://www.w3.org/2001/04/xmlenc#sha256',
    );

    // Signing options
    signedXml.signingKey = keyBuffer;
    signedXml.keyInfoProvider = {
      getKey: () => {
        return keyBuffer;
      },
      getKeyInfo: (key, prefix) => {
        prefix = prefix || '';
        prefix = prefix ? prefix + ':' : prefix;
        return `<${prefix}X509Data><${prefix}X509Certificate>${this.getCertificateFromPkcs12(certBuffer)}</${prefix}X509Certificate></${prefix}X509Data>`;
      },
    };

    // Compute signature
    signedXml.computeSignature(xmlString, {
      location: {
        reference: "//*[local-name(.)='UBLExtensions']",
        action: 'after',
      },
    });

    return signedXml.getSignedXml();
  }

  /**
   * Extract certificate from PKCS12 format
   * @param pkcs12Buffer PKCS12 certificate buffer
   * @returns Base64 encoded certificate
   */
  private getCertificateFromPkcs12(pkcs12Buffer: Buffer): string {
    // This is a simplified version - in production, you should use node-forge or similar
    // to properly extract the certificate from PKCS12
    // For now, we'll assume the certificate is provided separately or in a different format
    // This needs to be implemented based on the actual certificate format provided by ZATCA
    
    // Placeholder: In production, use node-forge to extract certificate
    // const forge = require('node-forge');
    // const p12Asn1 = forge.asn1.fromDer(pkcs12Buffer.toString('binary'));
    // const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.certPassword);
    // const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
    // const cert = certBag.cert;
    // return forge.pki.certificateToPem(cert).replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\r?\n/g, '');
    
    // For now, return empty string - this needs proper implementation
    return '';
  }

  /**
   * Verify if certificate path exists and is accessible
   * @returns true if certificate is accessible
   */
  isCertificateAvailable(): boolean {
    if (!this.certPath) {
      return false;
    }

    try {
      const fullPath = path.isAbsolute(this.certPath)
        ? this.certPath
        : path.join(process.cwd(), this.certPath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }
}

