import { IsString, IsOptional } from 'class-validator';

export class UpdateExpenseTypeRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
