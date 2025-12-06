import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../configs/database/database.module';
import { PayableAccountService } from './payable-account.service';
import { PayableAccountController } from './payable-account.controller';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule],
  controllers: [PayableAccountController],
  providers: [PayableAccountService],
  exports: [PayableAccountService],
})
export class PayableAccountModule {}
