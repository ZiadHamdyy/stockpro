import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { GenericHttpException } from './generic-http-exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private response = {
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    success: false,
    message: 'Something went wrong!' as string | string[],
  };

  constructor(private readonly logger?: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse();
    const request = httpContext.getRequest();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      let message: string | string[];
      let logMessage: string | undefined;

      if (exception instanceof GenericHttpException) {
        message = exception.message;
        logMessage = exception.getLogMessage() || message;
      } else {
        // Handle standard HttpException
        const exceptionResponse = exception.getResponse();

        if (Array.isArray(exceptionResponse)) {
          message = exceptionResponse;
        } else {
          message =
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : (exceptionResponse as any).message || 'An error occurred';
        }
        logMessage = Array.isArray(message) ? message.join(', ') : message;
      }

      // Use PinoLogger if available, otherwise fallback to console
      if (this.logger) {
        this.logger.setContext(
          `${HttpExceptionFilter.name}-${request.method} ${request.url}`,
        );
        this.logger.error(
          `Message: ${logMessage}`,
          `Path: ${request.url}`,
          `Method: ${request.method}`,
          `Body: ${JSON.stringify(request.body)}`,
          `User: ${request.user ? request.user.id : 'No user'}`,
        );
      } else {
        // Fallback to console logging
        console.error('HTTP Exception:', {
          message: logMessage,
          path: request.url,
          method: request.method,
          statusCode,
          timestamp: new Date().toISOString(),
        });
      }

      this.response.code = statusCode;
      this.response.message = message;

      // Include exception params (like missingPermissions) in response if available
      if (exception instanceof GenericHttpException && exception.getParams()) {
        this.response = { ...this.response, ...exception.getParams() };
      }

      return response.status(statusCode).json(this.response);
    }

    // Map Prisma FK constraint errors to 409 Conflict (cannot delete due to related records)
    if ((exception as any)?.code === 'P2003') {
      const statusCode = HttpStatus.CONFLICT;
      const message = 'لا يمكن الحذف لوجود بيانات مرتبطة.';

      // Log for observability
      if (this.logger) {
        this.logger.setContext(
          `${HttpExceptionFilter.name}-${request.method} ${request.url}`,
        );
        this.logger.error(
          `Message: ${message}`,
          `Path: ${request.url}`,
          `Method: ${request.method}`,
          `Body: ${JSON.stringify(request.body)}`,
          `User: ${request.user ? request.user.id : 'No user'}`,
        );
      } else {
        console.error('HTTP Exception:', {
          message,
          path: request.url,
          method: request.method,
          statusCode,
          timestamp: new Date().toISOString(),
        });
      }

      this.response.code = statusCode;
      this.response.message = message;
      return response.status(statusCode).json(this.response);
    }

    if (
      exception instanceof RangeError ||
      (exception as any).name === 'PayloadTooLargeError'
    ) {
      this.response.code = HttpStatus.PAYLOAD_TOO_LARGE;
      this.response.message = (exception as any).message;

      if (this.logger) {
        this.logger.error(`Message: ${(exception as any).stack}`);
      } else {
        console.error('Payload Too Large:', (exception as any).stack);
      }

      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json(this.response);
    }

    // Handle generic errors
    if (exception instanceof Error) {
      if (exception.message.includes('path must be absolute')) {
        return response.status(HttpStatus.NOT_FOUND).end('File does not exist');
      }

      this.response.code = HttpStatus.INTERNAL_SERVER_ERROR;
      this.response.message = 'Something went wrong!';

      if (this.logger) {
        this.logger.error(`Message: ${exception.stack}`);
      } else {
        console.error('Internal Server Error:', exception.stack);
      }

      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(this.response);
    }

    // Fallback for unknown errors
    if (this.logger) {
      this.logger.error('Unhandled exception', exception);
    } else {
      console.error('Unhandled exception:', exception);
    }

    this.response.code = HttpStatus.INTERNAL_SERVER_ERROR;
    this.response.message = 'Something went wrong!';

    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(this.response);
  }
}
