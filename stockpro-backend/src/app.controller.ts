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
  async getDashboardStats(@currentCompany('id') companyId: string) {
    return this.appService.getDashboardStats(companyId);
  }

  @Get('dashboard/monthly-stats')
  @UseGuards(JwtAuthenticationGuard)
  async getMonthlyStats(@currentCompany('id') companyId: string) {
    return this.appService.getMonthlyStats(companyId);
  }

  @Get('dashboard/sales-by-item-group')
  @UseGuards(JwtAuthenticationGuard)
  async getSalesByItemGroup(@currentCompany('id') companyId: string) {
    return this.appService.getSalesByItemGroup(companyId);
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
