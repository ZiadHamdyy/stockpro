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
import { Auth } from '../../common/decorators/auth.decorator';

@Controller('store-issue-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreIssueVoucherController {
  constructor(private readonly storeIssueVoucherService: StoreIssueVoucherService) {}

  @Post()
  @Auth({ permissions: ['store_issue_voucher:create'] })
  create(@Body() createStoreIssueVoucherDto: CreateStoreIssueVoucherDto) {
    return this.storeIssueVoucherService.create(createStoreIssueVoucherDto);
  }

  @Get()
  @Auth({ permissions: ['store_issue_voucher:read'] })
  findAll() {
    return this.storeIssueVoucherService.findAll();
  }

  @Get(':id')
  @Auth({ permissions: ['store_issue_voucher:read'] })
  findOne(@Param('id') id: string) {
    return this.storeIssueVoucherService.findOne(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_issue_voucher:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreIssueVoucherDto: UpdateStoreIssueVoucherDto,
  ) {
    return this.storeIssueVoucherService.update(id, updateStoreIssueVoucherDto);
  }

  @Delete(':id')
  @Auth({ permissions: ['store_issue_voucher:delete'] })
  remove(@Param('id') id: string) {
    return this.storeIssueVoucherService.remove(id);
  }
}
