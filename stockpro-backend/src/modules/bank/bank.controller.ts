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

@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['banks:create'] })
  async create(
    @Body() createBankDto: CreateBankRequest,
  ): Promise<BankResponse> {
    return this.bankService.create(createBankDto);
  }

  @Get()
  @Auth({ permissions: ['banks:read'] })
  async findAll(@Query('search') search?: string): Promise<BankResponse[]> {
    return this.bankService.findAll(search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['banks:read'] })
  async findByCode(@Param('code') code: string): Promise<BankResponse> {
    return this.bankService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['banks:read'] })
  async findOne(@Param('id') id: string): Promise<BankResponse> {
    return this.bankService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['banks:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateBankDto: UpdateBankRequest,
  ): Promise<BankResponse> {
    return this.bankService.update(id, updateBankDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['banks:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.bankService.remove(id);
  }
}
