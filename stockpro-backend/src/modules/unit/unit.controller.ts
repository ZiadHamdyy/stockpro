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
  UseGuards,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitRequest } from './dtos/request/create-unit.request';
import { UpdateUnitRequest } from './dtos/request/update-unit.request';
import { UnitResponse } from './dtos/response/unit.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('units')
@UseGuards(JwtAuthenticationGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['units:create'] })
  async create(
    @Body() createUnitDto: CreateUnitRequest,
    @currentCompany('id') companyId: string,
  ): Promise<UnitResponse> {
    return this.unitService.create(companyId, createUnitDto);
  }

  @Get()
  @Auth({ permissions: ['units:read'] })
  async findAll(
    @currentCompany('id') companyId: string,
  ): Promise<UnitResponse[]> {
    return this.unitService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['units:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<UnitResponse> {
    return this.unitService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['units:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitRequest,
    @currentCompany('id') companyId: string,
  ): Promise<UnitResponse> {
    return this.unitService.update(companyId, id, updateUnitDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['units:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.unitService.remove(companyId, id);
  }
}
