import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateSafeRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}
