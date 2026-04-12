import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import {
  getSessionRequestMetadata,
  type RequestWithContext,
} from '../common/http/request-context';
import { LoginDto } from './dto/login.dto';
import { ConfirmEmailVerificationDto } from './dto/confirm-email-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { StartPhoneChallengeDto } from './dto/start-phone-challenge.dto';
import { VerifyPhoneChallengeDto } from './dto/verify-phone-challenge.dto';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register with email and password' })
  register(@Body() body: RegisterDto, @Req() request: RequestWithContext) {
    return ok(
      this.authService.register(body, getSessionRequestMetadata(request)),
    );
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() body: LoginDto, @Req() request: RequestWithContext) {
    return ok(this.authService.login(body, getSessionRequestMetadata(request)));
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate JWT access and refresh tokens' })
  refresh(@Body() body: RefreshSessionDto, @Req() request: RequestWithContext) {
    return ok(
      this.authService.refreshSession(body, getSessionRequestMetadata(request)),
    );
  }

  @Post('social/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with a social identity payload' })
  socialLogin(
    @Body() body: SocialLoginDto,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.authService.socialLogin(body, getSessionRequestMetadata(request)),
    );
  }

  @Post('email/verification/send')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send or resend an email verification link' })
  sendEmailVerification(@Req() request: RequestWithContext) {
    return ok(
      this.authService.sendEmailVerification(
        request.user!,
        getSessionRequestMetadata(request),
      ),
    );
  }

  @Post('email/verification/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm an email verification token' })
  confirmEmailVerification(@Body() body: ConfirmEmailVerificationDto) {
    return ok(this.authService.confirmEmailVerification(body));
  }

  @Post('password/forgot')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a password reset email' })
  forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.authService.forgotPassword(body, getSessionRequestMetadata(request)),
    );
  }

  @Post('password/reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset a password using an email action token' })
  resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.authService.resetPassword(body, getSessionRequestMetadata(request)),
    );
  }

  @Post('phone/start')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start an optional phone OTP challenge' })
  startPhoneChallenge(@Body() body: StartPhoneChallengeDto) {
    return ok(this.authService.startPhoneChallenge(body));
  }

  @Post('phone/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verify a phone OTP challenge and create a session',
  })
  verifyPhoneChallenge(
    @Body() body: VerifyPhoneChallengeDto,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.authService.verifyPhoneChallenge(
        body,
        getSessionRequestMetadata(request),
      ),
    );
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current access token session' })
  async logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      await this.authService.logout(token);
    }
  }
}
