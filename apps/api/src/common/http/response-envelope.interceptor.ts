import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { ApiResult } from './api-result';
import type { RequestWithContext } from './request-context';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<{ statusCode?: number }>();

    return next.handle().pipe(
      map((value) => {
        if (response.statusCode === 204 || value === undefined) {
          return undefined;
        }

        if (value instanceof ApiResult) {
          return this.wrap(request, value.data, value.meta);
        }

        return this.wrap(request, value);
      }),
    );
  }

  private wrap(
    request: RequestWithContext,
    data: unknown,
    meta?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      success: true,
      data,
      meta: {
        request_id: request.requestId ?? 'req_unknown',
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }
}
