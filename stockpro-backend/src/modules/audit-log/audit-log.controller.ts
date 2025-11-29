import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { GetAuditLogsDto } from './dtos/get-audit-logs.dto';
import { AuditLogResponse } from './dtos/audit-log.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthenticationGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Auth({ permissions: ['audit_log:read'] })
  async findAll(
    @Query() filters: GetAuditLogsDto,
  ): Promise<{ data: AuditLogResponse[] }> {
    const logs = await this.auditLogService.findAll(filters);
    return { data: logs };
  }
}

