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
import { currentCompany } from '../../common/decorators/company.decorator';
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
    @currentCompany('id') companyId: string,
  ): Promise<PayableAccountResponse> {
    return this.service.create(companyId, dto);
  }

  @Get()
  @Auth({ permissions: ['payable_accounts:read'] })
  async findAll(
    @currentCompany('id') companyId: string,
  ): Promise<PayableAccountResponse[]> {
    return this.service.findAll(companyId);
  }

  @Get('code/:code')
  @Auth({ permissions: ['payable_accounts:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<PayableAccountResponse> {
    return this.service.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['payable_accounts:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<PayableAccountResponse> {
    return this.service.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['payable_accounts:update'] })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePayableAccountRequest,
    @currentCompany('id') companyId: string,
  ): Promise<PayableAccountResponse> {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['payable_accounts:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.service.remove(companyId, id);
  }
}
