import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCurrentAccountRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  openingBalance: number;
}
