import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class UpdateUserInfo {
  @IsOptional()
  @ValidateIf((o) => o.name !== '' && o.name !== undefined)
  @IsString({ message: ERROR_MESSAGES.NAME_SHOULD_BE_STRING })
  @MaxLength(100, { message: ERROR_MESSAGES.NAME_MAX_LENGTH_100 })
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.image !== '' && o.image !== undefined)
  @IsString({ message: ERROR_MESSAGES.IMAGE_SHOULD_BE_STRING })
  @MaxLength(500, { message: ERROR_MESSAGES.IMAGE_MAX_LENGTH_500 })
  image: string;
}

export class CurrentUserUpdateInput {
  @IsOptional()
  @ValidateIf((o) => o.name !== '' && o.name !== undefined)
  @IsString({ message: ERROR_MESSAGES.NAME_SHOULD_BE_STRING })
  @MaxLength(100, { message: ERROR_MESSAGES.NAME_MAX_LENGTH_100 })
  name: string;

  @IsOptional()
  @ValidateIf((o) => o.image !== '' && o.image !== undefined)
  @IsString({ message: ERROR_MESSAGES.IMAGE_SHOULD_BE_STRING })
  @MaxLength(500, { message: ERROR_MESSAGES.IMAGE_MAX_LENGTH_500 })
  image: string;
}
