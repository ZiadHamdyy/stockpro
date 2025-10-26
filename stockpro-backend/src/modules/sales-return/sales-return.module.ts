import { Module } from '@nestjs/common';
import { SalesReturnService } from './sales-return.service';
import { SalesReturnController } from './sales-return.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [SalesReturnController],
  providers: [SalesReturnService, DatabaseService],
  exports: [SalesReturnService],
})
export class SalesReturnModule {}
