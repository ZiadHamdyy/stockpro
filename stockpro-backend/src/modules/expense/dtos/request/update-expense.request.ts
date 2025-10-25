import { IsDateString, IsUUID, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseRequest {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  expenseCodeId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
