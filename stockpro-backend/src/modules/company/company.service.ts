import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { UpsertCompanyRequest } from './dtos/request/upsert-company.request';
import { CompanyResponse } from './dtos/response/company.response';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: DatabaseService) {}

  async getCompany(): Promise<CompanyResponse> {
    // Get the first (and only) company record
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      throw new NotFoundException('Company data not found');
    }

    return this.mapToResponse(company);
  }

  async upsertCompany(data: UpsertCompanyRequest): Promise<CompanyResponse> {
    // Try to find existing company
    const existingCompany = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    let company;

    if (existingCompany) {
      // Update existing company
      company = await this.prisma.company.update({
        where: { id: existingCompany.id },
        data,
      });
    } else {
      // Create new company
      company = await this.prisma.company.create({
        data,
      });
    }

    return this.mapToResponse(company);
  }

  private mapToResponse(company: any): CompanyResponse {
    return {
      id: company.id,
      name: company.name,
      activity: company.activity,
      address: company.address,
      phone: company.phone,
      taxNumber: company.taxNumber,
      commercialReg: company.commercialReg,
      currency: company.currency,
      capital: company.capital,
      vatRate: company.vatRate,
      isVatEnabled: company.isVatEnabled,
      logoPath: company.logoPath,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}

