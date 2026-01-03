import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IContextAuthService } from '../../application/context/context-auth.interface';
import { IContextAuthServiceToken } from '../../application/context/context-auth.interface';
import type { AuthOpts } from '../../decorators/auth.decorator';
import { GenericHttpException } from '../../application/exceptions';
import type { Request } from 'express';
import type { currentUserType } from '../../types/current-user.type';
import type { User } from '@prisma/client';

@Injectable()
export class MediatorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(IContextAuthServiceToken)
    private readonly authService: IContextAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authOpts =
      this.reflector.get<AuthOpts>('authOpts', context.getHandler()) ||
      this.reflector.get<AuthOpts>('authOpts', context.getClass());

    // First, authenticate the user using JWT
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: currentUserType }>();
    if (!request.user) {
      try {
        console.log(
          'MediatorGuard: No user in request, attempting JWT authentication...',
        );
        const user = await this.authService.getUserFromReqHeaders(request);
        if (!user) {
          console.log(
            'MediatorGuard: No user returned from getUserFromReqHeaders',
          );
          throw new GenericHttpException('Unauthorized', 401);
        }
        console.log('MediatorGuard: User authenticated successfully:', {
          userId: user.id,
          roleId: user.roleId,
        });
        request.user = user;
      } catch (error: unknown) {
        console.log(
          'MediatorGuard: Authentication failed:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        throw new GenericHttpException('Unauthorized', 401);
      }
    } else {
      console.log('MediatorGuard: User already in request:', {
        userId: request.user.id,
        roleId: request.user.roleId,
      });
    }

    // Ensure user has role and permissions loaded
    if (!request.user.role || !request.user.role.rolePermissions) {
      const userWithRole = await this.authService.getUserWithRoleAndPermissions(
        request.user.id,
      );
      request.user = userWithRole;
    }

    // Check roles if specified (OR logic - user must have ANY one of the specified roles)
    if (authOpts?.roles && authOpts.roles.length > 0) {
      const hasRole = authOpts.roles.some(
        (role) => request.user?.role?.name === role,
      );

      if (!hasRole) {
        console.log(
          'MediatorGuard: Access denied - user does not have required role:',
          {
            userRole: request.user?.role?.name,
            requiredRoles: authOpts.roles,
          },
        );
        throw new GenericHttpException(
          'Unauthorized',
          authOpts.statusCode || 401,
        );
      }

      console.log('MediatorGuard: Role check passed:', {
        userRole: request.user?.role?.name,
        requiredRoles: authOpts.roles,
      });
    }

    // Check permissions if specified (AND logic - user must have ALL specified permissions)
    if (authOpts?.permissions && authOpts.permissions.length > 0) {
      if (!request.user) {
        throw new GenericHttpException('Unauthorized', 401);
      }

      // SUPER_ADMIN bypasses all permission checks
      if (request.user?.role?.name === 'SUPER_ADMIN') {
        console.log('MediatorGuard: SUPER_ADMIN detected - bypassing permission checks');
        return true;
      }

      // Check if user has all required permissions
      const missingPermissions: string[] = [];
      for (const permission of authOpts.permissions) {
        if (
          !this.authService.hasPermission(
            permission,
            request.user as User & { role?: any },
          )
        ) {
          missingPermissions.push(permission);
        }
      }

      if (missingPermissions.length > 0) {
        const userPermissions = request.user?.role?.rolePermissions?.map(
          (rp: { permission: { resource: string; action: string } }) =>
            `${rp.permission.resource}:${rp.permission.action}`,
        ) || [];

        console.log(
          'MediatorGuard: Access denied - user does not have all required permissions:',
          {
            userPermissions,
            requiredPermissions: authOpts.permissions,
            missingPermissions,
          },
        );
        throw new GenericHttpException(
          'Forbidden',
          authOpts.statusCode || 403,
          undefined,
          {
            missingPermissions,
            requiredPermissions: authOpts.permissions,
            userPermissions,
          },
        );
      }

      console.log('MediatorGuard: Permission check passed:', {
        requiredPermissions: authOpts.permissions,
      });
    }

    return true;
  }
}
