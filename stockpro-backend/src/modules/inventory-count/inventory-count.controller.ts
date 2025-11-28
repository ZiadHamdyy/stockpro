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
import { InventoryCountService } from './inventory-count.service';
import { CreateInventoryCountDto } from './dtos/create-inventory-count.dto';
import { UpdateInventoryCountDto } from './dtos/update-inventory-count.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('inventory-counts')
@UseGuards(JwtAuthenticationGuard)
export class InventoryCountController {
  constructor(
    private readonly inventoryCountService: InventoryCountService,
  ) {}

  @Post()
  @Auth({ permissions: ['inventory_count:create'] })
  create(@Body() createInventoryCountDto: CreateInventoryCountDto) {
    return this.inventoryCountService.create(createInventoryCountDto);
  }

  @Get()
  @Auth({ permissions: ['inventory_count:read'] })
  findAll() {
    return this.inventoryCountService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['inventory_count:read'] })
  findOne(@Param('id') id: string) {
    return this.inventoryCountService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['inventory_count:update'] })
  update(
    @Param('id') id: string,
    @Body() updateInventoryCountDto: UpdateInventoryCountDto,
  ) {
    return this.inventoryCountService.update(id, updateInventoryCountDto);
  }

  @Post(':id/post')
  @Auth({ permissions: ['inventory_count:post'] })
  post(@Param('id') id: string) {
    return this.inventoryCountService.post(id);
  }

  @Delete(':id')
  @Auth({ permissions: ['inventory_count:delete'] })
  remove(@Param('id') id: string) {
    return this.inventoryCountService.remove(id);
  }
}

