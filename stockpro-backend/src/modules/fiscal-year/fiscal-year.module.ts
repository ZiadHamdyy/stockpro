import { Module } from '@nestjs/common';
import { FiscalYearController } from './fiscal-year.controller';
import { FiscalYearService } from './fiscal-year.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { IncomeStatementModule } from '../income-statement/income-statement.module';

@Module({
  imports: [DatabaseModule, IncomeStatementModule],
  controllers: [FiscalYearController],
  providers: [FiscalYearService],
  exports: [FiscalYearService],
})
export class FiscalYearModule {}

