import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dtos/create-store.dto';
import { UpdateStoreDto } from './dtos/update-store.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('stores')
@UseGuards(JwtAuthenticationGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @Auth({ permissions: ['stores_data:create'] })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Get()
  @Auth({ permissions: ['stores_data:read'] })
  findAll() {
    return this.storeService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['stores_data:read'] })
  findOne(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['stores_data:update'] })
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @Auth({ permissions: ['stores_data:delete'] })
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
}
