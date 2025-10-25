import {
  IsDateString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateExpenseRequest {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  expenseCodeId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
