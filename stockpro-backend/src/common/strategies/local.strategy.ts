import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../modules/auth/auth.service';
import { GenericHttpException } from '../application/exceptions';
import { RequestWithCompany } from '../types/request.type';
import { CompanyService } from '../../modules/company/company.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    req: RequestWithCompany,
    email: string,
    password: string,
  ): Promise<any> {
    console.log('LocalStrategy - validate called');
    console.log('LocalStrategy - Request headers:', req.headers);
    console.log('LocalStrategy - Request URL:', req.url);
    console.log('LocalStrategy - Request method:', req.method);

    // Get companyId from request context (set by CompanyMiddleware)
    let { companyId } = req;

    console.log('LocalStrategy - companyId from request:', companyId);

    // If companyId is not set by middleware, try to find it ourselves
    if (!companyId) {
      console.log(
        'LocalStrategy - No companyId from middleware, trying to find company...',
      );

      // Extract host from request headers
      let host =
        req.get('host') ||
        req.get('x-forwarded-host') ||
        req.get('x-host') ||
        (req.headers.host as string) ||
        (req.headers['x-forwarded-host'] as string);

      console.log('LocalStrategy - Raw host:', host);

      // Clean up the host (remove port if present)
      if (host && typeof host === 'string') {
        host = host.split(':')[0];
      }

      console.log('LocalStrategy - Cleaned host:', host);

      if (host && typeof host === 'string') {
        try {
          const company = await this.companyService.findByHost(host);
          companyId = company.id;
          console.log('LocalStrategy - Found company:', companyId);
        } catch (error) {
          console.log(
            'LocalStrategy - Error finding company:',
            error.message,
          );
          throw new GenericHttpException(
            'Company not found for this host',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        console.log('LocalStrategy - No host found in request');
        throw new GenericHttpException(
          'Company not found for this host',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    console.log('LocalStrategy - Final companyId:', companyId);

    if (!companyId) {
      console.log('LocalStrategy - No companyId found, throwing error');
      throw new GenericHttpException(
        'Company not found for this host',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('LocalStrategy - CompanyId found, validating user...');
    const user = await this.authService.validateUser(
      email,
      password,
      companyId,
    );
    if (!user)
      throw new GenericHttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    else return user;
  }
}
