import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSafeRequest {
  @IsString()
  name: string;

  @IsString()
  branchId: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}
