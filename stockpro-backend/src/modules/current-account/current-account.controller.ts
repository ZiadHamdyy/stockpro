import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccountService } from './current-account.service';
import { CreateCurrentAccountRequest } from './dtos/request/create-current-account.request';
import { UpdateCurrentAccountRequest } from './dtos/request/update-current-account.request';
import { CurrentAccountResponse } from './dtos/response/current-account.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('current-accounts')
@UseGuards(JwtAuthenticationGuard)
export class CurrentAccountController {
  constructor(private readonly currentAccountService: CurrentAccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['current_accounts:create'] })
  async create(
    @Body() createCurrentAccountDto: CreateCurrentAccountRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.create(companyId, createCurrentAccountDto);
  }

  @Get()
  @Auth({ permissions: ['current_accounts:read'] })
  async findAll(
    @currentCompany('id') companyId: string,
  ): Promise<CurrentAccountResponse[]> {
    return this.currentAccountService.findAll(companyId);
  }

  @Get('code/:code')
  @Auth({ permissions: ['current_accounts:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['current_accounts:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['current_accounts:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateCurrentAccountDto: UpdateCurrentAccountRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.update(companyId, id, updateCurrentAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['current_accounts:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.currentAccountService.remove(companyId, id);
  }
}
