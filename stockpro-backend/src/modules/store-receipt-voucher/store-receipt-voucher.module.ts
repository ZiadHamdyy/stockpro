import { Module } from '@nestjs/common';
import { StoreReceiptVoucherController } from './store-receipt-voucher.controller';
import { StoreReceiptVoucherService } from './store-receipt-voucher.service';

@Module({
  controllers: [StoreReceiptVoucherController],
  providers: [StoreReceiptVoucherService],
  exports: [StoreReceiptVoucherService],
})
export class StoreReceiptVoucherModule {}

