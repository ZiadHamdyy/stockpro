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

@Controller('revenue-codes')
export class RevenueCodeController {
  constructor(private readonly revenueCodeService: RevenueCodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['revenue_codes:create'] })
  async createRevenueCode(
    @Body() createRevenueCodeDto: CreateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.createRevenueCode(createRevenueCodeDto);
  }

  @Get()
  @Auth({ permissions: ['revenue_codes:read'] })
  async findAllRevenueCodes(
    @Query('search') search?: string,
  ): Promise<RevenueCodeResponse[]> {
    return this.revenueCodeService.findAllRevenueCodes(search);
  }

  @Get(':id')
  @Auth({ permissions: ['revenue_codes:read'] })
  async findOneRevenueCode(
    @Param('id') id: string,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.findOneRevenueCode(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['revenue_codes:update'] })
  async updateRevenueCode(
    @Param('id') id: string,
    @Body() updateRevenueCodeDto: UpdateRevenueCodeRequest,
  ): Promise<RevenueCodeResponse> {
    return this.revenueCodeService.updateRevenueCode(id, updateRevenueCodeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['revenue_codes:delete'] })
  async removeRevenueCode(@Param('id') id: string): Promise<void> {
    return this.revenueCodeService.removeRevenueCode(id);
  }
}
