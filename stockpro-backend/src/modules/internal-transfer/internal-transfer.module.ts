import { Module } from '@nestjs/common';
import { InternalTransferController } from './internal-transfer.controller';
import { InternalTransferService } from './internal-transfer.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [DatabaseModule, FiscalYearModule],
  controllers: [InternalTransferController],
  providers: [InternalTransferService],
  exports: [InternalTransferService],
})
export class InternalTransferModule {}
