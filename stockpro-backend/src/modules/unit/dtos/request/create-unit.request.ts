import { IsString, IsOptional } from 'class-validator';

export class CreateUnitRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

