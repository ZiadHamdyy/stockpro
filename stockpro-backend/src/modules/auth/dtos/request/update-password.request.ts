import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class UpdatePasswordRequest {
  @IsDefined({ message: ERROR_MESSAGES.OLD_PASSWORD_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.OLD_PASSWORD_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.OLD_PASSWORD_SHOULD_BE_STRING })
  @MinLength(8, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  @MaxLength(25, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  oldPassword: string;

  @IsDefined({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.PASSWORD_SHOULD_BE_STRING })
  @MinLength(8, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  @MaxLength(25, { message: ERROR_MESSAGES.PASSWORD_MIN_LENGTH_8_MAX_25 })
  newPassword: string;
}
