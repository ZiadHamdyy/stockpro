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
import { currentCompany } from '../../common/decorators/company.decorator';
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
    @currentCompany('id') companyId: string,
  ) {
    return this.storeReceiptVoucherService.create(
      companyId,
      createStoreReceiptVoucherDto,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['store_receipt_voucher:read'] })
  findAll(@currentCompany('id') companyId: string) {
    return this.storeReceiptVoucherService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['store_receipt_voucher:read'] })
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeReceiptVoucherService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_receipt_voucher:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreReceiptVoucherDto: UpdateStoreReceiptVoucherDto,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeReceiptVoucherService.update(
      companyId,
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
    @currentCompany('id') companyId: string,
  ) {
    return this.storeReceiptVoucherService.remove(companyId, id, user.branchId);
  }
}
