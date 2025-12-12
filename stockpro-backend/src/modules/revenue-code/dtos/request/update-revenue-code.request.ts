import { IsString, IsOptional } from 'class-validator';

export class UpdateRevenueCodeRequest {
  @IsOptional()
  @IsString()
  name?: string;
}
