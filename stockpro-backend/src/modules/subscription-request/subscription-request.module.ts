import { Module } from '@nestjs/common';
import { SubscriptionRequestService } from './subscription-request.service';
import { SubscriptionRequestController } from './subscription-request.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [SubscriptionRequestController],
  providers: [SubscriptionRequestService, DatabaseService],
  exports: [SubscriptionRequestService],
})
export class SubscriptionRequestModule {}

