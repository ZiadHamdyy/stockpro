import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class ForgotPasswordRequest {
  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;
}
