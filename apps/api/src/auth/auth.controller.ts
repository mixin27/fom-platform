import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('phone/start')
  @HttpCode(200)
  startPhoneChallenge(@Body() body: Record<string, unknown>) {
    return ok(this.authService.startPhoneChallenge(body));
  }

  @Post('phone/verify')
  @HttpCode(200)
  verifyPhoneChallenge(@Body() body: Record<string, unknown>) {
    return ok(this.authService.verifyPhoneChallenge(body));
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      this.authService.logout(token);
    }
  }
}
