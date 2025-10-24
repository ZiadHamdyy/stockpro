import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateBankRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}
