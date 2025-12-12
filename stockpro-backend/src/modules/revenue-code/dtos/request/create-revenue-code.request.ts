import { IsString } from 'class-validator';

export class CreateRevenueCodeRequest {
  @IsString()
  name: string;
}
