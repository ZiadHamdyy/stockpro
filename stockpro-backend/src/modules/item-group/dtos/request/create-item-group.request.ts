import { IsString, IsOptional } from 'class-validator';

export class CreateItemGroupRequest {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
