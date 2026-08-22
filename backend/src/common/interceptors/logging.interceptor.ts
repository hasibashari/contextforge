import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, originalUrl } = req;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const status =
            err && typeof err === 'object' && 'status' in err
              ? (err as { status: number }).status
              : 500;
          this.logger.warn(
            `[${method}] ${originalUrl} ${status} - ${duration}ms (failed)`,
          );
        },
      }),
    );
  }
}
