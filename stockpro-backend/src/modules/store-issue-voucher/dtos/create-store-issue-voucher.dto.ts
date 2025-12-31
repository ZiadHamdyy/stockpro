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

export class CreateStoreIssueVoucherItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;
}

export class CreateStoreIssueVoucherDto {
  @IsUUID()
  storeId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStoreIssueVoucherItemDto)
  items: CreateStoreIssueVoucherItemDto[];
}
