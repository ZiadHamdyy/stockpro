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
  Query,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankRequest } from './dtos/request/create-bank.request';
import { UpdateBankRequest } from './dtos/request/update-bank.request';
import { BankResponse } from './dtos/response/bank.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['banks:create'] })
  async create(
    @Body() createBankDto: CreateBankRequest,
    @currentCompany('id') companyId: string,
  ): Promise<BankResponse> {
    return this.bankService.create(companyId, createBankDto);
  }

  @Get()
  @Auth({ permissions: ['banks:read'] })
  async findAll(
    @Query('search') search?: string,
    @currentCompany('id') companyId?: string,
  ): Promise<BankResponse[]> {
    return this.bankService.findAll(companyId!, search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['banks:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<BankResponse> {
    return this.bankService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['banks:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<BankResponse> {
    return this.bankService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['banks:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateBankDto: UpdateBankRequest,
    @currentCompany('id') companyId: string,
  ): Promise<BankResponse> {
    return this.bankService.update(companyId, id, updateBankDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['banks:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.bankService.remove(companyId, id);
  }
}
