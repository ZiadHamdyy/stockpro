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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemRequest } from './dtos/request/create-item.request';
import { UpdateItemRequest } from './dtos/request/update-item.request';
import { ItemResponse } from './dtos/response/item.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';
import type { currentUserType } from '../../common/types/current-user.type';
import { StoreService } from '../store/store.service';
import { ItemImportService } from './services/item-import.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@Controller('items')
@UseGuards(JwtAuthenticationGuard)
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
    private readonly storeService: StoreService,
    private readonly itemImportService: ItemImportService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['add_item:create'] })
  async create(
    @Body() createItemDto: CreateItemRequest,
    @currentUser() user: currentUserType,
  ): Promise<ItemResponse> {
    return this.itemService.create(createItemDto, user);
  }

  @Get()
  @Auth({ permissions: ['items_list:read'] })
  async findAll(
    @Query('storeId') storeId?: string,
    @currentUser() user?: currentUserType,
  ): Promise<ItemResponse[]> {
    // If storeId not provided, get from current user's branch
    let finalStoreId = storeId;
    if (!finalStoreId && user?.branchId) {
      try {
        const store = await this.storeService.findByBranchId(user.branchId);
        finalStoreId = store.id;
      } catch (error) {
        // If store not found for branch, continue without storeId
        // This will return items with global stock (0 for new items)
      }
    }
    return this.itemService.findAll(finalStoreId);
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

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['add_item:create'] })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async importItems(
    @UploadedFile() file: Express.Multer.File,
    @currentUser() user: currentUserType,
  ) {
    return this.itemImportService.importFromExcel(file, user);
  }
}
