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
import { CustomerService } from './customer.service';
import { CreateCustomerRequest } from './dtos/request/create-customer.request';
import { UpdateCustomerRequest } from './dtos/request/update-customer.request';
import { CustomerResponse } from './dtos/response/customer.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['customers:create'] })
  async create(
    @Body() createCustomerDto: CreateCustomerRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CustomerResponse> {
    return this.customerService.create(companyId, createCustomerDto);
  }

  @Get()
  @Auth({ permissions: ['customers:read'] })
  async findAll(
    @Query('search') search?: string,
    @currentCompany('id') companyId?: string,
  ): Promise<CustomerResponse[]> {
    return this.customerService.findAll(companyId!, search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['customers:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<CustomerResponse> {
    return this.customerService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['customers:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<CustomerResponse> {
    return this.customerService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['customers:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerRequest,
    @currentCompany('id') companyId: string,
  ): Promise<CustomerResponse> {
    return this.customerService.update(companyId, id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['customers:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.customerService.remove(companyId, id);
  }
}
