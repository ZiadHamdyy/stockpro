import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { ReceivableAccountService } from './receivable-account.service';
import { ReceivableAccountController } from './receivable-account.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ReceivableAccountController],
  providers: [ReceivableAccountService],
  exports: [ReceivableAccountService],
})
export class ReceivableAccountModule {}


