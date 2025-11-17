import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePayableAccountRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}
