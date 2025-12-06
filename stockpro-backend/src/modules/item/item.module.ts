import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { DatabaseService } from '../../configs/database/database.service';
import { StoreModule } from '../store/store.module';
import { ItemImportService } from './services/item-import.service';
import { FiscalYearModule } from '../fiscal-year/fiscal-year.module';

@Module({
  imports: [StoreModule, FiscalYearModule],
  controllers: [ItemController],
  providers: [ItemService, ItemImportService, DatabaseService],
  exports: [ItemService],
})
export class ItemModule {}
