import { Module } from '@nestjs/common';
import { ItemGroupService } from './item-group.service';
import { ItemGroupController } from './item-group.controller';
import { DatabaseService } from '../../configs/database/database.service';

@Module({
  controllers: [ItemGroupController],
  providers: [ItemGroupService, DatabaseService],
  exports: [ItemGroupService],
})
export class ItemGroupModule {}
