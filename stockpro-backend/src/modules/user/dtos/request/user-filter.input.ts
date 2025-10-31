import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../../common/constants/error-messages.constant';

export class UsernameInput {
  @IsDefined({ message: ERROR_MESSAGES.USERNAME_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.USERNAME_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.USERNAME_SHOULD_BE_STRING })
  @MinLength(6, { message: ERROR_MESSAGES.USERNAME_MIN_LENGTH_6 })
  username: string;
}

export class UserEmailInput {
  @IsDefined({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMAIL_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.EMAIL_SHOULD_BE_STRING })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL })
  email: string;
}

export class UserIdInput {
  @IsDefined({ message: ERROR_MESSAGES.USER_ID_REQUIRED })
  @IsNotEmpty({ message: ERROR_MESSAGES.USER_ID_REQUIRED })
  @IsString({ message: ERROR_MESSAGES.USER_ID_SHOULD_BE_STRING_FILTER })
  userId: string;
}

export class UserListFilterInput {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 8;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
