import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { PayableAccountService } from './payable-account.service';
import { PayableAccountController } from './payable-account.controller';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule, SubscriptionModule],
  controllers: [PayableAccountController],
  providers: [PayableAccountService],
  exports: [PayableAccountService],
})
export class PayableAccountModule {}
