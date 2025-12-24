import { IsString, IsNumber, IsBoolean, IsOptional, Matches } from 'class-validator';

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
  @Matches(/^\d{6,8}$/, { message: 'Company code must be 6-8 digits' })
  code?: string;
}
