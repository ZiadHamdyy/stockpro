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
  UseGuards,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('items')
@UseGuards(JwtAuthenticationGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['add_item:create'] })
  async create(
    @Body() createItemDto: CreateItemRequest,
  ): Promise<ItemResponse> {
    return this.itemService.create(createItemDto);
  }

  @Get()
  @Auth({ permissions: ['items_list:read'] })
  async findAll(): Promise<ItemResponse[]> {
    return this.itemService.findAll();
  }

  @Get('code/:code')
  @Auth({ permissions: ['items_list:read'] })
  async findByCode(@Param('code') code: string): Promise<ItemResponse> {
    return this.itemService.findByCode(code);
  }

  @Get(':id')
  @Auth({ permissions: ['items_list:read'] })
  async findOne(@Param('id') id: string): Promise<ItemResponse> {
    return this.itemService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['add_item:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemRequest,
  ): Promise<ItemResponse> {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['add_item:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.itemService.remove(id);
  }
}
