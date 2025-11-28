import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryCountItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber()
  systemStock: number;

  @IsNumber()
  actualStock: number;

  @IsNumber()
  difference: number;

  @IsNumber()
  cost: number;
}

export class CreateInventoryCountDto {
  @IsUUID()
  storeId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryCountItemDto)
  items: CreateInventoryCountItemDto[];
}

