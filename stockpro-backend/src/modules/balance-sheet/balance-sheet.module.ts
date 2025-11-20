import { Module } from '@nestjs/common';
import { BalanceSheetController } from './balance-sheet.controller';
import { BalanceSheetService } from './balance-sheet.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { IncomeStatementModule } from '../income-statement/income-statement.module';

@Module({
  imports: [DatabaseModule, IncomeStatementModule],
  controllers: [BalanceSheetController],
  providers: [BalanceSheetService],
})
export class BalanceSheetModule {}
