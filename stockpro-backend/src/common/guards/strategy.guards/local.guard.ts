import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor() {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest();
  }
}
