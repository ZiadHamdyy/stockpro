import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateItemRequest {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  name: string;

  @IsNumber()
  purchasePrice: number;

  @IsNumber()
  salePrice: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  reorderLimit?: number;

  @IsUUID()
  groupId: string;

  @IsUUID()
  unitId: string;
}
