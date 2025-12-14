import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { ReceivableAccountService } from './receivable-account.service';
import { ReceivableAccountController } from './receivable-account.controller';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule, SubscriptionModule],
  controllers: [ReceivableAccountController],
  providers: [ReceivableAccountService],
  exports: [ReceivableAccountService],
})
export class ReceivableAccountModule {}
