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
import { currentUser } from '../../common/decorators/currentUser.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';
import type { currentUserType } from '../../common/types/current-user.type';

@Controller('store-issue-vouchers')
@UseGuards(JwtAuthenticationGuard)
export class StoreIssueVoucherController {
  constructor(
    private readonly storeIssueVoucherService: StoreIssueVoucherService,
  ) {}

  @Post()
  @Auth({ permissions: ['store_issue_voucher:create'] })
  create(
    @Body() createStoreIssueVoucherDto: CreateStoreIssueVoucherDto,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeIssueVoucherService.create(
      companyId,
      createStoreIssueVoucherDto,
      user.branchId,
    );
  }

  @Get()
  @Auth({ permissions: ['store_issue_voucher:read'] })
  findAll(@currentCompany('id') companyId: string) {
    return this.storeIssueVoucherService.findAll(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['store_issue_voucher:read'] })
  findOne(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeIssueVoucherService.findOne(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['store_issue_voucher:update'] })
  update(
    @Param('id') id: string,
    @Body() updateStoreIssueVoucherDto: UpdateStoreIssueVoucherDto,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeIssueVoucherService.update(
      companyId,
      id,
      updateStoreIssueVoucherDto,
      user.branchId,
    );
  }

  @Delete(':id')
  @Auth({ permissions: ['store_issue_voucher:delete'] })
  remove(
    @Param('id') id: string,
    @currentUser() user: currentUserType,
    @currentCompany('id') companyId: string,
  ) {
    return this.storeIssueVoucherService.remove(companyId, id, user.branchId);
  }
}
