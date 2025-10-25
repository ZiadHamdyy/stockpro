import { IsDateString, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateExpenseRequest {
  @IsDateString()
  date: string;

  @IsUUID()
  expenseCodeId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
