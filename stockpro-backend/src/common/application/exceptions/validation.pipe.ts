import {
  Injectable,
  ArgumentMetadata,
  PipeTransform,
  HttpException,
  HttpStatus,
  ExecutionContext,
} from '@nestjs/common';
import { validate, ValidationOptions } from 'class-validator';
import { plainToClass } from 'class-transformer';

export interface ValidationPipeOptions extends ValidationOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
}

@Injectable()
export class ValidationPipe implements PipeTransform {
  private options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: true,
      ...options,
    };
  }
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    // Skip validation for basic types or if metatype is not available
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Skip validation for Buffer types (used in webhook raw body)
    if (value instanceof Buffer) {
      return value;
    }

    // For DTOs, we need to validate even if value is null/undefined
    // Transform plain object to class instance (this handles null/undefined gracefully)
    let object;
    try {
      object = plainToClass(metatype, value || {});
    } catch (error) {
      // If plainToClass fails, it might be due to invalid input type
      console.error(
        'plainToClass error:',
        error,
        'value:',
        value,
        'metatype:',
        metatype,
      );
      return value; // Return original value if transformation fails
    }

    // Validate the transformed object with options
    const errors = await validate(object, this.options);

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);

      // Check if any error message looks like a message key (uppercase with underscores and numbers)
      const hasMessageKeys = errorMessages.some(
        (msg) => typeof msg === 'string' && /^[A-Z0-9_]+$/.test(msg),
      );

      if (hasMessageKeys) {
        // If we have message keys, we need to localize them but keep them as an array
        // For now, we'll throw a standard HttpException with the message keys
        // The exception filter will handle the localization
        throw new HttpException(errorMessages, HttpStatus.BAD_REQUEST);
      }

      // Fallback to standard HttpException for non-localized messages
      throw new HttpException(errorMessages, HttpStatus.BAD_REQUEST);
    }

    // Return the transformed object if validation passes
    return object;
  }

  // CHECK METATYPE FUNCTION
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type);
  }

  // FORMAT ERROR FUNCTION
  private formatErrors(errors: any[]): string[] {
    return errors.map((err) => {
      if (err.constraints) {
        // Handle the specific case for non-whitelisted properties
        if (err.constraints.unknownValue) {
          return 'Unknown properties are not allowed';
        }
        return Object.values(err.constraints)[0] as string;
      }
      // Handle non-whitelisted property errors
      if (err.property && err.value !== undefined) {
        return `Property '${err.property}' is not allowed`;
      }
      return 'Validation failed';
    });
  }
}
