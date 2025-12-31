import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { DatabaseModule } from '../../configs/database/database.module';
import { EmailModule } from '../../common/services/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}

