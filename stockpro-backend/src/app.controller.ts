import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthenticationGuard } from './common/guards/strategy.guards/jwt.guard';
import { Auth } from './common/decorators/auth.decorator';
import { currentCompany } from './common/decorators/company.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthenticationGuard)
  async getDashboardStats() {
    return this.appService.getDashboardStats();
  }

  @Get('dashboard/monthly-stats')
  @UseGuards(JwtAuthenticationGuard)
  async getMonthlyStats() {
    return this.appService.getMonthlyStats();
  }

  @Get('dashboard/sales-by-item-group')
  @UseGuards(JwtAuthenticationGuard)
  async getSalesByItemGroup() {
    return this.appService.getSalesByItemGroup();
  }

  @Get('annual-sales-report')
  @UseGuards(JwtAuthenticationGuard)
  @Auth({ permissions: ['annual_sales_report:read'] })
  async getAnnualSalesReport(
    @currentCompany('id') companyId: string,
    @Query('year') year?: string,
    @Query('branchIds') branchIds?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
    const branchIdsArray = branchIds ? branchIds.split(',').filter(Boolean) : undefined;
    return this.appService.getAnnualSalesReport(companyId, yearNum, branchIdsArray);
  }
}
