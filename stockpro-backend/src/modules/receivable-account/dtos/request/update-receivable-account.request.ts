import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateReceivableAccountRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}


