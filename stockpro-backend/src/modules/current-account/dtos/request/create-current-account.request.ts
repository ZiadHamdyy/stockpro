import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCurrentAccountRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  openingBalance: number;
}
