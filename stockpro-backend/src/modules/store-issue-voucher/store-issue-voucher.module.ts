import { Module } from '@nestjs/common';
import { StoreIssueVoucherController } from './store-issue-voucher.controller';
import { StoreIssueVoucherService } from './store-issue-voucher.service';

@Module({
  controllers: [StoreIssueVoucherController],
  providers: [StoreIssueVoucherService],
  exports: [StoreIssueVoucherService],
})
export class StoreIssueVoucherModule {}
