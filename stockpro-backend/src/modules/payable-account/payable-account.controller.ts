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
import { PayableAccountService } from './payable-account.service';
import { CreatePayableAccountRequest } from './dtos/request/create-payable-account.request';
import { UpdatePayableAccountRequest } from './dtos/request/update-payable-account.request';
import { PayableAccountResponse } from './dtos/response/payable-account.response';

@Controller('payable-accounts')
@UseGuards(JwtAuthenticationGuard)
export class PayableAccountController {
  constructor(private readonly service: PayableAccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['payable_accounts:create'] })
  async create(
    @Body() dto: CreatePayableAccountRequest,
  ): Promise<PayableAccountResponse> {
    return this.service.create(dto);
  }

  @Get()
  @Auth({ permissions: ['payable_accounts:read'] })
  async findAll(): Promise<PayableAccountResponse[]> {
    return this.service.findAll();
  }

  @Get('code/:code')
  @Auth({ permissions: ['payable_accounts:read'] })
  async findByCode(
    @Param('code') code: string,
  ): Promise<PayableAccountResponse> {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['payable_accounts:read'] })
  async findOne(@Param('id') id: string): Promise<PayableAccountResponse> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['payable_accounts:update'] })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePayableAccountRequest,
  ): Promise<PayableAccountResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['payable_accounts:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
