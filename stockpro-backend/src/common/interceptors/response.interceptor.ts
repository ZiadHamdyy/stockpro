import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../types/response.type';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  constructor() {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const now = Date.now();
    return next.handle().pipe(
      map((res) => {
        console.log(
          `${context.getHandler().name} operation takes ${Date.now() - now}ms at ${
            context.getClass().name
          } class`,
        );

        return {
          code: context.switchToHttp().getResponse().statusCode,
          success: true,
          message: 'Operation done successfully',
          data: res,
        };
      }),
    );
  }
}
