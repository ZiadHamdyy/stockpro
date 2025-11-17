import {
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportPdfService } from './report-pdf.service.js';
import { ExportPdfDto } from './dtos/export-pdf.dto.js';
import { JwtAuthenticationGuard } from '../../common/guards/strategy.guards/jwt.guard.js';

@UseGuards(JwtAuthenticationGuard)
@Controller('report-pdf')
export class ReportPdfController {
  constructor(private readonly reportPdfService: ReportPdfService) {}

  @Post('export')
  @HttpCode(200)
  async export(@Body() dto: ExportPdfDto, @Res() res: Response) {
    const buffer = await this.reportPdfService.renderTableReport(dto);
    res.setHeader('Content-Type', 'application/pdf');
    const baseName = (dto.fileName || 'report').toString();
    const asciiFallback =
      baseName
        .replace(/[\r\n]/g, ' ')
        .replace(/"/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .slice(0, 80) || 'report';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallback}.pdf"`,
    );
    res.end(buffer);
  }
}
