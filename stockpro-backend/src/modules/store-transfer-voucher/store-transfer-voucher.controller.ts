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

@Controller('store-transfer-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreTransferVoucherController {
  constructor(private readonly storeTransferVoucherService: StoreTransferVoucherService) {}

  @Post()
  @Auth({ permissions: ['store_transfer:create'] })
  create(@Body() createStoreTransferVoucherDto: CreateStoreTransferVoucherDto) {
    return this.storeTransferVoucherService.create(createStoreTransferVoucherDto);
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
  ) {
    return this.storeTransferVoucherService.update(id, updateStoreTransferVoucherDto);
  }

  @Delete(':id')
  @Auth({ permissions: ['store_transfer:delete'] })
  remove(@Param('id') id: string) {
    return this.storeTransferVoucherService.remove(id);
  }
}
