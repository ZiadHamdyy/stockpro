import { Module } from '@nestjs/common';
import { InternalTransferController } from './internal-transfer.controller';
import { InternalTransferService } from './internal-transfer.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule, SubscriptionModule, AuditLogModule],
  controllers: [InternalTransferController],
  providers: [InternalTransferService],
  exports: [InternalTransferService],
})
export class InternalTransferModule {}
