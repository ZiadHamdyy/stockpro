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
import { ItemService } from './item.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createItemDto: CreateItemRequest,
  ): Promise<ItemResponse> {
    return this.itemService.create(createItemDto);
  }

  @Get()
  async findAll(): Promise<ItemResponse[]> {
    return this.itemService.findAll();
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<ItemResponse> {
    return this.itemService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ItemResponse> {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemRequest,
  ): Promise<ItemResponse> {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemService.remove(id);
  }
}
