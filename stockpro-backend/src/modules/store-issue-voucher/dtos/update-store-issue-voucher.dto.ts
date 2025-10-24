import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreIssueVoucherDto } from './create-store-issue-voucher.dto';

export class UpdateStoreIssueVoucherDto extends PartialType(CreateStoreIssueVoucherDto) {}

