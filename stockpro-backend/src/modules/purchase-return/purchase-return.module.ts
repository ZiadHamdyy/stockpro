import { Module } from '@nestjs/common';
import { PurchaseReturnService } from './purchase-return.service';
import { PurchaseReturnController } from './purchase-return.controller';
import { DatabaseModule } from '../../configs/database/database.module';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [DatabaseModule, StoreModule, AuditLogModule, FiscalYearModule, SubscriptionModule],
  controllers: [PurchaseReturnController],
  providers: [PurchaseReturnService],
  exports: [PurchaseReturnService],
})
export class PurchaseReturnModule {}
