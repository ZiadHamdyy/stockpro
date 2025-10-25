import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StoreReceiptVoucherService } from './store-receipt-voucher.service';
import { CreateStoreReceiptVoucherDto } from './dtos/create-store-receipt-voucher.dto';
import { UpdateStoreReceiptVoucherDto } from './dtos/update-store-receipt-voucher.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';

@Controller('store-receipt-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreReceiptVoucherController {
  constructor(
    private readonly storeReceiptVoucherService: StoreReceiptVoucherService,
  ) {}

  @Post()
  create(@Body() createStoreReceiptVoucherDto: CreateStoreReceiptVoucherDto) {
    return this.storeReceiptVoucherService.create(createStoreReceiptVoucherDto);
  }

  @Get()
  findAll() {
    return this.storeReceiptVoucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storeReceiptVoucherService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreReceiptVoucherDto: UpdateStoreReceiptVoucherDto,
  ) {
    return this.storeReceiptVoucherService.update(
      id,
      updateStoreReceiptVoucherDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeReceiptVoucherService.remove(id);
  }
}
