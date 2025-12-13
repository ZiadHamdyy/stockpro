import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RevenueCodeService } from './revenue-code.service';
import { CreateRevenueCodeRequest } from './dtos/request/create-revenue-code.request';
import { UpdateRevenueCodeRequest } from './dtos/request/update-revenue-code.request';
import { RevenueCodeResponse } from './dtos/response/revenue-code.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('revenue-codes')
export class RevenueCodeController {
  constructor(private readonly revenueCodeService: RevenueCodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['revenue_codes:create'] })
  async createRevenueCode(
    @Body() createRevenueCodeDto: CreateRevenueCodeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.createRevenueCode(companyId, createRevenueCodeDto);
  }

  @Get()
  @Auth({ permissions: ['revenue_codes:read'] })
  async findAllRevenueCodes(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<RevenueCodeResponse[]> {
    return this.revenueCodeService.findAllRevenueCodes(companyId, search);
  }

  @Get(':id')
  @Auth({ permissions: ['revenue_codes:read'] })
  async findOneRevenueCode(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.findOneRevenueCode(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['revenue_codes:update'] })
  async updateRevenueCode(
    @Param('id') id: string,
    @Body() updateRevenueCodeDto: UpdateRevenueCodeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.updateRevenueCode(companyId, id, updateRevenueCodeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['revenue_codes:delete'] })
  async removeRevenueCode(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.revenueCodeService.removeRevenueCode(companyId, id);
  }
}
