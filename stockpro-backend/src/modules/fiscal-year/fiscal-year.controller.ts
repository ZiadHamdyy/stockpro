import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FiscalYearService } from './fiscal-year.service';
import { CreateFiscalYearRequest } from './dtos/request/create-fiscal-year.request';
import { UpdateFiscalYearRequest } from './dtos/request/update-fiscal-year.request';
import { FiscalYearResponse } from './dtos/response/fiscal-year.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('fiscal-years')
@UseGuards(JwtAuthenticationGuard)
export class FiscalYearController {
  constructor(private readonly fiscalYearService: FiscalYearService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['fiscal_years:create'] })
  async create(
    @Body() createFiscalYearDto: CreateFiscalYearRequest,
  ): Promise<FiscalYearResponse> {
    return this.fiscalYearService.create(createFiscalYearDto);
  }

  @Get()
  @Auth({ permissions: ['fiscal_years:read'] })
  async findAll(): Promise<FiscalYearResponse[]> {
    return this.fiscalYearService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['fiscal_years:read'] })
  async findOne(@Param('id') id: string): Promise<FiscalYearResponse> {
    return this.fiscalYearService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['fiscal_years:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateFiscalYearDto: UpdateFiscalYearRequest,
  ): Promise<FiscalYearResponse> {
    return this.fiscalYearService.update(id, updateFiscalYearDto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['fiscal_years:update'] })
  async close(
    @Param('id') id: string,
    @currentUser() user: any,
  ): Promise<FiscalYearResponse> {
    return this.fiscalYearService.close(id, user.id);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['fiscal_years:update'] })
  async reopen(
    @Param('id') id: string,
    @currentUser() user: any,
  ): Promise<FiscalYearResponse> {
    return this.fiscalYearService.reopen(id, user.id);
  }
}

