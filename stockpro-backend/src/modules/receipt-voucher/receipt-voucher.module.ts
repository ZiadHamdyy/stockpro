import { Module } from '@nestjs/common';
import { ReceiptVoucherController } from './receipt-voucher.controller';
import { ReceiptVoucherService } from './receipt-voucher.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule],
  controllers: [ReceiptVoucherController],
  providers: [ReceiptVoucherService],
  exports: [ReceiptVoucherService],
})
export class ReceiptVoucherModule {}
