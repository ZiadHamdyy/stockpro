import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { PayableAccountService } from './payable-account.service';
import { PayableAccountController } from './payable-account.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PayableAccountController],
  providers: [PayableAccountService],
  exports: [PayableAccountService],
})
export class PayableAccountModule {}
