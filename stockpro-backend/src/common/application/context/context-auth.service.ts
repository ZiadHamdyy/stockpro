import { Injectable } from '@nestjs/common';
import { TokenPayload } from '../../types/auth-token-payload.type';
import { IContextAuthService } from './context-auth.interface';
import { GenericHttpException } from '../exceptions/generic-http-exception';
import { User, Session, SessionStatus } from '@prisma/client';
import { Request } from 'express';
import { get } from 'env-var';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../../../configs/database/database.service';
import { bufferToDataUri } from '../../utils/image-converter';

@Injectable()
export class ContextAuthService implements IContextAuthService {
  constructor(private readonly prisma: DatabaseService) {}

  public hasPermission(
    permission: string,
    user: User & { role?: any },
  ): boolean {
    if (!user.role || !user.role.rolePermissions) {
      return false;
    }

    // Check if user has the specific permission
    const hasPermission = user.role.rolePermissions.some(
      (rp: any) =>
        rp.permission.resource === permission.split(':')[0] &&
        rp.permission.action === permission.split(':')[1],
    );

    return hasPermission;
  }

  public hasAllPermissions(
    permissions: string[],
    user: User & { role?: any },
  ): boolean {
    if (!user.role || !user.role.rolePermissions) {
      return false;
    }

    // Check if user has ALL specified permissions
    return permissions.every((permission) =>
      this.hasPermission(permission, user),
    );
  }

  async getUserWithRoleAndPermissions(
    userId: string,
  ): Promise<User & { role?: any; branch?: any }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        branch: true,
      },
    });

    if (!user) {
      throw new GenericHttpException('User not found', 404);
    }

    // Convert image Buffer to data URI for proper frontend display
    console.log('🔍 ContextAuth - User image before conversion:', {
      type: typeof user.image,
      isBuffer: Buffer.isBuffer(user.image),
      hasImage: !!user.image,
      length: user.image?.length || 'no length'
    });
    
    const convertedImage = user.image ? bufferToDataUri(user.image) : null;
    
    console.log('🔍 ContextAuth - User image after conversion:', {
      type: typeof convertedImage,
      length: convertedImage?.length || 'no length',
      preview: convertedImage?.substring(0, 50) || 'null'
    });
    
    return {
      ...user,
      image: convertedImage,
    } as any;
  }

  async getUserFromReqHeaders(req: Request): Promise<User | null> {
    let auth: string | undefined;
    if (req.headers.authorization) auth = req.headers.authorization;
    if (req.headers.Authorization) auth = <string>req.headers.Authorization;

    if (!auth) return null;

    const token = auth.split('Bearer ')[1] || null;
    if (!token) return null;

    try {
      const secretOrKey = get('JWT_SECRET').required().asString();
      const payload = <TokenPayload>jwt.verify(token, secretOrKey);
      const result = await this.getUserAndSessionFromPayload(payload);

      if (!result) return null;
      return result.user;
    } catch {
      throw new GenericHttpException('Invalid token', 401);
    }
  }

  public async getUserAndSessionFromPayload(
    payload: TokenPayload,
  ): Promise<{ user: User; session: Session } | null> {
    if (!payload) return null;
    const { userId, sessionId } = payload;

    const user = await this.findAndValidateUser(userId);
    const session = await this.findSessionOrThrow(sessionId);

    return { user, session };
  }

  private async findAndValidateUser(userId: string): Promise<User> {
    if (!userId) throw new GenericHttpException('Invalid token', 401);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new GenericHttpException('Invalid token', 401);
    else if (!user.active) throw new GenericHttpException('Blocked user', 401);
    else if (!user.emailVerified)
      throw new GenericHttpException('User is not verified', 401);

    return user;
  }

  private async findSessionOrThrow(sessionId: string): Promise<Session> {
    if (!sessionId) throw new GenericHttpException('Invalid token', 401);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId, status: SessionStatus.ACTIVE },
    });

    if (!session) throw new GenericHttpException('Invalid token', 401);
    else return session;
  }
}
