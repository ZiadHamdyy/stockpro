import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreTransferVoucherDto } from './create-store-transfer-voucher.dto';

export class UpdateStoreTransferVoucherDto extends PartialType(
  CreateStoreTransferVoucherDto,
) {}
