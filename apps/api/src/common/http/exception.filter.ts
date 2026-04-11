import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { RequestWithContext } from './request-context';
import { ensureRequestContext } from './request-context';
import { AppHttpException } from './app-http.exception';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<{
      status: (code: number) => { send: (body: unknown) => void };
      setHeader?: (name: string, value: string) => void;
      header?: (name: string, value: string) => unknown;
    }>();
    const request = http.getRequest<RequestWithContext>();

    ensureRequestContext(request, response);

    const status = this.resolveStatus(exception);
    const error = this.resolveErrorPayload(exception, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled error on request ${request.requestId ?? 'unknown'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).send({
      success: false,
      error,
      meta: {
        request_id: request.requestId ?? 'req_unknown',
        timestamp: new Date().toISOString(),
      },
    });
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveErrorPayload(
    exception: unknown,
    status: number,
  ): Record<string, unknown> {
    if (exception instanceof AppHttpException) {
      return exception.getResponse() as Record<string, unknown>;
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return {
          code: this.defaultCodeFor(status),
          message: response,
        };
      }

      if (response && typeof response === 'object') {
        const payload = response as Record<string, unknown>;
        return {
          code:
            (typeof payload.code === 'string' && payload.code) ||
            this.defaultCodeFor(status),
          message:
            (typeof payload.message === 'string' && payload.message) ||
            this.defaultMessageFor(status),
          ...(Array.isArray(payload.details)
            ? { details: payload.details }
            : {}),
        };
      }
    }

    return {
      code: 'SERVER_ERROR',
      message: 'Unexpected error',
    };
  }

  private defaultCodeFor(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      default:
        return 'SERVER_ERROR';
    }
  }

  private defaultMessageFor(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'Authentication required';
      case HttpStatus.FORBIDDEN:
        return 'You do not have permission to perform this action';
      case HttpStatus.NOT_FOUND:
        return 'Resource not found';
      case HttpStatus.CONFLICT:
        return 'Request could not be completed';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Invalid request data';
      default:
        return 'Unexpected error';
    }
  }
}
