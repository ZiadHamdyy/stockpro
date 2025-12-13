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
import { currentCompany } from '../../common/decorators/company.decorator';
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
    @currentCompany('id') companyId: string,
  ): Promise<ItemResponse> {
    return this.itemService.create(companyId, createItemDto, user);
  }

  @Get()
  @Auth({ permissions: ['items_list:read'] })
  async findAll(
    @Query('storeId') storeId?: string,
    @Query('priceDate') priceDate?: string,
    @currentUser() user?: currentUserType,
    @currentCompany('id') companyId?: string,
  ): Promise<ItemResponse[]> {
    // If storeId not provided, get from current user's branch
    let finalStoreId = storeId;
    if (!finalStoreId && user?.branchId) {
      try {
        const store = await this.storeService.findByBranchId(companyId!, user.branchId);
        finalStoreId = store.id;
      } catch (error) {
        // If store not found for branch, continue without storeId
        // This will return items with global stock (0 for new items)
      }
    }
    return this.itemService.findAll(companyId!, finalStoreId, priceDate);
  }

  @Get('code/:code')
  @Auth({ permissions: ['items_list:read'] })
  async findByCode(
    @Param('code') code: string,
    @currentCompany('id') companyId: string,
  ): Promise<ItemResponse> {
    return this.itemService.findByCode(companyId, code);
  }

  @Get(':id')
  @Auth({ permissions: ['items_list:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ItemResponse> {
    return this.itemService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['add_item:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ItemResponse> {
    return this.itemService.update(companyId, id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['add_item:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.itemService.remove(companyId, id);
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
    @currentCompany('id') companyId: string,
  ) {
    return this.itemImportService.importFromExcel(companyId, file, user);
  }
}
