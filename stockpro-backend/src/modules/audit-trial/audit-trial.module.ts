import { Module } from '@nestjs/common';
import { AuditTrialController } from './audit-trial.controller';
import { AuditTrialService } from './audit-trial.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { IncomeStatementModule } from '../income-statement/income-statement.module';

@Module({
  imports: [DatabaseModule, IncomeStatementModule],
  controllers: [AuditTrialController],
  providers: [AuditTrialService],
})
export class AuditTrialModule {}

