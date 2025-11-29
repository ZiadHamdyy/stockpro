import { Module } from '@nestjs/common';
import { StoreTransferVoucherController } from './store-transfer-voucher.controller';
import { StoreTransferVoucherService } from './store-transfer-voucher.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [StoreModule, AuditLogModule],
  controllers: [StoreTransferVoucherController],
  providers: [StoreTransferVoucherService],
  exports: [StoreTransferVoucherService],
})
export class StoreTransferVoucherModule {}
