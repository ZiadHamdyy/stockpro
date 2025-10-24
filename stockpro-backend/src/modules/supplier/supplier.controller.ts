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
import { SupplierService } from './supplier.service';
import { CreateSupplierRequest } from './dtos/request/create-supplier.request';
import { UpdateSupplierRequest } from './dtos/request/update-supplier.request';
import { SupplierResponse } from './dtos/response/supplier.response';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['suppliers:create'] })
  async create(
    @Body() createSupplierDto: CreateSupplierRequest,
  ): Promise<SupplierResponse> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @Auth({ permissions: ['suppliers:read'] })
  async findAll(@Query('search') search?: string): Promise<SupplierResponse[]> {
    return this.supplierService.findAll(search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['suppliers:read'] })
  async findByCode(@Param('code') code: string): Promise<SupplierResponse> {
    return this.supplierService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['suppliers:read'] })
  async findOne(@Param('id') id: string): Promise<SupplierResponse> {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['suppliers:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierRequest,
  ): Promise<SupplierResponse> {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['suppliers:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.supplierService.remove(id);
  }
}
