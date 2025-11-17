import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '../constants/error-codes';

export function throwHttp(
  status: number,
  code: ErrorCode,
  message: string,
): never {
  throw new HttpException({ code, message }, status);
}
