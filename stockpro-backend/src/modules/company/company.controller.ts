import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
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

  @Get()
  @Auth({ permissions: ['company_data:read'] })
  async getCompany(@currentCompany('id') companyId: string): Promise<CompanyResponse> {
    return this.companyService.getCompany(companyId);
  }

  @Put()
  @Auth({ permissions: ['company_data:update'] })
  async upsertCompany(
    @Body() data: UpsertCompanyRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CompanyResponse> {
    return this.companyService.upsertCompany(companyId, data);
  }
}
