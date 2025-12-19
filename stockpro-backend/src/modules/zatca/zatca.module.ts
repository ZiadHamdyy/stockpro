import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZatcaService } from './zatca.service';
import { ZatcaController } from './zatca.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { SequentialNumberService } from './services/sequential-number.service';
import { HashChainService } from './services/hash-chain.service';
import { UblXmlGeneratorService } from './services/ubl-xml-generator.service';
import { CsidSignatureService } from './services/csid-signature.service';
import { ZatcaApiService } from './services/zatca-api.service';
import { PdfGeneratorService } from './services/pdf-generator.service';

@Module({
  imports: [ConfigModule],
  controllers: [ZatcaController],
  providers: [
    ZatcaService,
    DatabaseService,
    SequentialNumberService,
    HashChainService,
    UblXmlGeneratorService,
    CsidSignatureService,
    ZatcaApiService,
    PdfGeneratorService,
  ],
  exports: [ZatcaService],
})
export class ZatcaModule {}

