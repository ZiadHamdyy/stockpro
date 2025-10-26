import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseInvoiceRequest } from './create-purchase-invoice.request';

export class UpdatePurchaseInvoiceRequest extends PartialType(
  CreatePurchaseInvoiceRequest,
) {}
