import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
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

export class CreateSalesReturnRequest {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

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

  @IsString()
  @IsOptional()
  notes?: string;
}

