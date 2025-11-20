import { Module } from '@nestjs/common';
import { IncomeStatementController } from './income-statement.controller';
import { IncomeStatementService } from './income-statement.service';
import { DatabaseModule } from '../../configs/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IncomeStatementController],
  providers: [IncomeStatementService],
  exports: [IncomeStatementService],
})
export class IncomeStatementModule {}
