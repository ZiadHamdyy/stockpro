import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceQuotationRequest } from './create-price-quotation.request';

export class UpdatePriceQuotationRequest extends PartialType(
  CreatePriceQuotationRequest,
) {}
