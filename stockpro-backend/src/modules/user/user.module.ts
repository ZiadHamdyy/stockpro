import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HelperModule } from '../../common/utils/helper/helper.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [HelperModule, SubscriptionModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
