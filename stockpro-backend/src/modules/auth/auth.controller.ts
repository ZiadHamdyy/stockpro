import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupRequest } from './dtos/request/signup.request';
import { AuthResponse } from './dtos/responses/auth.response';
import { RefreshTokenResponse } from './dtos/responses/refresh-token.response';
import { LoginRequest } from './dtos/request/login.request';
import { ForgotPasswordRequest } from './dtos/request/forgot-password.request';
import { VerifyForgotPasswordRequest } from './dtos/request/verify-forgot-password.request';
import { ResetPasswordRequest } from './dtos/request/reset-password.request';
import { UpdatePasswordRequest } from './dtos/request/update-password.request';
import { VerifyPasswordRequest } from './dtos/request/verify-password.request';
import { VerifyEmailRequest } from './dtos/request/verify-email.request';
import { ResendVerificationRequest } from './dtos/request/resend-verification.request';
import { ResendForgotPasswordRequest } from './dtos/request/resend-forgot-password.request';
import { LocalAuthGuard } from '../../common/guards/strategy.guards/local.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { RefreshToken } from '../../common/decorators/refresh-token.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { clientIp } from '../../common/decorators/client-ip.decorator';
import { userAgent } from '../../common/decorators/user-agent.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { UserResponse } from '../../modules/user/dtos/response/user.response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupRequest: SignupRequest) {
    return await this.authService.signup(signupRequest);
  }

  @Post('login')
  @Serialize(AuthResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _: LoginRequest,
    @currentUser() user: currentUserType,
    @clientIp() ipAddress: string,
    @userAgent() userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.loginWithCookie(
      user,
      ipAddress,
      userAgent,
      response,
    );
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @Serialize(RefreshTokenResponse)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.refreshTokensWithCookie(
      refreshToken,
      response,
    );
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logout(
    @currentUser() user: currentUserType,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.logoutWithCookie(
      user,
      user.session?.id,
      response,
    );
  }

  @Delete('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logoutAll(
    @currentUser() user: currentUserType,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.logoutAllWithCookie(user, response);
  }

  @Get('/me')
  @Serialize(UserResponse)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  getMe(@currentUser() user: currentUserType) {
    return user;
  }

  @Patch('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordRequest: ForgotPasswordRequest) {
    return await this.authService.forgotPassword(forgotPasswordRequest);
  }

  @Patch('verify-forgot-password')
  @HttpCode(HttpStatus.OK)
  async verifyForgotPassword(
    @Body() verifyForgotPasswordRequest: VerifyForgotPasswordRequest,
  ) {
    return await this.authService.verifyForgotPassword(
      verifyForgotPasswordRequest,
    );
  }

  @Patch('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordRequest: ResetPasswordRequest) {
    return await this.authService.resetPassword(resetPasswordRequest);
  }

  @Patch('update-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async updatePassword(
    @currentUser() user: currentUserType,
    @Body() updatePasswordRequest: UpdatePasswordRequest,
  ) {
    return await this.authService.updatePassword(user, updatePasswordRequest);
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async verifyPassword(
    @currentUser() user: currentUserType,
    @Body() verifyPasswordRequest: VerifyPasswordRequest,
  ) {
    return await this.authService.verifyPassword(user, verifyPasswordRequest);
  }

  @Post('verify-email')
  @Serialize(AuthResponse)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() verifyEmailRequest: VerifyEmailRequest,
    @clientIp() ipAddress: string,
    @userAgent() userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return await this.authService.verifyEmail(
      verifyEmailRequest,
      ipAddress,
      userAgent,
      response,
    );
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationRequest: ResendVerificationRequest,
  ) {
    return await this.authService.resendVerificationCode(
      resendVerificationRequest,
    );
  }

  @Post('resend-forgot-password')
  @HttpCode(HttpStatus.OK)
  async resendForgotPassword(
    @Body() resendForgotPasswordRequest: ResendForgotPasswordRequest,
  ) {
    return await this.authService.resendForgotPasswordCode(
      resendForgotPasswordRequest,
    );
  }
}
