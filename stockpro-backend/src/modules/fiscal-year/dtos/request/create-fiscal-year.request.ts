import { IsString, IsDateString } from 'class-validator';

export class CreateFiscalYearRequest {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

