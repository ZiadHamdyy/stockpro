import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesInvoiceRequest } from './create-sales-invoice.request';

export class UpdateSalesInvoiceRequest extends PartialType(
  CreateSalesInvoiceRequest,
) {}
