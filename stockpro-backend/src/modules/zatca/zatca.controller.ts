import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZatcaService } from './zatca.service';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard';
import { Auth } from '../../common/decorators/auth.decorator';
import { currentCompany } from '../../common/decorators/company.decorator';

@Controller('zatca')
@UseGuards(JwtAuthenticationGuard)
export class ZatcaController {
  constructor(private readonly zatcaService: ZatcaService) {}

  @Post('process/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['sales_invoice:update'] })
  async processInvoice(
    @Param('invoiceId') invoiceId: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.zatcaService.processInvoiceForZatca(invoiceId);
  }

  @Post('submit/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @Auth({ permissions: ['sales_invoice:update'] })
  async submitInvoice(
    @Param('invoiceId') invoiceId: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.zatcaService.submitToZatca(invoiceId);
  }

  @Get('status/:invoiceId')
  @Auth({ permissions: ['sales_invoice:read'] })
  async getStatus(
    @Param('invoiceId') invoiceId: string,
    @currentCompany('id') companyId: string,
  ) {
    return this.zatcaService.getZatcaStatus(invoiceId);
  }

  @Get('xml/:invoiceId')
  @Auth({ permissions: ['sales_invoice:read'] })
  @Header('Content-Type', 'application/xml')
  async getXml(
    @Param('invoiceId') invoiceId: string,
    @currentCompany('id') companyId: string,
    @Res() res: Response,
  ) {
    const signedXml = await this.zatcaService.getSignedXml(invoiceId);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.xml"`);
    res.send(signedXml);
  }

  @Get('pdf/:invoiceId')
  @Auth({ permissions: ['sales_invoice:read'] })
  @Header('Content-Type', 'application/pdf')
  async getPdf(
    @Param('invoiceId') invoiceId: string,
    @currentCompany('id') companyId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.zatcaService.generatePdfA3(invoiceId);
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
    res.send(pdfBuffer);
  }
}

