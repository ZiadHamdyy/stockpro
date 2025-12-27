import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditTrialService } from './audit-trial.service';
import { AuditTrialResponse } from './dtos/response/audit-trial.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('audit-trial')
@UseGuards(JwtAuthenticationGuard)
export class AuditTrialController {
  constructor(private readonly auditTrialService: AuditTrialService) {}

  @Get()
  @Auth({ permissions: ['audit_trail:read'] })
  async getAuditTrial(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @currentCompany('id') companyId: string,
  ): Promise<AuditTrialResponse> {
    return this.auditTrialService.getAuditTrial(companyId, startDate, endDate);
  }
}

