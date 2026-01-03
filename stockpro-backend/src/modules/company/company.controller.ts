import { Controller, Get, Put, Post, Delete, Body, Query, UseGuards, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyResponse } from './dtos/response/company.response';
import { UpsertCompanyRequest } from './dtos/request/upsert-company.request';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from 'src/common/decorators/company.decorator';

@Controller('company')
@UseGuards(JwtAuthenticationGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('all')
  @Auth({ permissions: ['subscription:read'] })
  async getAllCompanies(): Promise<CompanyResponse[]> {
    return this.companyService.getAllCompanies();
  }

  @Get()
  @Auth({ permissions: ['company_data:read'] })
  async getCompany(@currentCompany('id') companyId: string): Promise<CompanyResponse> {
    return this.companyService.getCompany(companyId);
  }

  @Post()
  @Auth({ permissions: ['subscription:create'] })
  async createCompany(@Body() data: UpsertCompanyRequest): Promise<CompanyResponse> {
    return this.companyService.createCompany(data);
  }

  @Post('create-with-seed')
  @Auth({ permissions: ['subscription:create'] })
  async createCompanyWithSeed(
    @Body() body: {
      code?: string;
      planType?: 'BASIC' | 'GROWTH' | 'BUSINESS';
      startDate?: string;
      endDate?: string;
    },
  ): Promise<CompanyResponse> {
    const startDate = body.startDate ? new Date(body.startDate) : undefined;
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    return this.companyService.createCompanyWithSeed(
      body.code,
      body.planType,
      startDate,
      endDate,
    );
  }

  @Put()
  @Auth({ permissions: ['company_data:update'] })
  async upsertCompany(
    @Body() data: UpsertCompanyRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CompanyResponse> {
    return this.companyService.upsertCompany(companyId, data);
  }

  @Get('financial-settings')
  @Auth({ permissions: ['financial_system:read'] })
  async getFinancialSettings(@currentCompany('id') companyId: string): Promise<any> {
    return this.companyService.getFinancialSettings(companyId);
  }

  @Put('financial-settings')
  @Auth({ permissions: ['financial_system:update'] })
  async updateFinancialSettings(
    @Body() financialSettings: any,
    @currentCompany('id') companyId: string,
  ): Promise<any> {
    return this.companyService.updateFinancialSettings(companyId, financialSettings);
  }

  @Get('print-settings')
  @Auth({ permissions: ['print_settings:read'] })
  async getPrintSettings(@currentCompany('id') companyId: string): Promise<any> {
    return this.companyService.getPrintSettings(companyId);
  }

  @Put('print-settings')
  @Auth({ permissions: ['print_settings:update'] })
  async updatePrintSettings(
    @Body() printSettings: any,
    @currentCompany('id') companyId: string,
  ): Promise<any> {
    return this.companyService.updatePrintSettings(companyId, printSettings);
  }

  @Delete(':id')
  @Auth({ permissions: ['subscription:delete'] })
  async deleteCompany(@Param('id') companyId: string): Promise<{ message: string }> {
    await this.companyService.deleteCompany(companyId);
    return { message: 'Company deleted successfully' };
  }
  
}
