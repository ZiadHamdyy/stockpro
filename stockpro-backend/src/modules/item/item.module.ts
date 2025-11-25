import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { StoreModule } from '../store/store.module';
import { ItemImportService } from './services/item-import.service';

@Module({
  imports: [StoreModule],
  controllers: [ItemController],
  providers: [ItemService, ItemImportService, DatabaseService],
  exports: [ItemService],
})
export class ItemModule {}
