import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [FiscalYearModule, SubscriptionModule],
  controllers: [CustomerController],
  providers: [CustomerService, DatabaseService],
  exports: [CustomerService],
})
export class CustomerModule {}
