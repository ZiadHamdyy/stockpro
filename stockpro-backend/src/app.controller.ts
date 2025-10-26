import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthenticationGuard } from './common/guards/strategy.guards/jwt.guard';

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
}
