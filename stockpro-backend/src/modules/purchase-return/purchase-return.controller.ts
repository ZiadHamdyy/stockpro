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
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('purchase-returns')
@UseGuards(JwtAuthenticationGuard)
export class PurchaseReturnController {
  constructor(private readonly purchaseReturnService: PurchaseReturnService) {}

  @Post()
  create(
    @Body() createPurchaseReturnDto: CreatePurchaseReturnRequest,
    @currentUser() user: any,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseReturnService.create(
      companyId,
      createPurchaseReturnDto,
      user.id,
      user.branchId,
    );
  }

  @Get()
  findAll(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ) {
    return this.purchaseReturnService.findAll(companyId, search);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseReturnService.findOne(companyId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseReturnDto: UpdatePurchaseReturnRequest,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseReturnService.update(companyId, id, updatePurchaseReturnDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.purchaseReturnService.remove(companyId, id);
  }
}
