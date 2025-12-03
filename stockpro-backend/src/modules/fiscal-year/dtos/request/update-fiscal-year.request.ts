import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateFiscalYearRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

