import { CanActivate, Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { unauthorizedError } from './app-http.exception';
import type { RequestWithContext } from './request-context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const token = this.extractBearerToken(
      request.headers?.authorization ?? request.headers?.Authorization,
    );

    if (!token) {
      throw unauthorizedError();
    }

    request.user = this.authService.authenticate(token);
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
