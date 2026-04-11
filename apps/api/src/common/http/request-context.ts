import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { JwtPlatformAccess, JwtShopAccess } from '../../auth/auth.types';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locale: string;
  sessionId?: string;
  platform?: JwtPlatformAccess | null;
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

type ResponseWithRequestIdHeader = {
  setHeader?: (name: string, value: string) => void;
  header?: (name: string, value: string) => unknown;
};

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithContext,
    response: ResponseWithRequestIdHeader,
    next: () => void,
  ): void {
    ensureRequestContext(request, response);
    next();
  }
}

export function getSessionRequestMetadata(
  request?: Pick<RequestWithContext, 'ipAddress' | 'userAgent'>,
): SessionRequestMetadata {
  if (request) {
    ensureRequestContext(request as RequestWithContext);
  }

  return {
    ipAddress: request?.ipAddress?.trim() || null,
    userAgent: request?.userAgent?.trim() || null,
  };
}

export function ensureRequestContext(
  request: RequestWithContext,
  response?: ResponseWithRequestIdHeader,
): void {
  request.requestId ??=
    readHeaderValue(request.headers?.['x-request-id']) ??
    `req_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  if (request.ipAddress === undefined) {
    const forwardedFor = readHeaderValue(request.headers?.['x-forwarded-for']);
    const forwardedIp = forwardedFor?.split(',')[0]?.trim() || null;
    const directIp =
      typeof request.ip === 'string' && request.ip.trim().length > 0
        ? request.ip.trim()
        : null;

    request.ipAddress = forwardedIp ?? directIp;
  }

  if (request.userAgent === undefined) {
    request.userAgent = readHeaderValue(request.headers?.['user-agent']);
  }

  if (request.requestId) {
    response?.setHeader?.('X-Request-Id', request.requestId);
    response?.header?.('X-Request-Id', request.requestId);
  }
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
