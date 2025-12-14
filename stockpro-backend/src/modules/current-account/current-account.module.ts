import { Module } from '@nestjs/common';
import { CurrentAccountService } from './current-account.service';
import { CurrentAccountController } from './current-account.controller';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule, SubscriptionModule],
  controllers: [CurrentAccountController],
  providers: [CurrentAccountService],
  exports: [CurrentAccountService],
})
export class CurrentAccountModule {}
