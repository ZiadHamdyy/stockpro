import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [StoreModule],
  controllers: [ItemController],
  providers: [ItemService, DatabaseService],
  exports: [ItemService],
})
export class ItemModule {}
