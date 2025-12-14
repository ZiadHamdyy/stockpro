import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GenericHttpException } from '../application/exceptions';
import { RequestWithCompany } from '../types/request.type';
import type { currentUserType } from '../types/current-user.type';

export const currentCompany = createParamDecorator(
  (fieldName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<
      RequestWithCompany & { user?: currentUserType }
    >();
    const { companyId, company } = request;
    const user = request.user;

    // SUPER_ADMIN can access any company via query params or body
    if (user?.role?.name === 'SUPER_ADMIN') {
      const queryCompanyId = request.query?.companyId as string | undefined;
      const bodyCompanyId = request.body?.companyId as string | undefined;
      const targetCompanyId = queryCompanyId || bodyCompanyId || companyId;

      if (!targetCompanyId) {
        throw new GenericHttpException('Company ID is required', 400);
      }

      if (fieldName) {
        return targetCompanyId;
      }

      return { id: targetCompanyId };
    }or

    // Regular users use company from request context
    if (!companyId) {
      throw new GenericHttpException('Company not found', 404);
    }

    if (fieldName) {
      return company ? company[fieldName] : companyId;
    }

    return company || { id: companyId };
  },
);
