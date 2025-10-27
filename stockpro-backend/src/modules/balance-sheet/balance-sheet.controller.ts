import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BalanceSheetService } from './balance-sheet.service';
import { BalanceSheetResponse } from './dtos/response/balance-sheet.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('balance-sheet')
@UseGuards(JwtAuthenticationGuard)
export class BalanceSheetController {
  constructor(private readonly balanceSheetService: BalanceSheetService) {}

  @Get()
  @Auth({ permissions: ['balance_sheet:read'] })
  async getBalanceSheet(
    @Query('endDate') endDate: string,
  ): Promise<BalanceSheetResponse> {
    return this.balanceSheetService.getBalanceSheet(endDate);
  }
}
