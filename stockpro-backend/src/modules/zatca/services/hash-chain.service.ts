import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DatabaseService } from '../../../configs/database/database.service';

@Injectable()
export class HashChainService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Calculate SHA-256 hash of invoice XML
   * @param xmlString Invoice XML as string
   * @returns SHA-256 hash in hex format
   */
  calculateHash(xmlString: string): string {
    return createHash('sha256').update(xmlString, 'utf8').digest('hex');
  }

  /**
   * Get previous invoice hash for hash chain
   * @param companyId Company ID
   * @returns Previous invoice hash or null if first invoice
   */
  async getPreviousHash(companyId: string): Promise<string | null> {
    const previousInvoice = await this.prisma.salesInvoice.findFirst({
      where: {
        companyId,
        zatcaHash: { not: null },
      },
      orderBy: {
        zatcaSequentialNumber: 'desc',
      },
      select: {
        zatcaHash: true,
      },
    });

    return previousInvoice?.zatcaHash || null;
  }

  /**
   * Store hash for an invoice
   * @param invoiceId Invoice ID
   * @param hash Hash to store
   * @param previousHash Previous invoice hash
   */
  async storeHash(
    invoiceId: string,
    hash: string,
    previousHash: string | null,
  ): Promise<void> {
    await this.prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        zatcaHash: hash,
        zatcaPreviousHash: previousHash,
      },
    });
  }
}

