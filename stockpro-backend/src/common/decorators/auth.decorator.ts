import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { MediatorGuard } from '../guards/auth.guards/mediator.guard';

export interface AuthOpts {
  roles?: string[]; // Dynamic role names (OR logic - any role matches)
  permissions?: string[]; // Permission codes (AND logic - all required)
  statusCode?: number; // Custom error status code
}

export const SetAuthOpts = (opts: AuthOpts) => SetMetadata('authOpts', opts);

export const Auth = (opts: AuthOpts = {}) =>
  applyDecorators(SetMetadata('authOpts', opts), UseGuards(MediatorGuard));
