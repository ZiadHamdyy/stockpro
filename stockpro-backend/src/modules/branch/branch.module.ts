import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SafeModule } from '../safe/safe.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [SubscriptionModule, SafeModule, StoreModule],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
