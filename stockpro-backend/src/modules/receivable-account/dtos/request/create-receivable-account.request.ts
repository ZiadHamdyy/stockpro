import { IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateReceivableAccountRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}
