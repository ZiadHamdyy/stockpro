import { Module } from '@nestjs/common';
import { SafeService } from './safe.service';
import { SafeController } from './safe.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [SafeController],
  providers: [SafeService, DatabaseService],
  exports: [SafeService],
})
export class SafeModule {}
