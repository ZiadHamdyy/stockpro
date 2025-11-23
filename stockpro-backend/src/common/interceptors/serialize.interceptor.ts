import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

class SerializationInterceptor implements NestInterceptor {
  constructor(
    private dto: ClassConstructor,
    private itemType: ClassConstructor,
  ) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        // Handle wrapped responses from ResponseInterceptor
        if (
          data.code !== undefined &&
          data.success !== undefined &&
          data.data
        ) {
          // Serialize the inner data
          const serializedData = this.serializeData(data.data);
          return {
            ...data,
            data: serializedData,
          };
        }

        // Handle direct data
        return this.serializeData(data);
      }),
    );
  }

  private serializeData(data: any): any {
    // Handle paginated responses with data.data structure
    if (data.data && Array.isArray(data.data) && data.meta) {
      data.data = data.data.map((item: any) =>
        plainToInstance(this.itemType, item, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }),
      );
      return plainToInstance(this.dto, data, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      });
    }

    // Handle legacy responses with data.items structure
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map((item: any) =>
        plainToInstance(this.itemType, item, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }),
      );
    }

    return Array.isArray(data.items)
      ? data
      : plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        });
  }
}
interface ClassConstructor {
  new (...args: any[]): object;
}

export function Serialize(dto: ClassConstructor, itemType?: ClassConstructor) {
  return UseInterceptors(new SerializationInterceptor(dto, itemType!));
}
