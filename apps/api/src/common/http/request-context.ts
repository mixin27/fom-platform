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
  ip?: string;
  requestId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  user?: AuthenticatedUser;
}

export type SessionRequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithContext,
    response: { setHeader?: (name: string, value: string) => void },
    next: () => void,
  ): void {
    const headerValue = readHeaderValue(request.headers?.['x-request-id']);
    const requestId =
      headerValue || `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const forwardedFor = readHeaderValue(request.headers?.['x-forwarded-for']);
    const forwardedIp = forwardedFor?.split(',')[0]?.trim() || null;
    const directIp =
      typeof request.ip === 'string' && request.ip.trim().length > 0
        ? request.ip.trim()
        : null;

    request.requestId = requestId;
    request.ipAddress = forwardedIp ?? directIp;
    request.userAgent = readHeaderValue(request.headers?.['user-agent']);
    response.setHeader?.('X-Request-Id', requestId);
    next();
  }
}

export function getSessionRequestMetadata(
  request?: Pick<RequestWithContext, 'ipAddress' | 'userAgent'>,
): SessionRequestMetadata {
  return {
    ipAddress: request?.ipAddress?.trim() || null,
    userAgent: request?.userAgent?.trim() || null,
  };
}

function readHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readHeaderValue(value[0]);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
