import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from '../types/auth-token-payload.type';
import { ERROR_MESSAGES, TOKEN_CONSTANTS } from '../constants';
import { SessionService } from '../../modules/session/session.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const refreshToken = this.extractTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED);
    }

    try {
      this.jwtService.verify<TokenPayload>(refreshToken);
      request['refreshToken'] = refreshToken;
      return true;
    } catch (error) {
      // Token is invalid/expired - clean up the session and clear cookie
      await this.handleExpiredRefreshToken(refreshToken, response);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME];
  }

  private async handleExpiredRefreshToken(refreshToken: string, response: Response): Promise<void> {
    try {
      // Try to find the session with this refresh token
      // This will work even if the token is expired because we're comparing hashed values
      const session = await this.sessionService.findByRefreshToken(refreshToken);
      if (session) {
        // Delete the session associated with the expired refresh token
        await this.sessionService.remove(session);
        console.log(`🗑️ Deleted session ${session.id} due to expired refresh token`);
      }
      
      // Clear the refresh token cookie from the browser
      this.clearRefreshTokenCookie(response);
      console.log(`🍪 Cleared refresh token cookie due to expired token`);
    } catch (error) {
      // Log the error but don't throw - this is a cleanup operation
      console.error('Error cleaning up expired refresh token session:', error);
    }
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(TOKEN_CONSTANTS.COOKIE.REFRESH_TOKEN_NAME);
  }
}
