import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class ResetPasswordRequest {
  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;

  @IsDefined({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.PASSWORD_SHOULD_BE_STRING })
  @MinLength(8, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  @MaxLength(25, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  newPassword: string;
}
