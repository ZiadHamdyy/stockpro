import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { CreatePurchaseInvoiceRequest } from './dtos/request/create-purchase-invoice.request';
import { UpdatePurchaseInvoiceRequest } from './dtos/request/update-purchase-invoice.request';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('purchase-invoices')
@UseGuards(JwtAuthenticationGuard)
export class PurchaseInvoiceController {
  constructor(
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
  ) {}

  @Post()
  create(
    @Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceRequest,
    @currentUser() user: any,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseInvoiceService.create(
      companyId,
      createPurchaseInvoiceDto,
      user.id,
      user.branchId,
    );
  }

  @Get()
  findAll(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ) {
    return this.purchaseInvoiceService.findAll(companyId, search);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseInvoiceService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseInvoiceDto: UpdatePurchaseInvoiceRequest,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseInvoiceService.update(companyId, id, updatePurchaseInvoiceDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseInvoiceService.remove(companyId, id);
  }
}
