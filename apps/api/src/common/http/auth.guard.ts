import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { unauthorizedError } from './app-http.exception';
import {
  ensureRequestContext,
  getSessionRequestMetadata,
  type RequestWithContext,
} from './request-context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    ensureRequestContext(request);
    const token = this.extractBearerToken(
      request.headers?.authorization ?? request.headers?.Authorization,
    );

    if (!token) {
      throw unauthorizedError();
    }

    request.user = await this.authService.authenticate(
      token,
      getSessionRequestMetadata(request),
    );
    return true;
  }

  private extractBearerToken(
    header: string | string[] | undefined,
  ): string | null {
    if (typeof header !== 'string') {
      return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token.trim();
  }
}
