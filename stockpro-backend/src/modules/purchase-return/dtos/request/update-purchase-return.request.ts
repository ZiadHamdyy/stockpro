import { PartialType } from '@nestjs/mapped-types';
import { CreatePurchaseReturnRequest } from './create-purchase-return.request';

export class UpdatePurchaseReturnRequest extends PartialType(
  CreatePurchaseReturnRequest,
) {}
