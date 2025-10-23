import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GenericHttpException } from '../application/exceptions';
import type { currentUserType } from '../types/current-user.type';
import type { Request } from 'express';

export const currentUser = createParamDecorator(
  (fieldName: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: currentUserType }>();
    const { user } = request;

    if (!user) throw new GenericHttpException('Unauthorized', 401);
    if (fieldName) return (user as Record<string, any>)[fieldName];
    return user;
  },
);
