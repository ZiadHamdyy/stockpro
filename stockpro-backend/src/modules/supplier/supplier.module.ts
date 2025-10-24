import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [SupplierController],
  providers: [SupplierService, DatabaseService],
  exports: [SupplierService],
})
export class SupplierModule {}
