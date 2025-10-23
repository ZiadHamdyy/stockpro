import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermissionRequest {
  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsOptional()
  description?: string;
}
