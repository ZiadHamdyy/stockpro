import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StoreTransferVoucherService } from './store-transfer-voucher.service';
import { CreateStoreTransferVoucherDto } from './dtos/create-store-transfer-voucher.dto';
import { UpdateStoreTransferVoucherDto } from './dtos/update-store-transfer-voucher.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';
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
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.create(
      companyId,
      createStoreTransferVoucherDto,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['store_transfer:read'] })
  findAll(
    @currentCompany('id') companyId: string,
    @Query('status') status?: string,
  ) {
    return this.storeTransferVoucherService.findAll(companyId, status);
  }

  @Get(':id')
  @Auth({ permissions: ['store_transfer:read'] })
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_transfer:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreTransferVoucherDto: UpdateStoreTransferVoucherDto,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.update(
      companyId,
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
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.remove(companyId, id, user.branchId);
  }

  @Patch(':id/accept')
  @Auth({ permissions: ['store_transfer:update'] })
  accept(
    @Param('id') id: string,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.acceptTransfer(
      companyId,
      id,
      user.branchId,
      user.id,
    );
  }

  @Patch(':id/reject')
  @Auth({ permissions: ['store_transfer:update'] })
  reject(
    @Param('id') id: string,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeTransferVoucherService.rejectTransfer(
      companyId,
      id,
      user.branchId,
      user.id,
    );
  }
}
