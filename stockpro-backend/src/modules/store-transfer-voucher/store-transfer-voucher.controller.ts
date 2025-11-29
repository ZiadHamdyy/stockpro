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
import { StoreTransferVoucherService } from './store-transfer-voucher.service';
import { CreateStoreTransferVoucherDto } from './dtos/create-store-transfer-voucher.dto';
import { UpdateStoreTransferVoucherDto } from './dtos/update-store-transfer-voucher.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('store-transfer-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreTransferVoucherController {
  constructor(
    private readonly storeTransferVoucherService: StoreTransferVoucherService,
  ) {}

  @Post()
  @Auth({ permissions: ['store_transfer:create'] })
  create(
    @Body() createStoreTransferVoucherDto: CreateStoreTransferVoucherDto,
    @currentUser() user: currentUserType,
  ) {
    return this.storeTransferVoucherService.create(
      createStoreTransferVoucherDto,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['store_transfer:read'] })
  findAll() {
    return this.storeTransferVoucherService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['store_transfer:read'] })
  findOne(@Param('id') id: string) {
    return this.storeTransferVoucherService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_transfer:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreTransferVoucherDto: UpdateStoreTransferVoucherDto,
    @currentUser() user: currentUserType,
  ) {
    return this.storeTransferVoucherService.update(
      id,
      updateStoreTransferVoucherDto,
      user.branchId,
    );
  }

  @Delete(':id')
  @Auth({ permissions: ['store_transfer:delete'] })
  remove(
    @Param('id') id: string,
    @currentUser() user: currentUserType,
  ) {
    return this.storeTransferVoucherService.remove(id, user.branchId);
  }
}
