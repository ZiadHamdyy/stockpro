import { IsString, IsOptional } from 'class-validator';

export class UpdateItemGroupRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
