import { Module } from '@nestjs/common';
import { RevenueCodeController } from './revenue-code.controller';
import { RevenueCodeService } from './revenue-code.service';
import { DatabaseModule } from '../../configs/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RevenueCodeController],
  providers: [RevenueCodeService],
  exports: [RevenueCodeService],
})
export class RevenueCodeModule {}
