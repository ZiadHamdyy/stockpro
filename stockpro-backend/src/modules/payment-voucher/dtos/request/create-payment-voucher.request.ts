import { IsDateString, IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentVoucherRequest {
  @IsDateString()
  date: string;

  @IsEnum(['customer', 'supplier', 'current_account', 'expense'])
  entityType: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['safe', 'bank'])
  paymentMethod: string;

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

