import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [UnitController],
  providers: [UnitService, DatabaseService],
  exports: [UnitService],
})
export class UnitModule {}
