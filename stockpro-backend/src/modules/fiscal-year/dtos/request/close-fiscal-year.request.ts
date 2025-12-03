import { IsString } from 'class-validator';

export class CloseFiscalYearRequest {
  @IsString()
  password: string;
}

