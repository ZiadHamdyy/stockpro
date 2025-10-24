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

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['customers:create'] })
  async create(
    @Body() createCustomerDto: CreateCustomerRequest,
  ): Promise<CustomerResponse> {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @Auth({ permissions: ['customers:read'] })
  async findAll(@Query('search') search?: string): Promise<CustomerResponse[]> {
    return this.customerService.findAll(search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['customers:read'] })
  async findByCode(@Param('code') code: string): Promise<CustomerResponse> {
    return this.customerService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['customers:read'] })
  async findOne(@Param('id') id: string): Promise<CustomerResponse> {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['customers:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerRequest,
  ): Promise<CustomerResponse> {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['customers:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.customerService.remove(id);
  }
}
