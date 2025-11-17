import { Module } from '@nestjs/common';
import { ReportPdfController } from './report-pdf.controller.js';
import { ReportPdfService } from './report-pdf.service.js';

@Module({
  controllers: [ReportPdfController],
  providers: [ReportPdfService],
})
export class ReportPdfModule {}
