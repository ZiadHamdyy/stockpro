import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';
import { TOKEN_CONSTANTS } from '../../../../common/constants/token.constants';

export class VerifyForgotPasswordRequest {
  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;

  @IsDefined({ message: ERROR_MESSAGES.OTP_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.OTP_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.OTP_SHOULD_BE_STRING })
  @Matches(new RegExp(`^\\d{${TOKEN_CONSTANTS.OTP.LENGTH}}$`), {
    message: ERROR_MESSAGES.OTP_MUST_BE_6_DIGITS,
  })
  otp: string;
}
