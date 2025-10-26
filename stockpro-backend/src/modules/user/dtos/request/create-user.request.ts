import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  ValidateIf,
  IsUUID,
} from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class CreateUserRequest {
  @IsDefined({ message: ERROR_MESSAGES.NAME_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.NAME_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.NAME_SHOULD_BE_STRING })
  name: string;

  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  email: string;

  @IsDefined({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.PASSWORD_SHOULD_BE_STRING })
  @MinLength(8, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8 })
  password: string;

  @IsOptional()
  @ValidateIf((o) => o.image !== '' && o.image !== undefined)
  @IsString({ message: ERROR_MESSAGES.IMAGE_SHOULD_BE_STRING })
  @MaxLength(500, { message: ERROR_MESSAGES.IMAGE_MAX_LENGTH_500 })
  image: string;

  @IsDefined({ message: 'Branch ID is required' })
  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsString({ message: 'Branch ID should be a string' })
  @IsUUID(4, { message: 'Branch ID should be a valid UUID' })
  branchId: string;
}
