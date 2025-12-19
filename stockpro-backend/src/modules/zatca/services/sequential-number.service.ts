import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../configs/database/database.service';

@Injectable()
export class SequentialNumberService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Generate next sequential number for a company
   * Sequential numbers must be unique per company and sequential
   * @param companyId Company ID
   * @returns Next sequential number
   */
  async generateNext(companyId: string): Promise<number> {
    // Get the last sequential number for this company
    const lastInvoice = await this.prisma.salesInvoice.findFirst({
      where: {
        companyId,
        zatcaSequentialNumber: { not: null },
      },
      orderBy: {
        zatcaSequentialNumber: 'desc',
      },
      select: {
        zatcaSequentialNumber: true,
      },
    });

    // If no previous invoice exists, start from 1
    if (!lastInvoice || !lastInvoice.zatcaSequentialNumber) {
      return 1;
    }

    // Return next sequential number
    return lastInvoice.zatcaSequentialNumber + 1;
  }
}

