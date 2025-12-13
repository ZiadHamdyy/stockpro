import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GenericHttpException } from '../application/exceptions';
import { RequestWithCompany } from '../types/request.type';

export const currentCompany = createParamDecorator(
  (fieldName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithCompany>();
    const { companyId, company } = request;

    if (!companyId) {
      throw new GenericHttpException('Company not found', 404);
    }

    if (fieldName) {
      return company ? company[fieldName] : companyId;
    }

    return company || { id: companyId };
  },
);
