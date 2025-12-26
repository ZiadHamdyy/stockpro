import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, DatabaseService],
  exports: [BackupService],
})
export class BackupModule {}
