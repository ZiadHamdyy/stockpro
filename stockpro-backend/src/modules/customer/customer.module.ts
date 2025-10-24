import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, DatabaseService],
  exports: [CustomerService],
})
export class CustomerModule {}
