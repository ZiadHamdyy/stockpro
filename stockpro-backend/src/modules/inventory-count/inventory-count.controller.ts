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
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('inventory-counts')
@UseGuards(JwtAuthenticationGuard)
export class InventoryCountController {
  constructor(
    private readonly inventoryCountService: InventoryCountService,
  ) {}

  @Post()
  @Auth({ permissions: ['inventory_count:create'] })
  create(
    @Body() createInventoryCountDto: CreateInventoryCountDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.inventoryCountService.create(companyId, createInventoryCountDto);
  }

  @Get()
  @Auth({ permissions: ['inventory_count:read'] })
  findAll(@currentCompany('id') companyId: string) {
    return this.inventoryCountService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['inventory_count:read'] })
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.inventoryCountService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['inventory_count:update'] })
  update(
    @Param('id') id: string,
    @Body() updateInventoryCountDto: UpdateInventoryCountDto,
    @currentCompany('id') companyId: string,
  ) {
    return this.inventoryCountService.update(companyId, id, updateInventoryCountDto);
  }

  @Post(':id/post')
  @Auth({ permissions: ['inventory_count:post'] })
  post(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.inventoryCountService.post(companyId, id);
  }

  @Delete(':id')
  @Auth({ permissions: ['inventory_count:delete'] })
  remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.inventoryCountService.remove(companyId, id);
  }
}

