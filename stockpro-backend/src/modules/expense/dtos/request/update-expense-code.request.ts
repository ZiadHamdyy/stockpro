import { IsString, IsUUID, IsOptional } from 'class-validator';

export class UpdateExpenseCodeRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  expenseTypeId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
