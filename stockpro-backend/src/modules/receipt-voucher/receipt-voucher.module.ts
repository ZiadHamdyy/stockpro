import { Module } from '@nestjs/common';
import { ReceiptVoucherController } from './receipt-voucher.controller';
import { ReceiptVoucherService } from './receipt-voucher.service';
import { DatabaseModule } from '../../configs/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReceiptVoucherController],
  providers: [ReceiptVoucherService],
  exports: [ReceiptVoucherService],
})
export class ReceiptVoucherModule {}
