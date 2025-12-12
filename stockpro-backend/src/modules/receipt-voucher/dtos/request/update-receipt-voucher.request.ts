import {
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateReceiptVoucherRequest {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum([
    'customer',
    'supplier',
    'current_account',
    'receivable_account',
    'payable_account',
    'revenue',
    'vat',
    'profit_and_loss',
  ])
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['safe', 'bank'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  safeId?: string;

  @IsOptional()
  @IsString()
  bankId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  currentAccountId?: string;

  @IsOptional()
  @IsString()
  receivableAccountId?: string;

  @IsOptional()
  @IsString()
  payableAccountId?: string;

  @IsOptional()
  @IsString()
  revenueCodeId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
