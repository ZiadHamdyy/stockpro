import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCustomerRequest {
  @IsString()
  name: string;

  @IsString()
  commercialReg: string;

  @IsString()
  taxNumber: string;

  @IsString()
  nationalAddress: string;

  @IsString()
  phone: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;

  @IsNumber()
  @IsOptional()
  creditLimit?: number;
}
