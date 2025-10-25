import {
  IsDateString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseRequest {
  @IsDateString()
  date: string;

  @IsUUID()
  expenseCodeId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
