import { IsString, IsOptional } from 'class-validator';

export class UpdateUnitRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
