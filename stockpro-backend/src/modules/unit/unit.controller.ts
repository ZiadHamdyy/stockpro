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
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitRequest } from './dtos/request/create-unit.request';
import { UpdateUnitRequest } from './dtos/request/update-unit.request';
import { UnitResponse } from './dtos/response/unit.response';

@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUnitDto: CreateUnitRequest,
  ): Promise<UnitResponse> {
    return this.unitService.create(createUnitDto);
  }

  @Get()
  async findAll(): Promise<UnitResponse[]> {
    return this.unitService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UnitResponse> {
    return this.unitService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitRequest,
  ): Promise<UnitResponse> {
    return this.unitService.update(id, updateUnitDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.unitService.remove(id);
  }
}
