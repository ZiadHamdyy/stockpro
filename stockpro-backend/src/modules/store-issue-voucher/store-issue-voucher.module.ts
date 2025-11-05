import { Module } from '@nestjs/common';
import { StoreIssueVoucherController } from './store-issue-voucher.controller';
import { StoreIssueVoucherService } from './store-issue-voucher.service';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  controllers: [StoreIssueVoucherController],
  providers: [StoreIssueVoucherService],
  exports: [StoreIssueVoucherService],
})
export class StoreIssueVoucherModule {}
