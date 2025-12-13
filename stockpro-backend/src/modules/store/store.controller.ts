import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { StockService } from './services/stock.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('stores')
@UseGuards(JwtAuthenticationGuard)
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly stockService: StockService,
  ) {}

  @Post()
  @Auth({ permissions: ['stores_data:create'] })
  create(
    @Body() createStoreDto: CreateStoreDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeService.create(companyId, createStoreDto);
  }

  @Get()
  @Auth({ permissions: ['stores_data:read'] })
  findAll(@currentCompany('id') companyId: string) {
    return this.storeService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['stores_data:read'] })
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['stores_data:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeService.update(companyId, id, updateStoreDto);
  }

  @Delete(':id')
  @Auth({ permissions: ['stores_data:delete'] })
  remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeService.remove(companyId, id);
  }

  @Get(':storeId/items/:itemId/balance')
  @Auth({ permissions: ['stores_data:read'] })
  async getItemBalance(
    @Param('storeId') storeId: string,
    @Param('itemId') itemId: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.stockService.getStoreItemBalanceInfo(companyId, storeId, itemId);
  }

  @Get('items/all')
  @Auth({ permissions: ['stores_data:read'] })
  async getAllStoreItems(@currentCompany('id') companyId: string) {
    return this.storeService.findAllStoreItems(companyId);
  }
}
