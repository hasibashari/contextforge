import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      const resObj = exception.getResponse();
      if (typeof resObj === 'string') {
        message = resObj;
      } else if (typeof resObj === 'object' && resObj !== null) {
        const errorBody = resObj as Record<string, unknown>;
        message =
          (errorBody.message as string | string[]) || exception.message;
        errorCode =
          (errorBody.error as string) ||
          HttpStatus[status] ||
          'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name || 'UNKNOWN_ERROR';
    }

    const timestamp = new Date().toISOString();
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        statusCode: status,
        code: errorCode,
        message,
        path: request.url,
        timestamp,
      },
    };

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} ${errorCode}: ${JSON.stringify(
          message,
        )}`,
        stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} ${errorCode}: ${JSON.stringify(
          message,
        )}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
