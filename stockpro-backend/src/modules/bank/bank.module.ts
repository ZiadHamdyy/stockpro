import { Module } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankController } from './bank.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [BankController],
  providers: [BankService, DatabaseService],
  exports: [BankService],
})
export class BankModule {}
