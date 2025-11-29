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
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('store-receipt-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreReceiptVoucherController {
  constructor(
    private readonly storeReceiptVoucherService: StoreReceiptVoucherService,
  ) {}

  @Post()
  @Auth({ permissions: ['store_receipt_voucher:create'] })
  create(
    @Body() createStoreReceiptVoucherDto: CreateStoreReceiptVoucherDto,
    @currentUser() user: currentUserType,
  ) {
    return this.storeReceiptVoucherService.create(
      createStoreReceiptVoucherDto,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['store_receipt_voucher:read'] })
  findAll() {
    return this.storeReceiptVoucherService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['store_receipt_voucher:read'] })
  findOne(@Param('id') id: string) {
    return this.storeReceiptVoucherService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_receipt_voucher:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreReceiptVoucherDto: UpdateStoreReceiptVoucherDto,
    @currentUser() user: currentUserType,
  ) {
    return this.storeReceiptVoucherService.update(
      id,
      updateStoreReceiptVoucherDto,
      user.branchId,
    );
  }

  @Delete(':id')
  @Auth({ permissions: ['store_receipt_voucher:delete'] })
  remove(
    @Param('id') id: string,
    @currentUser() user: currentUserType,
  ) {
    return this.storeReceiptVoucherService.remove(id, user.branchId);
  }
}
