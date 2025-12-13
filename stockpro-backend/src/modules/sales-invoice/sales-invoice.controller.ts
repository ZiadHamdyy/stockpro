import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { CreateSalesInvoiceRequest } from './dtos/request/create-sales-invoice.request';
import { UpdateSalesInvoiceRequest } from './dtos/request/update-sales-invoice.request';
import { SalesInvoiceResponse } from './dtos/response/sales-invoice.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('sales-invoices')
@UseGuards(JwtAuthenticationGuard)
export class SalesInvoiceController {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['sales_invoice:create'] })
  async create(
    @Body() createSalesInvoiceDto: CreateSalesInvoiceRequest,
    @currentUser() user: any,
    @currentCompany('id') companyId: string,
  ): Promise<SalesInvoiceResponse> {
    return this.salesInvoiceService.create(
      companyId,
      createSalesInvoiceDto,
      user.id,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['sales_invoice:read'] })
  async findAll(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<SalesInvoiceResponse[]> {
    return this.salesInvoiceService.findAll(companyId, search);
  }

  @Get(':id')
  @Auth({ permissions: ['sales_invoice:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<SalesInvoiceResponse> {
    return this.salesInvoiceService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['sales_invoice:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSalesInvoiceDto: UpdateSalesInvoiceRequest,
    @currentUser() user: any,
    @currentCompany('id') companyId: string,
  ): Promise<SalesInvoiceResponse> {
    return this.salesInvoiceService.update(companyId, id, updateSalesInvoiceDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['sales_invoice:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.salesInvoiceService.remove(companyId, id);
  }
}
