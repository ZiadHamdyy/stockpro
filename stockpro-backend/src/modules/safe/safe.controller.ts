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

@Controller('safes')
export class SafeController {
  constructor(private readonly safeService: SafeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['safes:create'] })
  async create(
    @Body() createSafeDto: CreateSafeRequest,
  ): Promise<SafeResponse> {
    return this.safeService.create(createSafeDto);
  }

  @Get()
  @Auth({ permissions: ['safes:read'] })
  async findAll(@Query('search') search?: string): Promise<SafeResponse[]> {
    return this.safeService.findAll(search);
  }

  @Get('available-branches')
  @Auth({ permissions: ['safes:read'] })
  async availableBranches(@Query('includeId') includeId?: string) {
    return this.safeService.findAvailableBranches(includeId);
  }

  @Get('code/:code')
  @Auth({ permissions: ['safes:read'] })
  async findByCode(@Param('code') code: string): Promise<SafeResponse> {
    return this.safeService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['safes:read'] })
  async findOne(@Param('id') id: string): Promise<SafeResponse> {
    return this.safeService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['safes:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSafeDto: UpdateSafeRequest,
  ): Promise<SafeResponse> {
    return this.safeService.update(id, updateSafeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['safes:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.safeService.remove(id);
  }
}
