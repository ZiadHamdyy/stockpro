import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ContextModule } from '../../common/application/context/context.module';
import { HelperModule } from '../../common/utils/helper/helper.module';
import { EmailModule } from '../../common/services/email.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from '../session/session.module';
import { LocalStrategy } from '../../common/strategies/local.strategy';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { TOKEN_CONSTANTS } from '../../common/constants';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const options: JwtModuleOptions = {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            algorithm: TOKEN_CONSTANTS.ACCESS_TOKEN.ALGORITHM,
            issuer: TOKEN_CONSTANTS.SECURITY.JWT_ISSUER,
            audience: TOKEN_CONSTANTS.SECURITY.JWT_AUDIENCE,
          },
          verifyOptions: {
            algorithms: [TOKEN_CONSTANTS.ACCESS_TOKEN.ALGORITHM],
            issuer: TOKEN_CONSTANTS.SECURITY.JWT_ISSUER,
            audience: TOKEN_CONSTANTS.SECURITY.JWT_AUDIENCE,
          },
        };
        return options;
      },
    }),
    ContextModule,
    PassportModule,
    UserModule,
    HelperModule,
    SessionModule,
    EmailModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshTokenGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
