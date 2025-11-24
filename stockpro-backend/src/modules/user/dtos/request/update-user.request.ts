import {
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class UpdateUserRequest {
  @IsOptional()
  @ValidateIf((o) => o.name !== '' && o.name !== undefined)
  @IsString({ message: ERROR_MESSAGES.NAME_SHOULD_BE_STRING })
  name?: string;

  @IsOptional()
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  email?: string;

  @IsOptional()
  @ValidateIf((o) => o.password !== '' && o.password !== undefined)
  @IsString({ message: ERROR_MESSAGES.PASSWORD_SHOULD_BE_STRING })
  @MinLength(8, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8 })
  password?: string;

  @IsOptional()
  @ValidateIf((o) => o.image !== '' && o.image !== undefined)
  @IsString({ message: ERROR_MESSAGES.IMAGE_SHOULD_BE_STRING })
  image?: string;

  @IsOptional()
  @ValidateIf((o) => o.branchId !== '' && o.branchId !== undefined)
  @IsString({ message: 'Branch ID should be a string' })
  @IsUUID(4, { message: 'Branch ID should be a valid UUID' })
  branchId?: string;

  @IsOptional()
  @ValidateIf((o) => o.roleId !== '' && o.roleId !== undefined)
  @IsString({ message: 'Role ID should be a string' })
  @IsUUID(4, { message: 'Role ID should be a valid UUID' })
  roleId?: string;
}
