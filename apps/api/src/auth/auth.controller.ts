import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  register(@Body() body: Record<string, unknown>) {
    return ok(this.authService.register(body));
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: Record<string, unknown>) {
    return ok(this.authService.login(body));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: Record<string, unknown>) {
    return ok(this.authService.refreshSession(body));
  }

  @Post('social/login')
  @HttpCode(200)
  socialLogin(@Body() body: Record<string, unknown>) {
    return ok(this.authService.socialLogin(body));
  }

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
