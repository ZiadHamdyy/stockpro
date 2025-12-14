import { Module } from '@nestjs/common';
import { InternalTransferController } from './internal-transfer.controller';
import { InternalTransferService } from './internal-transfer.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule, SubscriptionModule],
  controllers: [InternalTransferController],
  providers: [InternalTransferService],
  exports: [InternalTransferService],
})
export class InternalTransferModule {}
