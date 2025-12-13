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
  Request,
} from '@nestjs/common';
import { ReceiptVoucherService } from './receipt-voucher.service';
import { CreateReceiptVoucherRequest } from './dtos/request/create-receipt-voucher.request';
import { UpdateReceiptVoucherRequest } from './dtos/request/update-receipt-voucher.request';
import { ReceiptVoucherResponse } from './dtos/response/receipt-voucher.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('receipt-vouchers')
export class ReceiptVoucherController {
  constructor(private readonly receiptVoucherService: ReceiptVoucherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['receipt_voucher:create'] })
  async createReceiptVoucher(
    @Body() createDto: CreateReceiptVoucherRequest,
    @Request() req: any,
    @currentCompany('id') companyId: string,
  ): Promise<ReceiptVoucherResponse> {
    // Use user's branchId as default if not provided
    const branchId = createDto.branchId || req.user.branchId || null;
    return this.receiptVoucherService.createReceiptVoucher(
      companyId,
      { ...createDto, branchId },
      req.user.id,
    );
  }

  @Get()
  @Auth({ permissions: ['receipt_voucher:read'] })
  @Serialize(ReceiptVoucherResponse, ReceiptVoucherResponse)
  async findAllReceiptVouchers(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<ReceiptVoucherResponse[]> {
    return this.receiptVoucherService.findAllReceiptVouchers(companyId, search);
  }

  @Get(':id')
  @Auth({ permissions: ['receipt_voucher:read'] })
  async findOneReceiptVoucher(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<ReceiptVoucherResponse> {
    return this.receiptVoucherService.findOneReceiptVoucher(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['receipt_voucher:update'] })
  async updateReceiptVoucher(
    @Param('id') id: string,
    @Body() updateDto: UpdateReceiptVoucherRequest,
    @currentCompany('id') companyId: string,
  ): Promise<ReceiptVoucherResponse> {
    return this.receiptVoucherService.updateReceiptVoucher(companyId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['receipt_voucher:delete'] })
  async removeReceiptVoucher(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.receiptVoucherService.removeReceiptVoucher(companyId, id);
  }
}
