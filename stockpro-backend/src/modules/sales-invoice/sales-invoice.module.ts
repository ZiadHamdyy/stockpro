import { Module } from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { SalesInvoiceController } from './sales-invoice.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { StoreModule } from '../store/store.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [StoreModule, AuditLogModule],
  controllers: [SalesInvoiceController],
  providers: [SalesInvoiceService, DatabaseService],
  exports: [SalesInvoiceService],
})
export class SalesInvoiceModule {}
