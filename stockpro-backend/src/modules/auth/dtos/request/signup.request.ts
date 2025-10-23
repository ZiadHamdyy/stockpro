import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class SignupRequest {
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
  password: string;

  @IsOptional()
  @ValidateIf((o) => o.name !== '' && o.name !== undefined)
  @IsString({ message: ERROR_MESSAGES.NAME_SHOULD_BE_STRING })
  @MaxLength(25, { message: ERROR_MESSAGES.NAME_MAX_LENGTH_25 })
  @MinLength(3, { message: ERROR_MESSAGES.NAME_MIN_LENGTH_3 })
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.image !== '' && o.image !== undefined)
  @IsString({ message: ERROR_MESSAGES.IMAGE_SHOULD_BE_STRING })
  @MaxLength(255, { message: ERROR_MESSAGES.IMAGE_MAX_LENGTH_255 })
  image: string;
}
