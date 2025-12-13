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
  UseGuards,
} from '@nestjs/common';
import { ItemGroupService } from './item-group.service';
import { CreateItemGroupRequest } from './dtos/request/create-item-group.request';
import { UpdateItemGroupRequest } from './dtos/request/update-item-group.request';
import { ItemGroupResponse } from './dtos/response/item-group.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('item-groups')
@UseGuards(JwtAuthenticationGuard)
export class ItemGroupController {
  constructor(private readonly itemGroupService: ItemGroupService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['item_groups:create'] })
  async create(
    @Body() createItemGroupDto: CreateItemGroupRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ItemGroupResponse> {
    return this.itemGroupService.create(companyId, createItemGroupDto);
  }

  @Get()
  @Auth({ permissions: ['item_groups:read'] })
  async findAll(
    @currentCompany('id') companyId: string,
  ): Promise<ItemGroupResponse[]> {
    return this.itemGroupService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['item_groups:read'] })
  async findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ItemGroupResponse> {
    return this.itemGroupService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['item_groups:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateItemGroupDto: UpdateItemGroupRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ItemGroupResponse> {
    return this.itemGroupService.update(companyId, id, updateItemGroupDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['item_groups:delete'] })
  async remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.itemGroupService.remove(companyId, id);
  }
}
