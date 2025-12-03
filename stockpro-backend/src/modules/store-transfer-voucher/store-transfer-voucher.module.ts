import { Module } from '@nestjs/common';
import { StoreTransferVoucherController } from './store-transfer-voucher.controller';
import { StoreTransferVoucherService } from './store-transfer-voucher.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../notification/notification.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [StoreModule, AuditLogModule, NotificationModule, FiscalYearModule],
  controllers: [StoreTransferVoucherController],
  providers: [StoreTransferVoucherService],
  exports: [StoreTransferVoucherService],
})
export class StoreTransferVoucherModule {}
