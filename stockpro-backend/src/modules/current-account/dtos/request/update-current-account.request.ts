import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateCurrentAccountRequest {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number;
}
