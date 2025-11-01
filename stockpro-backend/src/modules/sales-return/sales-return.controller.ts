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
import { SalesReturnService } from './sales-return.service';
import { CreateSalesReturnRequest } from './dtos/request/create-sales-return.request';
import { UpdateSalesReturnRequest } from './dtos/request/update-sales-return.request';
import { SalesReturnResponse } from './dtos/response/sales-return.response';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('sales-returns')
@UseGuards(JwtAuthenticationGuard)
export class SalesReturnController {
  constructor(private readonly salesReturnService: SalesReturnService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['sales_return:create'] })
  async create(
    @Body() createSalesReturnDto: CreateSalesReturnRequest,
    @currentUser() user: any,
  ): Promise<SalesReturnResponse> {
    return this.salesReturnService.create(createSalesReturnDto, user.id, user.branchId);
  }

  @Get()
  @Auth({ permissions: ['sales_return:read'] })
  async findAll(
    @Query('search') search?: string,
  ): Promise<SalesReturnResponse[]> {
    return this.salesReturnService.findAll(search);
  }

  @Get(':id')
  @Auth({ permissions: ['sales_return:read'] })
  async findOne(@Param('id') id: string): Promise<SalesReturnResponse> {
    return this.salesReturnService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['sales_return:update'] })
  async update(
    @Param('id') id: string,
    @Body() updateSalesReturnDto: UpdateSalesReturnRequest,
    @currentUser() user: any,
  ): Promise<SalesReturnResponse> {
    return this.salesReturnService.update(id, updateSalesReturnDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['sales_return:delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    return this.salesReturnService.remove(id);
  }
}
