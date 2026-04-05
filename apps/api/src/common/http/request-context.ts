import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { JwtShopAccess } from '../../auth/auth.types';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  sessionId?: string;
  shops?: JwtShopAccess[];
}

export interface RequestWithContext {
  headers?: Record<string, string | string[] | undefined>;
  requestId?: string;
  user?: AuthenticatedUser;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithContext,
    response: { setHeader?: (name: string, value: string) => void },
    next: () => void,
  ): void {
    const headerValue = request.headers?.['x-request-id'];
    const requestId =
      (typeof headerValue === 'string' && headerValue.trim()) ||
      `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    request.requestId = requestId;
    response.setHeader?.('X-Request-Id', requestId);
    next();
  }
}
