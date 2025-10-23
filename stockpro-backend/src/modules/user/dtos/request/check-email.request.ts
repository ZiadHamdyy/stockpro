import { IsDefined, IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class CheckEmailRequest {
  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  email: string;
}
