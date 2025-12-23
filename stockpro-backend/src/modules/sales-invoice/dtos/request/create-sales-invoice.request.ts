import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BankTransactionType } from '@prisma/client';

export class InvoiceItemDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsBoolean()
  @IsOptional()
  salePriceIncludesTax?: boolean;
}

export class CreateSalesInvoiceRequest {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsEnum(['cash', 'credit'])
  paymentMethod: 'cash' | 'credit';

  @IsString()
  @IsOptional()
  paymentTargetType?: 'safe' | 'bank';

  @IsString()
  @IsOptional()
  paymentTargetId?: string;

  @IsEnum(BankTransactionType)
  @IsOptional()
  bankTransactionType?: BankTransactionType;

  @IsBoolean()
  @IsOptional()
  isSplitPayment?: boolean;

  @IsNumber()
  @IsOptional()
  splitCashAmount?: number;

  @IsNumber()
  @IsOptional()
  splitBankAmount?: number;

  @IsString()
  @IsOptional()
  splitSafeId?: string;

  @IsString()
  @IsOptional()
  splitBankId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  allowInsufficientStock?: boolean;
}
