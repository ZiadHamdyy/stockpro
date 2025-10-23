import { IsDefined, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginRequest {
  // 1) Existence, 2) Requiredness, 3) Type
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase(), { toClassOnly: true })
  email: string;

  // 1) Existence, 2) Requiredness, 3) Type, 6) Constraints
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  password: string;
}
