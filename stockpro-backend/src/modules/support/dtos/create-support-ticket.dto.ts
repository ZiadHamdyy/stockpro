import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['مشكلة تقنية', 'استفسار مالي', 'طلب ميزة جديدة', 'أخرى'])
  problemType: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  details: string;
}

