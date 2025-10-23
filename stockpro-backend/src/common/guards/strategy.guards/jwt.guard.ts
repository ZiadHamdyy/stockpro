import { AuthGuard } from '@nestjs/passport';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest();
  }
}
