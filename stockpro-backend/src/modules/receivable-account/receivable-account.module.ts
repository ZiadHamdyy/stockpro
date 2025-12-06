import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { ReceivableAccountService } from './receivable-account.service';
import { ReceivableAccountController } from './receivable-account.controller';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule],
  controllers: [ReceivableAccountController],
  providers: [ReceivableAccountService],
  exports: [ReceivableAccountService],
})
export class ReceivableAccountModule {}
