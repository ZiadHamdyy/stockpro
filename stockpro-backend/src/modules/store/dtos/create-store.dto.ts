import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  userId: string;
}
