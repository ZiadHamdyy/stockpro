import { Module } from '@nestjs/common';
import { StoreIssueVoucherController } from './store-issue-voucher.controller';
import { StoreIssueVoucherService } from './store-issue-voucher.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [StoreModule, AuditLogModule],
  controllers: [StoreIssueVoucherController],
  providers: [StoreIssueVoucherService],
  exports: [StoreIssueVoucherService],
})
export class StoreIssueVoucherModule {}
