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

@Controller('payment-vouchers')
export class PaymentVoucherController {
  constructor(private readonly paymentVoucherService: PaymentVoucherService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ permissions: ['payment_voucher:create'] })
  async createPaymentVoucher(
    @Body() createDto: CreatePaymentVoucherRequest,
    @Request() req: any,
  ): Promise<PaymentVoucherResponse> {
    return this.paymentVoucherService.createPaymentVoucher(
      createDto,
      req.user.id,
    );
  }

  @Get()
  @Auth({ permissions: ['payment_voucher:read'] })
  async findAllPaymentVouchers(
    @Query('search') search?: string,
  ): Promise<PaymentVoucherResponse[]> {
    return this.paymentVoucherService.findAllPaymentVouchers(search);
  }

  @Get('expenses')
  @Auth({ permissions: ['payment_voucher:read'] })
  async getExpensePaymentVouchers(): Promise<PaymentVoucherResponse[]> {
    return this.paymentVoucherService.findExpenseVouchers();
  }

  @Get(':id')
  @Auth({ permissions: ['payment_voucher:read'] })
  async findOnePaymentVoucher(
    @Param('id') id: string,
  ): Promise<PaymentVoucherResponse> {
    return this.paymentVoucherService.findOnePaymentVoucher(id);
  }

  @Patch(':id')
  @Auth({ permissions: ['payment_voucher:update'] })
  async updatePaymentVoucher(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentVoucherRequest,
  ): Promise<PaymentVoucherResponse> {
    return this.paymentVoucherService.updatePaymentVoucher(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ permissions: ['payment_voucher:delete'] })
  async removePaymentVoucher(@Param('id') id: string): Promise<void> {
    return this.paymentVoucherService.removePaymentVoucher(id);
  }
}
