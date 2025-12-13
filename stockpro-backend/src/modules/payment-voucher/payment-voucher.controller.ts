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
import { PaymentVoucherService } from './payment-voucher.service';
import { CreatePaymentVoucherRequest } from './dtos/request/create-payment-voucher.request';
import { UpdatePaymentVoucherRequest } from './dtos/request/update-payment-voucher.request';
import { PaymentVoucherResponse } from './dtos/response/payment-voucher.response';
import { Auth } from '../../common/decorators/auth.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('payment-vouchers')
export class PaymentVoucherController {
  constructor(private readonly paymentVoucherService: PaymentVoucherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['payment_voucher:create'] })
  async createPaymentVoucher(
    @Body() createDto: CreatePaymentVoucherRequest,
    @Request() req: any,
    @currentCompany('id') companyId: string,
  ): Promise<PaymentVoucherResponse> {
    // Use user's branchId as default if not provided
    const branchId = createDto.branchId || req.user.branchId || null;
    return this.paymentVoucherService.createPaymentVoucher(
      companyId,
      { ...createDto, branchId },
      req.user.id,
    );
  }

  @Get()
  @Auth({ permissions: ['payment_voucher:read'] })
  @Serialize(PaymentVoucherResponse, PaymentVoucherResponse)
  async findAllPaymentVouchers(
    @currentCompany('id') companyId: string,
    @Query('search') search?: string,
  ): Promise<PaymentVoucherResponse[]> {
    return this.paymentVoucherService.findAllPaymentVouchers(companyId, search);
  }

  @Get('expenses')
  @Auth({ permissions: ['payment_voucher:read'] })
  async getExpensePaymentVouchers(
    @currentCompany('id') companyId: string,
  ): Promise<PaymentVoucherResponse[]> {
    return this.paymentVoucherService.findExpenseVouchers(companyId);
  }

  @Get(':id')
  @Auth({ permissions: ['payment_voucher:read'] })
  async findOnePaymentVoucher(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<PaymentVoucherResponse> {
    return this.paymentVoucherService.findOnePaymentVoucher(companyId, id);
  }

  @Patch(':id')
  @Auth({ permissions: ['payment_voucher:update'] })
  async updatePaymentVoucher(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentVoucherRequest,
    @currentCompany('id') companyId: string,
  ): Promise<PaymentVoucherResponse> {
    return this.paymentVoucherService.updatePaymentVoucher(companyId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['payment_voucher:delete'] })
  async removePaymentVoucher(
    @Param('id') id: string,
    @currentCompany('id') companyId: string,
  ): Promise<void> {
    return this.paymentVoucherService.removePaymentVoucher(companyId, id);
  }
}
