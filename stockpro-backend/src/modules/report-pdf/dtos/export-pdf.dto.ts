import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class ExportPdfDto {
  @IsString()
  title!: string;

  @IsArray()
  columns!: any[][];

  @IsArray()
  body!: any[];

  @IsOptional()
  @IsArray()
  footerRows?: any[][];

  @IsOptional()
  @IsObject()
  companyInfo?: Record<string, any>;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  colorTheme?: "blue" | "green" | "amber";
}



