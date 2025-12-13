import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IncomeStatementService } from './income-statement.service';
import { IncomeStatementResponse } from './dtos/response/income-statement.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('income-statement')
@UseGuards(JwtAuthenticationGuard)
export class IncomeStatementController {
  constructor(
    private readonly incomeStatementService: IncomeStatementService,
  ) {}

  @Get()
  @Auth({ permissions: ['income_statement:read'] })
  async getIncomeStatement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @currentCompany('id') companyId: string,
  ): Promise<IncomeStatementResponse> {
    return this.incomeStatementService.getIncomeStatement(companyId, startDate, endDate);
  }
}
