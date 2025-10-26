import { IsDateString, IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePaymentVoucherRequest {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(['customer', 'supplier', 'current_account', 'expense'])
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
  expenseCodeId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

