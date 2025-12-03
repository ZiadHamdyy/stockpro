import { IsString } from 'class-validator';

export class ReopenFiscalYearRequest {
  @IsString()
  password: string;
}

