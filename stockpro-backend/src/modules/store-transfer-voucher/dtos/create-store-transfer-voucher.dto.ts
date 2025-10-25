import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStoreTransferVoucherItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;
}

export class CreateStoreTransferVoucherDto {
  @IsUUID()
  fromStoreId: string;

  @IsUUID()
  toStoreId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStoreTransferVoucherItemDto)
  items: CreateStoreTransferVoucherItemDto[];
}
