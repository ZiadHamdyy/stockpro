import {
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateInternalTransferRequest {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(['safe', 'bank'])
  fromType?: string;

  @IsOptional()
  @IsString()
  fromSafeId?: string;

  @IsOptional()
  @IsString()
  fromBankId?: string;

  @IsOptional()
  @IsEnum(['safe', 'bank'])
  toType?: string;

  @IsOptional()
  @IsString()
  toSafeId?: string;

  @IsOptional()
  @IsString()
  toBankId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

