import { Module } from '@nestjs/common';
import { SalesReturnService } from './sales-return.service';
import { SalesReturnController } from './sales-return.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [StoreModule, AuditLogModule, FiscalYearModule, SubscriptionModule],
  controllers: [SalesReturnController],
  providers: [SalesReturnService, DatabaseService],
  exports: [SalesReturnService],
})
export class SalesReturnModule {}
