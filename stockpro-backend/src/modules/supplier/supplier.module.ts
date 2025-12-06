import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [FiscalYearModule],
  controllers: [SupplierController],
  providers: [SupplierService, DatabaseService],
  exports: [SupplierService],
})
export class SupplierModule {}
