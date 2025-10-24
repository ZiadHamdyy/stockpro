import { Module } from '@nestjs/common';
import { StoreTransferVoucherController } from './store-transfer-voucher.controller';
import { StoreTransferVoucherService } from './store-transfer-voucher.service';

@Module({
  controllers: [StoreTransferVoucherController],
  providers: [StoreTransferVoucherService],
  exports: [StoreTransferVoucherService],
})
export class StoreTransferVoucherModule {}

