import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class VerifyPasswordRequest {
  @IsDefined({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.PASSWORD_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.PASSWORD_SHOULD_BE_STRING })
  password: string;
}


