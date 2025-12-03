import { Module } from '@nestjs/common';
import { PaymentVoucherController } from './payment-voucher.controller';
import { PaymentVoucherService } from './payment-voucher.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule],
  controllers: [PaymentVoucherController],
  providers: [PaymentVoucherService],
  exports: [PaymentVoucherService],
})
export class PaymentVoucherModule {}
