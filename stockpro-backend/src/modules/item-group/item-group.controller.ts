import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ItemGroupService } from './item-group.service';
import { CreateItemGroupRequest } from './dtos/request/create-item-group.request';
import { UpdateItemGroupRequest } from './dtos/request/update-item-group.request';
import { ItemGroupResponse } from './dtos/response/item-group.response';

@Controller('item-groups')
export class ItemGroupController {
  constructor(private readonly itemGroupService: ItemGroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createItemGroupDto: CreateItemGroupRequest): Promise<ItemGroupResponse> {
    return this.itemGroupService.create(createItemGroupDto);
  }

  @Get()
  async findAll(): Promise<ItemGroupResponse[]> {
    return this.itemGroupService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ItemGroupResponse> {
    return this.itemGroupService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateItemGroupDto: UpdateItemGroupRequest,
  ): Promise<ItemGroupResponse> {
    return this.itemGroupService.update(id, updateItemGroupDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemGroupService.remove(id);
  }
}

