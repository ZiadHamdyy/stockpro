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

@Controller('current-accounts')
@UseGuards(JwtAuthenticationGuard)
export class CurrentAccountController {
  constructor(private readonly currentAccountService: CurrentAccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['current_accounts:create'] })
  async create(
    @Body() createCurrentAccountDto: CreateCurrentAccountRequest,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.create(createCurrentAccountDto);
  }

  @Get()
  @Auth({ permissions: ['current_accounts:read'] })
  async findAll(): Promise<CurrentAccountResponse[]> {
    return this.currentAccountService.findAll();
  }

  @Get('code/:code')
  @Auth({ permissions: ['current_accounts:read'] })
  async findByCode(
    @Param('code') code: string,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['current_accounts:read'] })
  async findOne(@Param('id') id: string): Promise<CurrentAccountResponse> {
    return this.currentAccountService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['current_accounts:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateCurrentAccountDto: UpdateCurrentAccountRequest,
  ): Promise<CurrentAccountResponse> {
    return this.currentAccountService.update(id, updateCurrentAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['current_accounts:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.currentAccountService.remove(id);
  }
}
