import { Module } from '@nestjs/common';
import { StoreReceiptVoucherController } from './store-receipt-voucher.controller';
import { StoreReceiptVoucherService } from './store-receipt-voucher.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [StoreModule, AuditLogModule, FiscalYearModule],
  controllers: [StoreReceiptVoucherController],
  providers: [StoreReceiptVoucherService],
  exports: [StoreReceiptVoucherService],
})
export class StoreReceiptVoucherModule {}
