import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PriceQuotationService } from './price-quotation.service';
import { CreatePriceQuotationRequest } from './dtos/request/create-price-quotation.request';
import { UpdatePriceQuotationRequest } from './dtos/request/update-price-quotation.request';
import { PriceQuotationResponse } from './dtos/response/price-quotation.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('price-quotations')
@UseGuards(JwtAuthenticationGuard)
export class PriceQuotationController {
  constructor(private readonly priceQuotationService: PriceQuotationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['price_quotation:create'] })
  async create(
    @Body() data: CreatePriceQuotationRequest,
    @currentUser() user: any,
  ): Promise<PriceQuotationResponse> {
    return this.priceQuotationService.create(data, user.id, user.branchId);
  }

  @Get()
  @Auth({ permissions: ['price_quotation:read'] })
  async findAll(
    @Query('search') search?: string,
  ): Promise<PriceQuotationResponse[]> {
    return this.priceQuotationService.findAll(search);
  }

  @Get(':id')
  @Auth({ permissions: ['price_quotation:read'] })
  async findOne(@Param('id') id: string): Promise<PriceQuotationResponse> {
    return this.priceQuotationService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['price_quotation:update'] })
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePriceQuotationRequest,
  ): Promise<PriceQuotationResponse> {
    return this.priceQuotationService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['price_quotation:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.priceQuotationService.remove(id);
  }
}
