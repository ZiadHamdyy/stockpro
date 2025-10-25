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
import { StoreIssueVoucherService } from './store-issue-voucher.service';
import { CreateStoreIssueVoucherDto } from './dtos/create-store-issue-voucher.dto';
import { UpdateStoreIssueVoucherDto } from './dtos/update-store-issue-voucher.dto';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';

@Controller('store-issue-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreIssueVoucherController {
  constructor(
    private readonly storeIssueVoucherService: StoreIssueVoucherService,
  ) {}

  @Post()
  create(@Body() createStoreIssueVoucherDto: CreateStoreIssueVoucherDto) {
    return this.storeIssueVoucherService.create(createStoreIssueVoucherDto);
  }

  @Get()
  findAll() {
    return this.storeIssueVoucherService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storeIssueVoucherService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreIssueVoucherDto: UpdateStoreIssueVoucherDto,
  ) {
    return this.storeIssueVoucherService.update(id, updateStoreIssueVoucherDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeIssueVoucherService.remove(id);
  }
}
