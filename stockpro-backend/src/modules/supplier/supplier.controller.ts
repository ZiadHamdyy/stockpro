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
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['suppliers:create'] })
  async create(
    @Body() createSupplierDto: CreateSupplierRequest,
    @currentCompany('id') companyId: string,
  ): Promise<SupplierResponse> {
    return this.supplierService.create(companyId, createSupplierDto);
  }

  @Get()
  @Auth({ permissions: ['suppliers:read'] })
  async findAll(
    @Query('search') search?: string,
    @currentCompany('id') companyId?: string,
  ): Promise<SupplierResponse[]> {
    return this.supplierService.findAll(companyId!, search);
  }

  @Get('code/:code')
  @Auth({ permissions: ['suppliers:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<SupplierResponse> {
    return this.supplierService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['suppliers:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<SupplierResponse> {
    return this.supplierService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['suppliers:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierRequest,
    @currentCompany('id') companyId: string,
  ): Promise<SupplierResponse> {
    return this.supplierService.update(companyId, id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['suppliers:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.supplierService.remove(companyId, id);
  }
}
