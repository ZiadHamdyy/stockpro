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
import { SafeService } from './safe.service';
import { CreateSafeRequest } from './dtos/request/create-safe.request';
import { UpdateSafeRequest } from './dtos/request/update-safe.request';
import { SafeResponse } from './dtos/response/safe.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('safes')
export class SafeController {
  constructor(private readonly safeService: SafeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['safes:create'] })
  async create(
    @Body() createSafeDto: CreateSafeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<SafeResponse> {
    return this.safeService.create(companyId, createSafeDto);
  }

  @Get()
  @Auth({ permissions: ['safes:read'] })
  async findAll(
    @Query('search') search?: string,
    @currentCompany('id') companyId?: string,
  ): Promise<SafeResponse[]> {
    return this.safeService.findAll(companyId!, search);
  }

  @Get('available-branches')
  @Auth({ permissions: ['safes:read'] })
  async availableBranches(
    @Query('includeId') includeId?: string,
    @currentCompany('id') companyId?: string,
  ) {
    return this.safeService.findAvailableBranches(companyId!, includeId);
  }

  @Get('code/:code')
  @Auth({ permissions: ['safes:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<SafeResponse> {
    return this.safeService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['safes:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<SafeResponse> {
    return this.safeService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['safes:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSafeDto: UpdateSafeRequest,
    @currentCompany('id') companyId: string,
  ): Promise<SafeResponse> {
    return this.safeService.update(companyId, id, updateSafeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['safes:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.safeService.remove(companyId, id);
  }
}
