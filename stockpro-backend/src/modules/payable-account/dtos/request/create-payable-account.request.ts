import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePayableAccountRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}


