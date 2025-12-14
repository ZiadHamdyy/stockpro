import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StockService } from './services/stock.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [StoreController],
  providers: [StoreService, StockService],
  exports: [StoreService, StockService],
})
export class StoreModule {}
