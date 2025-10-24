import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreReceiptVoucherDto } from './create-store-receipt-voucher.dto';

export class UpdateStoreReceiptVoucherDto extends PartialType(CreateStoreReceiptVoucherDto) {}

