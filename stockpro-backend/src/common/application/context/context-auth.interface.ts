import { Session, User } from '@prisma/client';
import { TokenPayload } from '../../types/auth-token-payload.type';
import { Request } from 'express';

export const IContextAuthServiceToken = 'IContextAuthService';

export interface IContextAuthService {
  getUserAndSessionFromPayload(
    payload: TokenPayload,
  ): Promise<{ user: User; session: Session } | null>;

  getUserFromReqHeaders(req: Request): Promise<User | null>;

  hasPermission(permission: string, user: User): boolean;
}
