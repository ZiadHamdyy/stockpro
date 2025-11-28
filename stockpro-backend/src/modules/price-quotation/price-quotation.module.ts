import { Module } from '@nestjs/common';
import { PriceQuotationService } from './price-quotation.service';
import { PriceQuotationController } from './price-quotation.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [PriceQuotationController],
  providers: [PriceQuotationService, DatabaseService],
  exports: [PriceQuotationService],
})
export class PriceQuotationModule {}
