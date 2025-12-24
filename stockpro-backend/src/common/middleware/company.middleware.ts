import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../modules/company/company.service';
import { RequestWithCompany } from '../types/request.type';
import { TokenPayload } from '../types/auth-token-payload.type';
import { get } from 'env-var';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CompanyMiddleware implements NestMiddleware {
  constructor(private readonly companyService: CompanyService) {}

  async use(req: RequestWithCompany, res: Response, next: NextFunction) {
    // Extract company code from headers first
    let companyCode = req.get('x-company-code');

    console.log('CompanyMiddleware - Company code from header:', companyCode);

    // If not in header, try to extract from JWT token
    if (!companyCode) {
      try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && typeof authHeader === 'string') {
          const token = authHeader.split('Bearer ')[1];
          if (token) {
            const secretOrKey = get('JWT_SECRET').required().asString();
            const payload = jwt.verify(token, secretOrKey) as TokenPayload;
            companyCode = payload.companyCode;
            console.log('CompanyMiddleware - Company code from token:', companyCode);
          }
        }
      } catch (error) {
        // Token might be invalid or expired, continue without company code
        console.log('CompanyMiddleware - Could not extract code from token:', error.message);
      }
    }

    if (companyCode && typeof companyCode === 'string') {
      try {
        // Find company by code
        const company = await this.companyService.findByCode(companyCode);

        console.log('CompanyMiddleware - Found company:', {
          id: company.id,
          name: company.name,
          code: company.code,
        });

        // Store companyId in request object
        req.companyId = company.id;
        req.company = company;
      } catch (error) {
        console.log(
          'CompanyMiddleware - Error finding company:',
          error.message,
        );
      }
    } else {
      console.log('CompanyMiddleware - No company code found in request');
    }

    next();
  }
}
