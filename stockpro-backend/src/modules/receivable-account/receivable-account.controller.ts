import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { ReceivableAccountService } from './receivable-account.service';
import { CreateReceivableAccountRequest } from './dtos/request/create-receivable-account.request';
import { UpdateReceivableAccountRequest } from './dtos/request/update-receivable-account.request';
import { ReceivableAccountResponse } from './dtos/response/receivable-account.response';

@Controller('receivable-accounts')
@UseGuards(JwtAuthenticationGuard)
export class ReceivableAccountController {
  constructor(private readonly service: ReceivableAccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['receivable_accounts:create'] })
  async create(
    @Body() dto: CreateReceivableAccountRequest,
  ): Promise<ReceivableAccountResponse> {
    return this.service.create(dto);
  }

  @Get()
  @Auth({ permissions: ['receivable_accounts:read'] })
  async findAll(): Promise<ReceivableAccountResponse[]> {
    return this.service.findAll();
  }

  @Get('code/:code')
  @Auth({ permissions: ['receivable_accounts:read'] })
  async findByCode(
    @Param('code') code: string,
  ): Promise<ReceivableAccountResponse> {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['receivable_accounts:read'] })
  async findOne(@Param('id') id: string): Promise<ReceivableAccountResponse> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['receivable_accounts:update'] })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReceivableAccountRequest,
  ): Promise<ReceivableAccountResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['receivable_accounts:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
