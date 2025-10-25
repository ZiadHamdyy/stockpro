import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateExpenseCodeRequest {
  @IsString()
  name: string;

  @IsUUID()
  expenseTypeId: string;

  @IsOptional()
  @IsString()
  description?: string;
}
