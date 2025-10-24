import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateBankRequest {
  @IsString()
  name: string;

  @IsString()
  accountNumber: string;

  @IsString()
  iban: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}
