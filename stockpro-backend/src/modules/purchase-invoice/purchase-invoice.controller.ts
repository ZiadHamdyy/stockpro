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

@Controller('purchase-invoices')
@UseGuards(JwtAuthenticationGuard)
export class PurchaseInvoiceController {
  constructor(private readonly purchaseInvoiceService: PurchaseInvoiceService) {}

  @Post()
  create(
    @Body() createPurchaseInvoiceDto: CreatePurchaseInvoiceRequest,
    @currentUser() user: any,
  ) {
    return this.purchaseInvoiceService.create(
      createPurchaseInvoiceDto,
      user.id,
      user.branchId,
    );
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.purchaseInvoiceService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseInvoiceService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseInvoiceDto: UpdatePurchaseInvoiceRequest,
  ) {
    return this.purchaseInvoiceService.update(id, updatePurchaseInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseInvoiceService.remove(id);
  }
}
