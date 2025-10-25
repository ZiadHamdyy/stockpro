import { IsString, IsOptional } from 'class-validator';

export class CreateExpenseTypeRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
