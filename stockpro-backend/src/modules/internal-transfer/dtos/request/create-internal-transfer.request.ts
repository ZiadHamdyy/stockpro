import {
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateInternalTransferRequest {
  @IsDateString()
  date: string;

  @IsEnum(['safe', 'bank'])
  fromType: string;

  @ValidateIf((o) => o.fromType === 'safe')
  @IsString()
  fromSafeId?: string;

  @ValidateIf((o) => o.fromType === 'bank')
  @IsString()
  fromBankId?: string;

  @IsEnum(['safe', 'bank'])
  toType: string;

  @ValidateIf((o) => o.toType === 'safe')
  @IsString()
  toSafeId?: string;

  @ValidateIf((o) => o.toType === 'bank')
  @IsString()
  toBankId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
