import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchaseReturnService } from './purchase-return.service';
import { CreatePurchaseReturnRequest } from './dtos/request/create-purchase-return.request';
import { UpdatePurchaseReturnRequest } from './dtos/request/update-purchase-return.request';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { currentUser } from '../../common/decorators/currentUser.decorator';

@Controller('purchase-returns')
@UseGuards(JwtAuthenticationGuard)
export class PurchaseReturnController {
  constructor(private readonly purchaseReturnService: PurchaseReturnService) {}

  @Post()
  create(
    @Body() createPurchaseReturnDto: CreatePurchaseReturnRequest,
    @currentUser() user: any,
  ) {
    return this.purchaseReturnService.create(
      createPurchaseReturnDto,
      user.id,
      user.branchId,
    );
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.purchaseReturnService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseReturnService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseReturnDto: UpdatePurchaseReturnRequest,
  ) {
    return this.purchaseReturnService.update(id, updatePurchaseReturnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseReturnService.remove(id);
  }
}
