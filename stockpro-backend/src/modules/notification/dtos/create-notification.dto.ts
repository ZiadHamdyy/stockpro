import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  type: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsUUID()
  relatedId?: string;
}


