import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
  Allow,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PriceQuotationItemDto {
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
}

export class PriceQuotationTotalsDto {
  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  net: number;
}

export class CreatePriceQuotationRequest {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @Allow()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceQuotationItemDto)
  items: PriceQuotationItemDto[];

  @Allow()
  @IsObject()
  @ValidateNested()
  @Type(() => PriceQuotationTotalsDto)
  totals: PriceQuotationTotalsDto;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
