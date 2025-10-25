import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesReturnRequest } from './create-sales-return.request';

export class UpdateSalesReturnRequest extends PartialType(CreateSalesReturnRequest) {}

