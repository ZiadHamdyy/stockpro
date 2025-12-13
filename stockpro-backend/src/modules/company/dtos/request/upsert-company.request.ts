import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpsertCompanyRequest {
  @IsString()
  name: string;

  @IsString()
  activity: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsString()
  taxNumber: string;

  @IsString()
  commercialReg: string;

  @IsString()
  currency: string;

  @IsNumber()
  capital: number;

  @IsNumber()
  vatRate: number;

  @IsBoolean()
  isVatEnabled: boolean;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  host?: string;
}
