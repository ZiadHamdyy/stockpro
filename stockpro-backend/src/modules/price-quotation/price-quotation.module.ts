import { Module } from '@nestjs/common';
import { PriceQuotationService } from './price-quotation.service';
import { PriceQuotationController } from './price-quotation.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [FiscalYearModule, SubscriptionModule],
  controllers: [PriceQuotationController],
  providers: [PriceQuotationService, DatabaseService],
  exports: [PriceQuotationService],
})
export class PriceQuotationModule {}
