import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { TokenPayload } from '../types/auth-token-payload.type';
import { Inject, Injectable } from '@nestjs/common';
import type { IContextAuthService } from '../application/context/context-auth.interface';
import { IContextAuthServiceToken } from '../application/context/context-auth.interface';
import { GenericHttpException } from '../application/exceptions/generic-http-exception';
import { TOKEN_CONSTANTS } from '../constants';
import { get } from 'env-var';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: get('JWT_SECRET').required().asString(),
      ignoreExpiration: false,
      algorithms: [TOKEN_CONSTANTS.ACCESS_TOKEN.ALGORITHM],
    });
  }

  async validate(payload: TokenPayload): Promise<any> {
    if (!payload || !payload.userId)
      throw new GenericHttpException('Invalid token', 401);

    const result = await this.authService.getUserAndSessionFromPayload(payload);

    if (!result) throw new GenericHttpException('Invalid token', 401);

    const { user, session } = result;

    // Load user with role and permissions
    const userWithRole = await this.authService.getUserWithRoleAndPermissions(
      user.id,
    );

    console.log('🔍 JWT Strategy - User with branch:', {
      userId: userWithRole.id,
      userName: userWithRole.name,
      branchId: userWithRole.branchId,
      branchName: (userWithRole as any).branch?.name,
    });

    return { ...userWithRole, session };
  }
}
