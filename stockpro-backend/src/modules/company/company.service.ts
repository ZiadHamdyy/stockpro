import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../configs/database/database.service';
import { UpsertCompanyRequest } from './dtos/request/upsert-company.request';
import { CompanyResponse } from './dtos/response/company.response';
import {
  base64ToBuffer,
  bufferToDataUri,
} from '../../common/utils/image-converter';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: DatabaseService) {}

  async getCompany(companyId: string): Promise<CompanyResponse> {
    // Get the first (and only) company record
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company data not found');
    }

    return this.mapToResponse(company);
  }

  async findByHost(host: string) {
    const company = await this.prisma.company.findUnique({
      where: { host },
    });

    if (!company) {
      throw new NotFoundException(`Company not found for host: ${host}`);
    }

    return company;
  }

  async findFirstCompany() {
    const company = await this.prisma.company.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      throw new NotFoundException('No company found');
    }

    return company;
  }

  async upsertCompany(companyId: string, data: UpsertCompanyRequest): Promise<CompanyResponse> {
    // Try to find existing company
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    // Prepare data with logo conversion
    const companyData = {
      ...data,
      logo: data.logo ? base64ToBuffer(data.logo) : null,
    };

    let company;

    if (existingCompany) {
      // Update existing company
      company = await this.prisma.company.update({
        where: { id: companyId },
        data: companyData,
      });
    } else {
      // Create new company - host is required for new companies
      if (!data.host) {
        throw new NotFoundException('Host is required when creating a new company');
      }
      company = await this.prisma.company.create({
        data: {
          ...companyData,
          host: data.host,
        },
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
      logo: company.logo ? bufferToDataUri(company.logo) : null,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
