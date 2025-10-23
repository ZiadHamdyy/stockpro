import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GenericHttpException } from '../application/exceptions';

export const currentUser = createParamDecorator(
  (fieldName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const { user } = request;

    if (!user) throw new GenericHttpException('Unauthorized', 401);
    if (fieldName) return user[fieldName];
    return user;
  },
);
