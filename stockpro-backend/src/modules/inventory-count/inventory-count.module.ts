import { Module } from '@nestjs/common';
import { InventoryCountController } from './inventory-count.controller';
import { InventoryCountService } from './inventory-count.service';
import { StoreReceiptVoucherModule } from '../store-receipt-voucher/store-receipt-voucher.module';
import { StoreIssueVoucherModule } from '../store-issue-voucher/store-issue-voucher.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    StoreReceiptVoucherModule,
    StoreIssueVoucherModule,
    StoreModule,
  ],
  controllers: [InventoryCountController],
  providers: [InventoryCountService],
  exports: [InventoryCountService],
})
export class InventoryCountModule {}

