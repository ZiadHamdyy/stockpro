import { Module } from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { SalesInvoiceController } from './sales-invoice.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [SalesInvoiceController],
  providers: [SalesInvoiceService, DatabaseService],
  exports: [SalesInvoiceService],
})
export class SalesInvoiceModule {}

