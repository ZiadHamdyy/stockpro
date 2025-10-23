import { HttpException, HttpStatus } from '@nestjs/common';

export class GenericHttpException extends HttpException {
  private readonly logMessage?: string;
  private readonly params?: Record<string, any>;
  private readonly messageKey?: string;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    logMessage?: string,
    params?: Record<string, any>,
    messageKey?: string,
  ) {
    super(message, statusCode);
    this.logMessage = logMessage;
    this.params = params;
    this.messageKey = messageKey;
  }

  getLogMessage(): string | undefined {
    return this.logMessage;
  }

  getParams(): Record<string, any> | undefined {
    return this.params;
  }

  getMessageKey(): string | undefined {
    return this.messageKey;
  }

  /**
   * Create a localized GenericHttpException that will be automatically localized
   * by the HttpExceptionFilter
   */
  static createLocalized(
    messageKey: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    params?: Record<string, any>,
    logMessage?: string,
  ): GenericHttpException {
    return new GenericHttpException(
      messageKey, // This will be replaced by the localized message in the filter
      statusCode,
      logMessage,
      params,
      messageKey,
    );
  }
}
