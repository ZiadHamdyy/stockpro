import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../modules/company/company.service';
import { RequestWithCompany } from '../types/request.type';

@Injectable()
export class CompanyMiddleware implements NestMiddleware {
  constructor(private readonly companyService: CompanyService) {}

  async use(req: RequestWithCompany, res: Response, next: NextFunction) {
    // Extract host from request headers - try multiple sources
    let host =
      req.get('x-company-host') ||
      req.get('host') ||
      req.get('x-forwarded-host') ||
      req.get('x-host') ||
      (req.headers.host as string) ||
      (req.headers['x-forwarded-host'] as string);

    console.log('CompanyMiddleware - Raw host:', host);

    // Clean up the host (remove port if present)
    if (host && typeof host === 'string') {
      host = host.split(':')[0];
    }

    console.log('CompanyMiddleware - Cleaned host:', host);

    if (host && typeof host === 'string') {
      try {
        // Find company by host
        const company = await this.companyService.findByHost(host);

        console.log('CompanyMiddleware - Found company:', {
          id: company.id,
          name: company.name,
          host: company.host,
        });

        // Store companyId in request object
        req.companyId = company.id;
        req.company = company;
      } catch (error) {
        console.log(
          'CompanyMiddleware - Error finding company:',
          error.message,
        );
        // For development, you might want to use a default company
        // This is just for testing - remove in production
        // if (host === 'localhost' || host === '127.0.0.1') {
        //   try {
        //     const defaultCompany = await this.companyService.findByHost('localhost');
        //     req.companyId = defaultCompany.id;
        //     req.company = defaultCompany;
        //   } catch (defaultError) {
        //     // Silently continue without company context
        //   }
        // }
      }
    } else {
      console.log('CompanyMiddleware - No host found in request');
    }

    next();
  }
}
